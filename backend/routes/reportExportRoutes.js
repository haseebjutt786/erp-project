const express = require("express");
const router  = express.Router();
const {
  getMonthlyAttendanceReport,
  getOrgMonthlyAttendance,
  getProjectReport,
} = require("../controllers/reportExportController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

// Monthly attendance — employee gets own, admin can specify employeeId
router.get("/attendance/monthly",     getMonthlyAttendanceReport);

// Org-wide monthly — admin only
router.get("/attendance/org-monthly", adminOnly, getOrgMonthlyAttendance);

// Project/task report — role filtered inside controller
router.get("/projects",               getProjectReport);

module.exports = router;
