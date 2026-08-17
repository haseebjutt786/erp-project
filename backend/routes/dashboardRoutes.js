const express = require("express");
const router = express.Router();
const { getDashboardData, getAdminDashboardData } = require("../controllers/dashboardController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, getDashboardData);
router.get("/admin", protect, adminOnly, getAdminDashboardData);

module.exports = router;
