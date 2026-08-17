const express = require("express");
const router  = express.Router();
const {
  getAttendanceReport,
  getPayrollReport,
  getLeavesReport,
  getEmployeesReport,
  getTasksReport,
  getOverviewReport,
} = require("../controllers/reportsController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

router.get("/overview",    getOverviewReport);
router.get("/attendance",  getAttendanceReport);
router.get("/payroll",     getPayrollReport);
router.get("/leaves",      getLeavesReport);
router.get("/employees",   getEmployeesReport);
router.get("/tasks",       getTasksReport);

module.exports = router;
