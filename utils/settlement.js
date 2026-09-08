// ==================== DEBT SIMPLIFICATION ====================

const simplifyDebts = (balances) => {
    const creditors = [];
    const debtors = [];

    // Separate people who should receive money
    // and people who should pay money
    balances.forEach(person => {
        const balance = Number(person.balance);

        if (balance > 0.01) {
            creditors.push({
                ...person,
                amount: balance
            });
        } else if (balance < -0.01) {
            debtors.push({
                ...person,
                amount: Math.abs(balance)
            });
        }
    });

    const settlements = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    // Match debtors with creditors
    while (
        creditorIndex < creditors.length &&
        debtorIndex < debtors.length
    ) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];

        const payment = Math.min(
            creditor.amount,
            debtor.amount
        );

        settlements.push({
            from: debtor.user,
            fromEmail: debtor.email,

            to: creditor.user,
            toEmail: creditor.email,

            amount: Number(payment.toFixed(2))
        });

        creditor.amount -= payment;
        debtor.amount -= payment;

        // Move to next creditor when fully paid
        if (creditor.amount <= 0.01) {
            creditorIndex++;
        }

        // Move to next debtor when fully paid
        if (debtor.amount <= 0.01) {
            debtorIndex++;
        }
    }

    return settlements;
};


module.exports = simplifyDebts;