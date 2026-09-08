const calculateShares = (expense, members) => {
    const shares = {};

    // Initialize every member's share
    members.forEach(member => {
        shares[member._id.toString()] = 0;
    });

    // ==================== EQUAL SPLIT ====================

    if (expense.splitType === "equal") {
        const share = expense.amount / members.length;

        members.forEach(member => {
            shares[member._id.toString()] = share;
        });
    }

    // ==================== EXACT SPLIT ====================

    else if (expense.splitType === "exact") {
        expense.splits.forEach(split => {
            shares[split.user.toString()] = split.amount;
        });
    }

    // ==================== PERCENTAGE SPLIT ====================

    else if (expense.splitType === "percentage") {
        expense.splits.forEach(split => {
            shares[split.user.toString()] =
                (expense.amount * split.percentage) / 100;
        });
    }

    return shares;
};

module.exports = calculateShares;