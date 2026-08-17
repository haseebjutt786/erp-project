const express = require("express");
const router = express.Router();
const {
  generatePayroll,
  getPayrollByMonth,
  updatePayrollEntry,
  markAsPaid,
  getMyPayroll,
} = require("../controllers/payrollController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/mine", protect, getMyPayroll);

router.use(protect, adminOnly);
router.post("/generate", generatePayroll);
router.get("/", getPayrollByMonth);
router.put("/:id", updatePayrollEntry);
router.put("/:id/pay", markAsPaid);

module.exports = router;
