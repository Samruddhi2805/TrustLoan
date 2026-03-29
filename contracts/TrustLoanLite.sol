// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrustLoanLite {
    event EligibilityChecked(
        address indexed user,
        uint256 income,
        uint256 expenses,
        uint256 loanAmount,
        bool approved,
        string reason
    );

    struct EligibilityResult {
        bool approved;
        string reason;
        uint256 timestamp;
    }

    mapping(address => EligibilityResult) public eligibilityHistory;

    function checkEligibility(
        uint256 _income,
        uint256 _expenses,
        uint256 _loanAmount
    ) public {
        require(_income > 0, "Income must be greater than 0");
        require(_expenses >= 0, "Expenses cannot be negative");
        require(_loanAmount > 0, "Loan amount must be greater than 0");

        // Calculate DTI (Debt-to-Income ratio)
        // Using 18 decimal places for precision
        uint256 dti = (_expenses * 1e18) / _income;
        
        bool approved;
        string memory reason;

        if (dti < 4e17) { // 0.4 * 1e18 = 4e17
            approved = true;
            reason = "APPROVED";
        } else {
            approved = false;
            reason = "DTI_TOO_HIGH";
        }

        // Store result
        eligibilityHistory[msg.sender] = EligibilityResult({
            approved: approved,
            reason: reason,
            timestamp: block.timestamp
        });

        // Emit event
        emit EligibilityChecked(
            msg.sender,
            _income,
            _expenses,
            _loanAmount,
            approved,
            reason
        );
    }

    function getEligibility(address _user) public view returns (EligibilityResult memory) {
        return eligibilityHistory[_user];
    }

    function calculateDTI(uint256 _income, uint256 _expenses) public pure returns (uint256) {
        require(_income > 0, "Income must be greater than 0");
        return (_expenses * 1e18) / _income;
    }
}
