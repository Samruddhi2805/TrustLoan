// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustLoan {
    event EligibilityChecked(
        address indexed applicant,
        uint256 income,
        uint256 expenses,
        uint256 loanAmount,
        uint256 repaymentPeriod,
        uint256 dtiPercent,
        string status,
        string reason,
        uint256 timestamp
    );

    function checkEligibility(
        uint256 income,
        uint256 expenses,
        uint256 loanAmount,
        uint256 repaymentPeriod
    ) public returns (string memory status, string memory reason) {
        require(income > 0, "INVALID_INPUT");
        uint256 actualPeriod = repaymentPeriod > 0 ? repaymentPeriod : 12;
        
        // Prevent division by zero mathematically handled by hard EVM defaults, 
        // but let's make sure actualPeriod is never 0 even if sent 0
        uint256 monthlyRepayment = loanAmount / actualPeriod;
        
        // DTI = (monthly expenses + monthly loan repayment) / income
        // 40% DTI = 0.4. Multiply by 100 to compare as 40
        uint256 dtiPercent = ((expenses + monthlyRepayment) * 100) / income;

        if (dtiPercent < 40) {
            status = "APPROVED";
            reason = "DTI_WITHIN_LIMITS";
        } else {
            status = "REJECTED";
            reason = "DTI_TOO_HIGH";
        }

        emit EligibilityChecked(
            msg.sender,
            income,
            expenses,
            loanAmount,
            actualPeriod,
            dtiPercent,
            status,
            reason,
            block.timestamp
        );

        return (status, reason);
    }
}
