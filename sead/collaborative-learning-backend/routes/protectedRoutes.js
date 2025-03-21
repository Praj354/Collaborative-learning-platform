const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// @route   GET /api/protected
// @desc    Protected route (only accessible with a valid token)
router.get("/", authMiddleware, (req, res) => {
  res.json({ msg: "You have accessed a protected route!", user: req.user });
});

module.exports = router;
