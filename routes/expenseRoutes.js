const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");
const Group = require("../models/Group");

const authMiddleware = require("../middleware/authMiddleware");

const simplifyDebts = require("../utils/settlement");
const calculateShares = require("../utils/splitCalculator");


// =====================================================
// CREATE EXPENSE
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            group,
            description,
            amount,
            paidBy,
            splitType,
            splits
        } = req.body;

        const selectedGroup = await Group.findById(group);

        if (!selectedGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = selectedGroup.members.some(
            member =>
                member.toString() === req.user.id
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const payerIsMember = selectedGroup.members.some(
            member =>
                member.toString() === paidBy
        );

        if (!payerIsMember) {
            return res.status(400).json({
                message: "Payer must be a group member"
            });
        }

        // Validate exact split
        if (splitType === "exact") {

            const total = (splits || []).reduce(
                (sum, split) =>
                    sum + Number(split.amount || 0),
                0
            );

            if (Math.abs(total - Number(amount)) > 0.01) {
                return res.status(400).json({
                    message:
                        "Exact split amounts must equal the total expense"
                });
            }
        }

        // Validate percentage split
        if (splitType === "percentage") {

            const totalPercentage = (splits || []).reduce(
                (sum, split) =>
                    sum + Number(split.percentage || 0),
                0
            );

            if (Math.abs(totalPercentage - 100) > 0.01) {
                return res.status(400).json({
                    message:
                        "Percentage splits must total 100%"
                });
            }
        }

        const expense = new Expense({
            group,
            description,
            amount,
            paidBy,
            splitType: splitType || "equal",
            splits: splits || []
        });

        await expense.save();

        res.status(201).json({
            message: "Expense created successfully",
            expense
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Server error while creating expense"
        });
    }
});


// =====================================================
// GET GROUP EXPENSES
// =====================================================

router.get(
    "/group/:groupId",
    authMiddleware,
    async (req, res) => {

        try {

            const group = await Group.findById(
                req.params.groupId
            ).populate(
                "members",
                "name email"
            );

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            const isMember = group.members.some(
                member =>
                    member._id.toString() === req.user.id
            );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses = await Expense.find({
                group: req.params.groupId
            })
                .populate("paidBy", "name email")
                .populate("splits.user", "name email")
                .sort({
                    createdAt: -1
                });

            res.json({
                expenses
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Server error while fetching expenses"
            });
        }
    }
);


// =====================================================
// DELETE EXPENSE
// =====================================================

router.delete(
    "/:expenseId",
    authMiddleware,
    async (req, res) => {

        try {

            const expense = await Expense.findById(
                req.params.expenseId
            );

            if (!expense) {
                return res.status(404).json({
                    message: "Expense not found"
                });
            }

            const group = await Group.findById(
                expense.group
            );

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            const isMember = group.members.some(
                member =>
                    member.toString() === req.user.id
            );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            await Expense.findByIdAndDelete(
                req.params.expenseId
            );

            res.json({
                message:
                    "Expense deleted successfully"
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Unable to delete expense"
            });
        }
    }
);


// =====================================================
// GET GROUP BALANCES
// =====================================================

router.get(
    "/group/:groupId/balances",
    authMiddleware,
    async (req, res) => {

        try {

            const group = await Group.findById(
                req.params.groupId
            ).populate(
                "members",
                "name email"
            );

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            const isMember = group.members.some(
                member =>
                    member._id.toString() === req.user.id
            );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses = await Expense.find({
                group: req.params.groupId
            });

            const balances = {};

            group.members.forEach(member => {

                balances[member._id.toString()] = {
                    user: member.name,
                    email: member.email,
                    balance: 0
                };

            });

            expenses.forEach(expense => {

                const payerId =
                    expense.paidBy.toString();

                balances[payerId].balance +=
                    Number(expense.amount);

                const shares =
                    calculateShares(
                        expense,
                        group.members
                    );

                Object.keys(shares).forEach(userId => {

                    if (balances[userId]) {

                        balances[userId].balance -=
                            Number(shares[userId]);

                    }

                });

            });

            const result = Object.keys(balances).map(
                userId => ({
                    user: balances[userId].user,
                    email: balances[userId].email,
                    balance: Number(
                        balances[userId].balance.toFixed(2)
                    )
                })
            );

            res.json({
                message:
                    "Balances calculated successfully",
                balances: result
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Server error while calculating balances"
            });
        }
    }
);


// =====================================================
// GET SETTLEMENTS
// =====================================================

