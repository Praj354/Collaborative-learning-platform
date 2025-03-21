const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");

const router = express.Router();

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post("/send", authMiddleware, async (req, res) => {
  const { groupId, message } = req.body;

  try {
    const chat = new Chat({
      groupId,
      sender: req.user.id,
      message
    });

    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET /api/chat/:groupId
// @desc    Get messages for a group
// @access  Private
router.get("/:groupId", authMiddleware, async (req, res) => {
  try {
    const messages = await Chat.find({ groupId: req.params.groupId }).populate("sender", "name");
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
