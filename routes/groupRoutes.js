const express = require("express");
const Group = require("../models/Group");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== CREATE GROUP ====================

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Please provide a group name"
            });
        }

        const group = new Group({
            name: name,
            createdBy: req.userId,
            members: [req.userId]
        });

        await group.save();

        // Real-time group update
        const io = req.app.get("io");

        if (io) {
            io.emit("groupUpdated", {
                message: "A new group was created",
                groupId: group._id
            });
        }

        res.status(201).json({
            message: "Group created successfully",
            group: group
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create group",
            error: error.message
        });
    }
});


// ==================== GET MY GROUPS ====================

router.get("/", authMiddleware, async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.userId
        }).populate("members", "name email");

        res.status(200).json({
            message: "Groups fetched successfully",
            groups: groups
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch groups",
            error: error.message
        });
    }
});


// ==================== ADD MEMBER TO GROUP ====================

router.post("/:groupId/members", authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        const { groupId } = req.params;

        // Check email
        if (!email) {
            return res.status(400).json({
                message: "Please provide member email"
            });
        }

        // Find the group
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Check if current user is a member
        const isGroupMember = group.members.some(
            memberId => memberId.toString() === req.userId
        );

        if (!isGroupMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found. Ask them to register first."
            });
        }

        // Check if user is already a member
        const alreadyMember = group.members.some(
            memberId => memberId.toString() === user._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                message: "User is already a member of this group"
            });
        }

        // Add user to group
        group.members.push(user._id);

        await group.save();

        // Real-time group update
        const io = req.app.get("io");

        if (io) {
            io.emit("groupUpdated", {
                message: "A new member was added to a group",
                groupId: group._id
            });
        }

        res.status(200).json({
            message: "Member added successfully",
            group: group
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add member",
            error: error.message
        });
    }
});


module.exports = router;