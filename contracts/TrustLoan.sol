// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustLoan {
    event EligibilityChecked(
        address indexed applicant,
        uint256 income,
        uint256 expenses,
        uint256 loanAmount,
        string status,
        string reason
    );

    function checkEligibility(
        uint256 income,
        uint256 expenses,
        uint256 loanAmount
    ) public returns (string memory status, string memory reason) {
        require(income > 0, "Income must be greater than zero");
        
        // Calculate DTI: expenses * 100 / income so we get a percentage.
        // 40% DTI = 0.4
        uint256 dtiPercent = (expenses * 100) / income;

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
            status,
            reason
        );

        return (status, reason);
    }
}
