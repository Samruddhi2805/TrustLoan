#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

// Contract state key
const DATA_KEY: Symbol = Symbol::short(&"DATA");

#[derive(Clone)]
#[contracttype]
pub struct EligibilityResult {
    pub approved: bool,
    pub reason: String,
    pub timestamp: u64,
    pub user: Address,
    pub income: u64,
    pub expenses: u64,
    pub loan_amount: u64,
}

#[contract]
pub struct TrustLoanLiteStellar;

#[contractimpl]
impl TrustLoanLiteStellar {
    // Initialize the contract
    pub fn __init__(env: Env) {
        // Initialize with empty data
        let data: Vec<EligibilityResult> = Vec::new(&env);
        env.storage().instance().set(&DATA_KEY, &data);
    }

    // Check eligibility based on DTI ratio
    pub fn check_eligibility(
        env: Env,
        user: Address,
        income: u64,
        expenses: u64,
        loan_amount: u64,
    ) -> EligibilityResult {
        // Validate inputs
        if income == 0 {
            panic!("income must be greater than 0");
        }
        if expenses > income {
            panic!("expenses cannot exceed income");
        }
        if loan_amount == 0 {
            panic!("loan amount must be greater than 0");
        }

        // Calculate DTI (Debt-to-Income ratio)
        // Using scaled integer arithmetic (multiply by 10000 for 4 decimal places)
        let dti_scaled = (expenses * 10000) / income;
        let dti_threshold_scaled = 4000; // 0.4 * 10000

        let (approved, reason) = if dti_scaled < dti_threshold_scaled {
            (true, "APPROVED".to_string())
        } else {
            (false, "DTI_TOO_HIGH".to_string())
        };

        // Create result
        let result = EligibilityResult {
            approved,
            reason: reason.clone(),
            timestamp: env.ledger().timestamp(),
            user: user.clone(),
            income,
            expenses,
            loan_amount,
        };

        // Store result
        let mut data: Vec<EligibilityResult> = env
            .storage()
            .instance()
            .get(&DATA_KEY)
            .unwrap_or(Vec::new(&env));
        data.push_back(result.clone());
        env.storage().instance().set(&DATA_KEY, &data);

        // Emit event
        env.events().publish(
            Symbol::short(&"ELIGIBILITY_CHECKED"),
            (
                user,
                income,
                expenses,
                loan_amount,
                approved,
                reason.clone(),
            ),
        );

        result
    }

    // Get eligibility history for a user
    pub fn get_user_history(env: Env, user: Address) -> Vec<EligibilityResult> {
        let data: Vec<EligibilityResult> = env
            .storage()
            .instance()
            .get(&DATA_KEY)
            .unwrap_or(Vec::new(&env));

        let mut user_results: Vec<EligibilityResult> = Vec::new(&env);
        for result in data.iter() {
            if result.user == user {
                user_results.push_back(result.clone());
            }
        }
        user_results
    }

    // Get all eligibility results
    pub fn get_all_history(env: Env) -> Vec<EligibilityResult> {
        env.storage()
            .instance()
            .get(&DATA_KEY)
            .unwrap_or(Vec::new(&env))
    }

    // Calculate DTI ratio (returns scaled value, divide by 10000 to get actual ratio)
    pub fn calculate_dti(_env: Env, income: u64, expenses: u64) -> u64 {
        if income == 0 {
            panic!("income must be greater than 0");
        }
        (expenses * 10000) / income
    }

    // Get contract version
    pub fn version() -> u32 {
        1
    }
}
