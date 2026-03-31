#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Vec, Map,
    symbol_short,
};

// TTL extension: ~8 days at 5s per ledger
const LEDGER_BUMP: u32 = 138_240;

// ─── Data Types ───────────────────────────────────────────────────────────────

/// Employment type affects the safety threshold
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum EmploymentType {
    Salaried,
    SelfEmployed,
}

/// 3-tier safety verdict
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum Advice {
    Safe,       // DTI < 30% AND disposable > 30% income
    Caution,    // DTI 30-50% OR disposable 10-30%
    DoNotTake,  // DTI > 50% OR disposable < 10% or negative
}

/// Full loan safety evaluation result — stored on-chain per user
#[derive(Clone, Debug)]
#[contracttype]
pub struct LoanEvaluation {
    pub user: Address,
    pub timestamp: u64,
    pub ledger_sequence: u32,
    // Inputs (whole rupees)
    pub income: u64,
    pub existing_emis: u64,
    pub new_emi: u64,
    pub expenses: u64,
    pub employment: EmploymentType,
    // Derived metrics (scaled ×10000 for 2 d.p., e.g. 3750 = 37.50%)
    pub dti_pct_scaled: u64,
    pub disposable_income: i64,       // signed — can be negative
    pub disposable_pct_scaled: i64,   // signed — can be negative
    // Stress simulation: 20% income drop
    pub stress_income: u64,
    pub stress_dti_pct_scaled: u64,
    pub stress_disposable: i64,
    // Verdict
    pub advice: Advice,
}

// Storage key names
const HISTORY_MAP: soroban_sdk::Symbol = symbol_short!("HIST_MAP");
const TX_COUNT: soroban_sdk::Symbol = symbol_short!("TX_CNT");

// ─── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct TrustLoanSafety;

#[contractimpl]
impl TrustLoanSafety {
    /// Evaluate loan safety and persist the result on-chain.
    ///
    /// All monetary values are whole rupee amounts (u64).
    /// Interest rate and tenure are handled off-chain (EMI pre-calculated).
    ///
    /// # Arguments
    /// * `user`          — caller's Stellar address (must authorise)
    /// * `income`        — monthly income in ₹
    /// * `existing_emis` — sum of current monthly EMI obligations in ₹
    /// * `new_emi`       — proposed new loan's monthly EMI in ₹
    /// * `expenses`      — essential monthly expenses (rent, food, bills) in ₹
    /// * `employment`    — Salaried or SelfEmployed (affects buffer threshold)
    pub fn evaluate(
        env: Env,
        user: Address,
        income: u64,
        existing_emis: u64,
        new_emi: u64,
        expenses: u64,
        employment: EmploymentType,
    ) -> LoanEvaluation {
        // 1. Require caller auth
        user.require_auth();

        // 2. Input validation
        assert!(income > 0,  "income must be greater than 0");
        assert!(new_emi > 0, "new_emi must be greater than 0");

        // 3. Core metric calculations (integer arithmetic, no f64)
        let total_emis: u64 = existing_emis.saturating_add(new_emi);

        // DTI % scaled: (total_emis / income) * 10000
        // e.g. income=75000, emis=30000 → 30000*10000/75000 = 4000 = 40.00%
        let dti_pct_scaled: u64 = total_emis.saturating_mul(10_000) / income;

        // Disposable income = income - emis - expenses
        let outgo: u64 = total_emis.saturating_add(expenses);
        let disposable_income: i64 = income as i64 - outgo as i64;

        // Disposable % scaled: (disposable / income) * 10000 [signed]
        let disposable_pct_scaled: i64 = (disposable_income * 10_000) / income as i64;

        // 4. Stress simulation: 20% income drop
        let stress_income: u64 = income.saturating_mul(80) / 100;
        let stress_dti_pct_scaled: u64 = if stress_income > 0 {
            total_emis.saturating_mul(10_000) / stress_income
        } else {
            u64::MAX
        };
        let stress_disposable: i64 = stress_income as i64 - outgo as i64;

        // 5. Safety decision — strict 3-tier rules
        // Self-employed users need a higher buffer (35% vs 30%)
        let safe_disp_threshold: i64 = match employment {
            EmploymentType::SelfEmployed => 3_500, // 35.00%
            EmploymentType::Salaried     => 3_000, // 30.00%
        };

        let advice = if dti_pct_scaled > 5_000 || disposable_pct_scaled < 1_000 {
            // DTI > 50% OR disposable < 10%
            Advice::DoNotTake
        } else if dti_pct_scaled < 3_000 && disposable_pct_scaled >= safe_disp_threshold {
            // DTI < 30% AND disposable > threshold
            Advice::Safe
        } else {
            // Everything in between
            Advice::Caution
        };

        // 6. Assemble result
        let evaluation = LoanEvaluation {
            user: user.clone(),
            timestamp: env.ledger().timestamp(),
            ledger_sequence: env.ledger().sequence(),
            income,
            existing_emis,
            new_emi,
            expenses,
            employment,
            dti_pct_scaled,
            disposable_income,
            disposable_pct_scaled,
            stress_income,
            stress_dti_pct_scaled,
            stress_disposable,
            advice,
        };

        // 7. Persistent per-user history using Map<Address, Vec<LoanEvaluation>>
        let mut history_map: Map<Address, Vec<LoanEvaluation>> = env
            .storage()
            .persistent()
            .get(&HISTORY_MAP)
            .unwrap_or(Map::new(&env));

        let mut user_history: Vec<LoanEvaluation> = history_map
            .get(user.clone())
            .unwrap_or(Vec::new(&env));

        user_history.push_back(evaluation.clone());
        history_map.set(user.clone(), user_history);

        env.storage().persistent().set(&HISTORY_MAP, &history_map);
        env.storage()
            .persistent()
            .extend_ttl(&HISTORY_MAP, LEDGER_BUMP, LEDGER_BUMP);

        // 8. Global transaction counter
        let count: u64 = env.storage().instance().get(&TX_COUNT).unwrap_or(0u64);
        env.storage().instance().set(&TX_COUNT, &(count + 1));

        // 9. Emit on-chain event (indexable via Horizon event stream)
        // topic: ("loan_eval", advice_u32)
        // value: (dti_pct_scaled, disposable_pct_scaled)
        let advice_u32: u32 = match advice {
            Advice::Safe      => 0,
            Advice::Caution   => 1,
            Advice::DoNotTake => 2,
        };
        env.events().publish(
            (symbol_short!("loan_eval"), advice_u32),
            (dti_pct_scaled, disposable_pct_scaled, stress_disposable),
        );

        evaluation
    }

