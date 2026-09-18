const express = require("express");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const simplifyDebts = require("../utils/settlement");
const calculateShares = require("../utils/splitCalculator");

const router = express.Router();


// ==================== SOCKET HELPER ====================

const getIO = (req) => {
    return req.app.get("io");
};


// ==================== CREATE EXPENSE ====================

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

        if (
            !group ||
            !description ||
            amount === undefined ||
            !paidBy
        ) {
            return res.status(400).json({
                message: "Please provide all required fields"
            });
        }

        const groupData = await Group.findById(group);

        if (!groupData) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = groupData.members.some(
            memberId =>
                memberId.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const isPayerMember = groupData.members.some(
            memberId =>
                memberId.toString() === paidBy.toString()
        );

        if (!isPayerMember) {
            return res.status(400).json({
                message: "Payer must be a group member"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Amount must be greater than 0"
            });
        }

        if (
            splitType === "exact" ||
            splitType === "percentage"
        ) {
            if (
                !Array.isArray(splits) ||
                splits.length === 0
            ) {
                return res.status(400).json({
                    message: "Please provide split details"
                });
            }
        }

        // ==================== EXACT VALIDATION ====================

        if (splitType === "exact") {
            const totalSplit = splits.reduce(
                (total, split) =>
                    total + Number(split.amount || 0),
                0
            );

            if (
                Math.abs(
                    totalSplit - Number(amount)
                ) > 0.01
            ) {
                return res.status(400).json({
                    message:
                        "Exact split amounts must equal the total expense"
                });
            }
        }

        // ==================== PERCENTAGE VALIDATION ====================

        if (splitType === "percentage") {
            const totalPercentage = splits.reduce(
                (total, split) =>
                    total +
                    Number(split.percentage || 0),
                0
            );

            if (
                Math.abs(
                    totalPercentage - 100
                ) > 0.01
            ) {
                return res.status(400).json({
                    message:
                        "Percentage split must total 100%"
                });
            }
        }

        const expense = new Expense({
            group,
            description,
            amount: Number(amount),
            paidBy,
            splitType: splitType || "equal",
            splits
        });

        await expense.save();

        const populatedExpense =
            await Expense.findById(expense._id)
                .populate(
                    "paidBy",
                    "name email upiId"
                )
                .populate(
                    "splits.user",
                    "name email upiId"
                );

        const io = getIO(req);

        if (io) {
            io.to(group.toString()).emit(
                "expenseAdded",
                {
                    message:
                        "A new expense was added",
                    expense: populatedExpense
                }
            );
        }

        res.status(201).json({
            message:
                "Expense created successfully",
            expense: populatedExpense
        });

    } catch (error) {
        res.status(500).json({
            message:
                "Failed to create expense",
            error: error.message
        });
    }
});


// ==================== GET GROUP EXPENSES ====================

router.get(
    "/group/:groupId",
    authMiddleware,
    async (req, res) => {
        try {
            const { groupId } = req.params;

            const group =
                await Group.findById(groupId);

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found"
                });
            }

            const isMember =
                group.members.some(
                    memberId =>
                        memberId.toString() ===
                        req.userId
                );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses =
                await Expense.find({
                    group: groupId
                })
                    .populate(
                        "paidBy",
                        "name email upiId"
                    )
                    .populate(
                        "splits.user",
                        "name email upiId"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.status(200).json({
                message:
                    "Expenses fetched successfully",
                expenses
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Failed to fetch expenses",
                error: error.message
            });
        }
    }
);


// ==================== DELETE EXPENSE ====================

router.delete(
    "/:expenseId",
    authMiddleware,
    async (req, res) => {
        try {
            const expense =
                await Expense.findById(
                    req.params.expenseId
                );

            if (!expense) {
                return res.status(404).json({
                    message:
                        "Expense not found"
                });
            }

            const group =
                await Group.findById(
                    expense.group
                );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found"
                });
            }

            const isMember =
                group.members.some(
                    memberId =>
                        memberId.toString() ===
                        req.userId
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

            const groupId =
                expense.group.toString();

            const io = getIO(req);

            if (io) {
                io.to(groupId).emit(
                    "expenseDeleted",
                    {
                        message:
                            "An expense was deleted",
                        expenseId:
                            req.params.expenseId
                    }
                );
            }

            res.status(200).json({
                message:
                    "Expense deleted successfully"
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Failed to delete expense",
                error: error.message
            });
        }
    }
);


