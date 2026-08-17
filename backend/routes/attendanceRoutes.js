const express = require("express");
const router = express.Router();
const { getMyAttendance, getDailyAttendance, getAttendanceTrend } = require("../controllers/attendanceController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/mine", protect, getMyAttendance);
router.get("/trend", protect, adminOnly, getAttendanceTrend);
router.get("/", protect, adminOnly, getDailyAttendance);

module.exports = router;