router.get(
    "/group/:groupId/settlements",
    authMiddleware,
    async (req, res) => {

        try {

            const group = await Group.findById(
                req.params.groupId
            ).populate(
                "members",
                "name email"
            );

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            const isMember = group.members.some(
                member =>
                    member._id.toString() === req.user.id
            );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses = await Expense.find({
                group: req.params.groupId
            });

            const balances = {};

            group.members.forEach(member => {

                balances[member._id.toString()] = {
                    user: member.name,
                    email: member.email,
                    balance: 0
                };

            });

            expenses.forEach(expense => {

                const payerId =
                    expense.paidBy.toString();

                balances[payerId].balance +=
                    Number(expense.amount);

                const shares =
                    calculateShares(
                        expense,
                        group.members
                    );

                Object.keys(shares).forEach(userId => {

                    if (balances[userId]) {

                        balances[userId].balance -=
                            Number(shares[userId]);

                    }

                });

            });

            const balanceArray = Object.keys(
                balances
            ).map(userId => ({
                user: balances[userId].user,
                email: balances[userId].email,
                balance: Number(
                    balances[userId].balance.toFixed(2)
                )
            }));

            const settlements =
                simplifyDebts(balanceArray);

            res.json({
                message:
                    "Settlements calculated successfully",
                settlements
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Server error while calculating settlements"
            });
        }
    }
);


// =====================================================
// EXPENSE ANALYTICS
// =====================================================

router.get(
    "/group/:groupId/analytics",
    authMiddleware,
    async (req, res) => {

        try {

            const group = await Group.findById(
                req.params.groupId
            ).populate(
                "members",
                "name email"
            );

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            // Check whether logged-in user belongs to group
            const isMember = group.members.some(
                member =>
                    member._id.toString() === req.user.id
            );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            // Get all expenses
            const expenses = await Expense.find({
                group: req.params.groupId
            })
                .populate("paidBy", "name email")
                .sort({
                    createdAt: 1
                });


            // -------------------------------------------------
            // TOTAL SPENDING
            // -------------------------------------------------

            const totalSpending = expenses.reduce(
                (sum, expense) =>
                    sum + Number(expense.amount),
                0
            );


            // -------------------------------------------------
            // NUMBER OF EXPENSES
            // -------------------------------------------------

            const totalExpenses =
                expenses.length;


            // -------------------------------------------------
            // AMOUNT PAID BY EACH MEMBER
            // -------------------------------------------------

            const paidByMember = {};

            group.members.forEach(member => {

                paidByMember[member._id.toString()] = {
                    userId: member._id,
                    name: member.name,
                    email: member.email,
                    amount: 0
                };

            });

            expenses.forEach(expense => {

                const payerId =
                    expense.paidBy._id.toString();

                if (paidByMember[payerId]) {

                    paidByMember[payerId].amount +=
                        Number(expense.amount);

                }

            });


            const paidByMemberResult =
                Object.values(paidByMember).map(
                    person => ({
                        ...person,
                        amount: Number(
                            person.amount.toFixed(2)
                        )
                    })
                );


            // -------------------------------------------------
            // YOUR TOTAL PAID
            // -------------------------------------------------

            let yourPaidAmount = 0;

            expenses.forEach(expense => {

                if (
                    expense.paidBy._id.toString() ===
                    req.user.id
                ) {

                    yourPaidAmount +=
                        Number(expense.amount);

                }

            });


            // -------------------------------------------------
            // YOUR SHARE
            // -------------------------------------------------

            let yourShare = 0;

            expenses.forEach(expense => {

                const shares =
                    calculateShares(
                        expense,
                        group.members
                    );

                if (shares[req.user.id]) {

                    yourShare +=
                        Number(shares[req.user.id]);

                }

            });


            // -------------------------------------------------
            // SPENDING BY EXPENSE
            // -------------------------------------------------

            const spendingByExpense =
                expenses.map(expense => ({
                    description:
                        expense.description,

                    amount:
                        Number(expense.amount),

                    paidBy:
                        expense.paidBy.name,

                    date:
                        expense.createdAt
                }));


            // -------------------------------------------------
            // MONTHLY SPENDING
            // -------------------------------------------------

            const monthlySpending = {};

            expenses.forEach(expense => {

                const date =
                    new Date(expense.createdAt);

                const month =
                    `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                    ).padStart(2, "0")}`;

                if (!monthlySpending[month]) {
                    monthlySpending[month] = 0;
                }

                monthlySpending[month] +=
                    Number(expense.amount);

            });

            const monthlySpendingResult =
                Object.keys(monthlySpending)
                    .sort()
                    .map(month => ({
                        month,
                        amount: Number(
                            monthlySpending[month].toFixed(2)
                        )
                    }));


            // -------------------------------------------------
            // FINAL RESPONSE
            // -------------------------------------------------

            res.json({

                message:
                    "Analytics calculated successfully",

                totalSpending:
                    Number(totalSpending.toFixed(2)),

                totalExpenses,

                yourPaidAmount:
                    Number(yourPaidAmount.toFixed(2)),

                yourShare:
                    Number(yourShare.toFixed(2)),

                paidByMember:
                    paidByMemberResult,

                spendingByExpense,

                monthlySpending:
                    monthlySpendingResult

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message:
                    "Server error while calculating analytics"
            });
        }
    }
);


module.exports = router;