    /// Return the last N evaluations for a given user.
    pub fn get_history(env: Env, user: Address) -> Vec<LoanEvaluation> {
        let history_map: Map<Address, Vec<LoanEvaluation>> = env
            .storage()
            .persistent()
            .get(&HISTORY_MAP)
            .unwrap_or(Map::new(&env));

        history_map.get(user).unwrap_or(Vec::new(&env))
    }

    /// Return total evaluations processed by the contract (all users).
    pub fn get_tx_count(env: Env) -> u64 {
        env.storage().instance().get(&TX_COUNT).unwrap_or(0u64)
    }

    /// Pure DTI utility — call via simulation (no auth, no state change).
    /// Returns value scaled ×10000. Divide by 100 to get XX.XX%.
    pub fn calc_dti(_env: Env, income: u64, existing_emis: u64, new_emi: u64) -> u64 {
        assert!(income > 0, "income must be > 0");
        existing_emis
            .saturating_add(new_emi)
            .saturating_mul(10_000)
            / income
    }

    /// Contract version — bump on each upgrade.
    pub fn version(_env: Env) -> u32 {
        2
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, Address, TrustLoanSafetyClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, TrustLoanSafety);
        let client = TrustLoanSafetyClient::new(&env, &contract_id);
        let user = Address::generate(&env);
        (env, user, client)
    }

    #[test]
    fn test_safe_loan() {
        let (_env, user, client) = setup();
        // Income 100k, emis 20k, expenses 30k → DTI=20%, disposable=50%
        let result = client.evaluate(
            &user,
            &100_000, // income
            &10_000,  // existing EMIs
            &10_000,  // new EMI
            &30_000,  // expenses
            &EmploymentType::Salaried,
        );
        assert_eq!(result.advice, Advice::Safe);
        assert_eq!(result.dti_pct_scaled, 2_000); // 20.00%
    }

    #[test]
    fn test_caution_loan() {
        let (_env, user, client) = setup();
        // Income 75k, emis 30k, expenses 25k → DTI=40%, disposable=26.7%
        let result = client.evaluate(
            &user,
            &75_000,
            &15_000,
            &15_000,
            &25_000,
            &EmploymentType::Salaried,
        );
        assert_eq!(result.advice, Advice::Caution);
    }

    #[test]
    fn test_danger_high_dti() {
        let (_env, user, client) = setup();
        // Income 50k, emis 40k, expenses 5k → DTI=80% → DoNotTake
        let result = client.evaluate(
            &user,
            &50_000,
            &20_000,
            &20_000,
            &5_000,
            &EmploymentType::Salaried,
        );
        assert_eq!(result.advice, Advice::DoNotTake);
    }

    #[test]
    fn test_danger_negative_disposable() {
        let (_env, user, client) = setup();
        // Income 30k, emis 20k, expenses 15k → disposable = -5000 → DoNotTake
        let result = client.evaluate(
            &user,
            &30_000,
            &10_000,
            &10_000,
            &15_000,
            &EmploymentType::SelfEmployed,
        );
        assert_eq!(result.advice, Advice::DoNotTake);
        assert!(result.disposable_income < 0);
    }

    #[test]
    fn test_tx_counter() {
        let (_env, user, client) = setup();
        assert_eq!(client.get_tx_count(), 0);
        client.evaluate(&user, &100_000, &0, &10_000, &20_000, &EmploymentType::Salaried);
        client.evaluate(&user, &100_000, &0, &10_000, &20_000, &EmploymentType::Salaried);
        assert_eq!(client.get_tx_count(), 2);
    }

    #[test]
    fn test_history_stored() {
        let (_env, user, client) = setup();
        client.evaluate(&user, &80_000, &5_000, &8_000, &20_000, &EmploymentType::Salaried);
        let history = client.get_history(&user);
        assert_eq!(history.len(), 1);
        assert_eq!(history.get(0).unwrap().income, 80_000);
    }

    #[test]
    fn test_stress_simulation() {
        let (_env, user, client) = setup();
        // Stress income should be 80% of actual
        let result = client.evaluate(
            &user,
            &100_000, &0, &20_000, &30_000, &EmploymentType::Salaried
        );
        assert_eq!(result.stress_income, 80_000);
        // Stressed DTI: 20_000 * 10_000 / 80_000 = 2500 = 25.00%
        assert_eq!(result.stress_dti_pct_scaled, 2_500);
    }
}
