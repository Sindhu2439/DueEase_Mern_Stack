const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        splitType: {
            type: String,
            enum: ["equal", "exact", "percentage"],
            default: "equal"
        },

        splits: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },

                amount: {
                    type: Number,
                    min: 0
                },

                percentage: {
                    type: Number,
                    min: 0,
                    max: 100
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Expense", expenseSchema);