// ==================== BALANCES ====================

router.get(
    "/group/:groupId/balances",
    authMiddleware,
    async (req, res) => {
        try {
            const { groupId } = req.params;

            const group =
                await Group.findById(groupId)
                    .populate(
                        "members",
                        "name email upiId"
                    );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found"
                });
            }

            const isMember =
                group.members.some(
                    member =>
                        member._id.toString() ===
                        req.userId
                );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses =
                await Expense.find({
                    group: groupId
                });

            const balances = {};

            group.members.forEach(member => {
                balances[
                    member._id.toString()
                ] = 0;
            });

            expenses.forEach(expense => {
                const shares =
                    calculateShares(
                        expense,
                        group.members
                    );

                const payerId =
                    expense.paidBy.toString();

                balances[payerId] +=
                    Number(expense.amount);

                Object.keys(shares).forEach(
                    userId => {
                        balances[userId] -=
                            Number(
                                shares[userId] || 0
                            );
                    }
                );
            });

            const balanceList =
                group.members.map(member => ({
                    user: member.name,
                    email: member.email,
                    upiId:
                        member.upiId || "",
                    balance:
                        Number(
                            balances[
                                member._id.toString()
                            ].toFixed(2)
                        )
                }));

            res.status(200).json({
                message:
                    "Balances calculated successfully",
                balances: balanceList
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Failed to calculate balances",
                error: error.message
            });
        }
    }
);


// ==================== SETTLEMENTS ====================

router.get(
    "/group/:groupId/settlements",
    authMiddleware,
    async (req, res) => {
        try {
            const { groupId } = req.params;

            const group =
                await Group.findById(groupId)
                    .populate(
                        "members",
                        "name email upiId"
                    );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found"
                });
            }

            const isMember =
                group.members.some(
                    member =>
                        member._id.toString() ===
                        req.userId
                );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses =
                await Expense.find({
                    group: groupId
                });

            const balances = {};

            group.members.forEach(member => {
                balances[
                    member._id.toString()
                ] = 0;
            });

            expenses.forEach(expense => {
                const shares =
                    calculateShares(
                        expense,
                        group.members
                    );

                const payerId =
                    expense.paidBy.toString();

                balances[payerId] +=
                    Number(expense.amount);

                Object.keys(shares).forEach(
                    userId => {
                        balances[userId] -=
                            Number(
                                shares[userId] || 0
                            );
                    }
                );
            });

            const balanceList =
                group.members.map(member => ({
                    user: member._id,
                    name: member.name,
                    email: member.email,
                    upiId:
                        member.upiId || "",
                    balance:
                        Number(
                            balances[
                                member._id.toString()
                            ].toFixed(2)
                        )
                }));

            const settlements =
                simplifyDebts(balanceList);

            res.status(200).json({
                message:
                    "Settlements calculated successfully",
                settlements
            });

        } catch (error) {
            res.status(500).json({
                message:
                    "Failed to calculate settlements",
                error: error.message
            });
        }
    }
);


// ==================== ANALYTICS ====================

