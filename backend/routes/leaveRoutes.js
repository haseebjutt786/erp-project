const express = require("express");
const router = express.Router();
const { applyLeave, getMyLeaves, cancelLeave, getAllLeaves, reviewLeave } = require("../controllers/leaveController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, applyLeave);
router.get("/mine", protect, getMyLeaves);
router.put("/:id/cancel", protect, cancelLeave);

router.get("/", protect, adminOnly, getAllLeaves);
router.put("/:id/review", protect, adminOnly, reviewLeave);

module.exports = router;