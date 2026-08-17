const express = require("express");
const router = express.Router();
const { registerUser, loginUser, toggleClock, toggleWFH } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { registerValidation, loginValidation } = require("../middleware/validators");

// authLimiter throttles repeated attempts per IP; validation runs before
// the request ever reaches the DB or bcrypt.
router.post("/register", authLimiter, registerValidation, registerUser);
router.post("/login", authLimiter, loginValidation, loginUser);
router.put("/clock", protect, toggleClock);
router.put("/wfh", protect, toggleWFH);

module.exports = router;
