const simplifyDebts = (balances) => {
    const creditors = [];
    const debtors = [];

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
            upiId: creditor.upiId || "",
            amount: Number(payment.toFixed(2))
        });

        creditor.amount -= payment;
        debtor.amount -= payment;

        if (creditor.amount <= 0.01) {
            creditorIndex++;
        }

        if (debtor.amount <= 0.01) {
            debtorIndex++;
        }
    }

    return settlements;
};

module.exports = simplifyDebts;