router.get(
    "/group/:groupId/analytics",
    authMiddleware,
    async (req, res) => {
        try {
            const { groupId } = req.params;

            const group =
                await Group.findById(groupId)
                    .populate(
                        "members",
                        "name email upiId"
                    );

            if (!group) {
                return res.status(404).json({
                    message:
                        "Group not found"
                });
            }

            const isMember =
                group.members.some(
                    member =>
                        member._id.toString() ===
                        req.userId
                );

            if (!isMember) {
                return res.status(403).json({
                    message:
                        "You are not a member of this group"
                });
            }

            const expenses =
                await Expense.find({
                    group: groupId
                })
                    .populate(
                        "paidBy",
                        "name email upiId"
                    )
                    .populate(
                        "splits.user",
                        "name email upiId"
                    )
                    .sort({
                        createdAt: 1
                    });


            // =========================
            // TOTAL SPENDING
            // =========================

            const totalSpending =
                expenses.reduce(
                    (total, expense) =>
                        total +
                        Number(
                            expense.amount || 0
                        ),
                    0
                );


            // =========================
            // AVERAGE EXPENSE
            // =========================

            const averageExpense =
                expenses.length > 0
                    ? totalSpending /
                      expenses.length
                    : 0;


            // =========================
            // PAID BY MEMBER
            // =========================

            const paidByMember = {};

            group.members.forEach(member => {

                paidByMember[
                    member._id.toString()
                ] = {
                    userId:
                        member._id.toString(),

                    name:
                        member.name || "User",

                    email:
                        member.email || "",

                    amount: 0
                };

            });


            expenses.forEach(expense => {

                if (!expense.paidBy) {
                    return;
                }

                const payerId =
                    expense.paidBy._id.toString();

                if (
                    paidByMember[payerId]
                ) {
                    paidByMember[
                        payerId
                    ].amount +=
                        Number(
                            expense.amount || 0
                        );
                }

            });


            const paidByMemberList =
                Object.values(
                    paidByMember
                ).map(member => ({
                    userId:
                        member.userId,

                    name:
                        member.name,

                    email:
                        member.email,

                    amount:
                        Number(
                            member.amount.toFixed(2)
                        )
                }));


            // =========================
            // EXPENSE DISTRIBUTION
            // =========================

            const spendingByExpense =
                expenses.map(expense => ({
                    id:
                        expense._id.toString(),

                    description:
                        expense.description ||
                        "Expense",

                    amount:
                        Number(
                            expense.amount || 0
                        ),

                    paidBy:
                        expense.paidBy
                            ? expense.paidBy.name
                            : "User"
                }));


            // =========================
            // SPLIT TYPE DISTRIBUTION
            // =========================

            const expenseDistribution = {
                equal: 0,
                exact: 0,
                percentage: 0
            };

            expenses.forEach(expense => {

                const type =
                    expense.splitType ||
                    "equal";

                if (
                    expenseDistribution[type]
                    !== undefined
                ) {
                    expenseDistribution[type] += 1;
                }

            });


            // =========================
            // CURRENT USER PAID AMOUNT
            // =========================

            let yourPaidAmount = 0;

            expenses.forEach(expense => {

                if (
                    expense.paidBy &&
                    expense.paidBy._id
                        .toString() ===
                        req.userId
                ) {
                    yourPaidAmount +=
                        Number(
                            expense.amount || 0
                        );
                }

            });


            // =========================
            // CURRENT USER SHARE
            // =========================

            let yourShare = 0;

            expenses.forEach(expense => {

                const shares =
                    calculateShares(
                        expense,
                        group.members
                    );

                if (
                    shares &&
                    shares[req.userId]
                ) {
                    yourShare +=
                        Number(
                            shares[req.userId]
                        );
                }

            });


            // =========================
            // MONTHLY SPENDING
            // =========================

            const monthlySpending = {};

            expenses.forEach(expense => {

                const date =
                    new Date(
                        expense.createdAt
                    );

                const month =
                    date.toLocaleString(
                        "en-US",
                        {
                            month: "short",
                            year: "numeric"
                        }
                    );

                if (
                    !monthlySpending[month]
                ) {
                    monthlySpending[month] = 0;
                }

                monthlySpending[month] +=
                    Number(
                        expense.amount || 0
                    );

            });


            const monthlyData =
                Object.entries(
                    monthlySpending
                ).map(
                    ([month, amount]) => ({
                        month,
                        amount:
                            Number(
                                amount.toFixed(2)
                            )
                    })
                );


            // =========================
            // FINAL RESPONSE
            // =========================

            res.status(200).json({

                message:
                    "Analytics fetched successfully",

                totalSpending:
                    Number(
                        totalSpending.toFixed(2)
                    ),

                totalExpenses:
                    expenses.length,

                averageExpense:
                    Number(
                        averageExpense.toFixed(2)
                    ),

                yourPaidAmount:
                    Number(
                        yourPaidAmount.toFixed(2)
                    ),

                yourShare:
                    Number(
                        yourShare.toFixed(2)
                    ),

                paidByMember:
                    paidByMemberList,

                spendingByExpense:
                    spendingByExpense,

                expenseDistribution:
                    expenseDistribution,

                monthlySpending:
                    monthlyData
            });

        } catch (error) {

            console.error(
                "Analytics Error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch analytics",

                error:
                    error.message
            });
        }
    }
);


module.exports = router;