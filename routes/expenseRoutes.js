const express = require("express");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const authMiddleware = require("../middleware/authMiddleware");
const simplifyDebts = require("../utils/settlement");
const calculateShares = require("../utils/splitCalculator");

const router = express.Router();


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

        // Check required fields
        if (!group || !description || !amount || !paidBy) {
            return res.status(400).json({
                message: "Please provide group, description, amount and paidBy"
            });
        }

        // Check whether group exists
        const existingGroup = await Group.findById(group);

        if (!existingGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check whether logged-in user is a group member
        const isMember = existingGroup.members.some(
            memberId => memberId.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Check whether payer is a group member
        const payerIsMember = existingGroup.members.some(
            memberId => memberId.toString() === paidBy
        );

        if (!payerIsMember) {
            return res.status(400).json({
                message: "The person who paid must be a group member"
            });
        }


        // ==================== VALIDATE SPLIT ====================

        const selectedSplitType = splitType || "equal";
        const selectedSplits = splits || [];

        // EXACT SPLIT VALIDATION
        if (selectedSplitType === "exact") {

            if (selectedSplits.length === 0) {
                return res.status(400).json({
                    message: "Please provide exact split amounts"
                });
            }

            const totalSplitAmount = selectedSplits.reduce(
                (total, split) => total + Number(split.amount || 0),
                0
            );

            if (
                Math.abs(
                    totalSplitAmount - Number(amount)
                ) > 0.01
            ) {
                return res.status(400).json({
                    message:
                        "Exact split amounts must equal the total expense amount"
                });
            }
        }


        // PERCENTAGE SPLIT VALIDATION
        if (selectedSplitType === "percentage") {

            if (selectedSplits.length === 0) {
                return res.status(400).json({
                    message: "Please provide percentage splits"
                });
            }

            const totalPercentage = selectedSplits.reduce(
                (total, split) =>
                    total + Number(split.percentage || 0),
                0
            );

            if (
                Math.abs(
                    totalPercentage - 100
                ) > 0.01
            ) {
                return res.status(400).json({
                    message:
                        "Percentage splits must total 100%"
                });
            }
        }


        // ==================== CREATE EXPENSE ====================

        const expense = new Expense({
            group,
            description,
            amount,
            paidBy,
            splitType: selectedSplitType,
            splits: selectedSplits
        });

        await expense.save();

        res.status(201).json({
            message: "Expense added successfully",
            expense
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add expense",
            error: error.message
        });
    }
});


// ==================== GET GROUP EXPENSES ====================

router.get("/group/:groupId", authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check group membership
        const isMember = group.members.some(
            memberId => memberId.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Get expenses
        const expenses = await Expense.find({
            group: groupId
        })
            .populate("paidBy", "name email")
            .populate("splits.user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Expenses fetched successfully",
            expenses: expenses
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch expenses",
            error: error.message
        });
    }
});


// ==================== CALCULATE GROUP BALANCES ====================

router.get("/group/:groupId/balances", authMiddleware, async (req, res) => {
    try {
        const { groupId } = req.params;

        // Get group and members
        const group = await Group.findById(groupId)
            .populate("members", "name email");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check group membership
        const isMember = group.members.some(
            member => member._id.toString() === req.userId
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Get all expenses
        const expenses = await Expense.find({
            group: groupId
        });

        const balances = {};

        // Initialize every member's balance
        group.members.forEach(member => {
            balances[member._id.toString()] = 0;
        });


        // ==================== CALCULATE BALANCES ====================

        expenses.forEach(expense => {

            const payer = expense.paidBy.toString();

            // Calculate actual share for every member
            const shares = calculateShares(
                expense,
                group.members
            );

            // Give credit to the person who paid
            balances[payer] += expense.amount;

            // Deduct each person's actual share
            Object.keys(shares).forEach(userId => {
                balances[userId] -= shares[userId];
            });
        });


        // Convert IDs into readable user information
        const balanceDetails = group.members.map(member => ({
            user: member.name,
            email: member.email,
            balance: Number(
                balances[member._id.toString()].toFixed(2)
            )
        }));


        res.status(200).json({
            message: "Balances calculated successfully",
            balances: balanceDetails
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to calculate balances",
            error: error.message
        });
    }
});


// ==================== GET SETTLEMENTS ====================

router.get(
    "/group/:groupId/settlements",
    authMiddleware,
    async (req, res) => {

        try {
            const { groupId } = req.params;

            // Get group and members
            const group = await Group.findById(groupId)
                .populate("members", "name email");

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            // Check group membership
            const isMember = group.members.some(
                member => member._id.toString() === req.userId
            );

            if (!isMember) {
                return res.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            // Get all expenses
            const expenses = await Expense.find({
                group: groupId
            });

            const balances = {};

            // Initialize balances
            group.members.forEach(member => {
                balances[member._id.toString()] = 0;
            });


            // ==================== CALCULATE BALANCES ====================

            expenses.forEach(expense => {

                const payer = expense.paidBy.toString();

                // Calculate actual shares
                const shares = calculateShares(
                    expense,
                    group.members
                );

                // Credit the person who paid
                balances[payer] += expense.amount;

                // Deduct each person's actual share
                Object.keys(shares).forEach(userId => {
                    balances[userId] -= shares[userId];
                });
            });


            // Convert balances into readable format
            const balanceDetails = group.members.map(member => ({
                user: member.name,
                email: member.email,
                balance: Number(
                    balances[member._id.toString()].toFixed(2)
                )
            }));


            // ==================== SIMPLIFY DEBTS ====================

            const settlements = simplifyDebts(
                balanceDetails
            );


            res.status(200).json({
                message: "Settlements calculated successfully",
                settlements: settlements
            });

        } catch (error) {
            res.status(500).json({
                message: "Failed to calculate settlements",
                error: error.message
            });
        }
    }
);


module.exports = router;