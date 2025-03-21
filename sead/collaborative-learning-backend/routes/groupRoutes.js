const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const Group = require("../models/Group");
const { removeDisconnectedUsers } = require("../server"); // WebSocket disconnect function

const router = express.Router();

/**
 * ✅ Create a Study Group
 * Public groups: Anyone can join instantly
 * Private groups: Users must request to join
 */
router.post("/create", authMiddleware, async (req, res) => {
  const { name, description, isPrivate } = req.body;

  try {
    const existingGroup = await Group.findOne({ name }).lean();
    if (existingGroup) {
      return res.status(400).json({ msg: "Group name already taken" });
    }

    const group = new Group({
      name,
      description,
      isPrivate,
      admin: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
      pendingRequests: []
    });

    await group.save();
    res.status(201).json({ msg: "Group created successfully", group });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

/**
 * ✅ Request to Join a Private Group or Instantly Join Public Groups
 */
router.post("/join", authMiddleware, async (req, res) => {
  const { groupId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ msg: "Invalid group ID format" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    // Check if the user is already a member
    if (group.members.some((m) => m.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "You are already a member" });
    }

    // Private Group: Request approval
    if (group.isPrivate) {
      if (group.pendingRequests.includes(req.user.id)) {
        return res.status(400).json({ msg: "Request already pending" });
      }

      group.pendingRequests.push(req.user.id);
      await group.save();
      return res.json({ msg: "Join request sent. Waiting for admin approval." });
    }

    // Public Group: Join instantly
    group.members.push({ user: req.user.id, role: "member" });
    await group.save();
    res.json({ msg: "Joined group successfully", group });

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

/**
 * ✅ Admin Approves/Deny Join Requests
 */
router.post("/approve-member", authMiddleware, async (req, res) => {
  const { groupId, memberId, approve } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ msg: "Invalid ID format" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only the admin can approve members" });
    }

    if (!group.pendingRequests.includes(memberId)) {
      return res.status(400).json({ msg: "No pending request from this user" });
    }

    if (approve) {
      group.members.push({ user: memberId, role: "member" });
      group.pendingRequests = group.pendingRequests.filter(id => id.toString() !== memberId);
      await group.save();
      return res.json({ msg: "User approved and added to the group", group });
    } else {
      group.pendingRequests = group.pendingRequests.filter(id => id.toString() !== memberId);
      await group.save();
      return res.json({ msg: "Join request denied", group });
    }
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

/**
 * ✅ Fetch Pending Join Requests (Admin Only)
 */
router.get("/pending-requests/:groupId", authMiddleware, async (req, res) => {
  const { groupId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ msg: "Invalid group ID format" });
  }

  try {
    const group = await Group.findById(groupId).populate("pendingRequests", "username email");
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only the admin can view join requests" });
    }

    res.json({ pendingRequests: group.pendingRequests });

  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

/**
 * ✅ Remove a Member from a Group (Only Admins)
 */
router.post("/remove-member", authMiddleware, async (req, res) => {
  const { groupId, memberId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({ msg: "Invalid ID format" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    const requester = group.members.find((m) => m.user.toString() === req.user.id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ msg: "Only admins can remove members" });
    }

    const isMember = group.members.some((m) => m.user.toString() === memberId);
    if (!isMember) {
      return res.status(400).json({ msg: "User is not a member of this group" });
    }

    // Remove the member
    group.members = group.members.filter((m) => m.user.toString() !== memberId);
    await group.save();

    removeDisconnectedUsers(groupId, memberId);

    res.json({ msg: "Member removed successfully", group });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

/**
 * ✅ Delete a Group (Only Admin)
 */
router.delete("/delete/:groupId", authMiddleware, async (req, res) => {
  const { groupId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return res.status(400).json({ msg: "Invalid group ID format" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only the admin can delete this group" });
    }

    await Group.findByIdAndDelete(groupId);
    res.json({ msg: "Group deleted successfully" });
  } catch (err) {
    console.error("Server Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
