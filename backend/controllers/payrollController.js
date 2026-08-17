const Payroll = require("../models/Payroll");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

// @route POST /api/payroll/generate  { month: "2026-07" }
// @access Admin only
// Creates a draft Payroll entry for every active employee for the given
// month, seeded from their current basicSalary. Employees who already
// have an entry for that month are skipped (not duplicated or overwritten)
// — re-running this is always safe.
const generatePayroll = asyncHandler(async (req, res) => {
  const { month } = req.body;
  if (!month || !monthPattern.test(month)) {
    return res.status(400).json({ message: "Month is required in YYYY-MM format" });
  }

  const employees = await User.find({ isActive: true });
  const existing = await Payroll.find({ month }).select("employee");
  const alreadyDone = new Set(existing.map((p) => String(p.employee)));

  const toCreate = employees
    .filter((e) => !alreadyDone.has(String(e._id)))
    .map((e) => ({
      employee: e._id,
      month,
      basicSalary: e.basicSalary || 0,
      allowances: 0,
      bonus: 0,
      deductions: 0,
      netSalary: e.basicSalary || 0,
      generatedBy: req.user._id,
    }));

  if (toCreate.length > 0) {
    await Payroll.insertMany(toCreate);
  }

  await createNotification({
    recipient: null,
    type: "payroll_generated",
    title: "Payroll Generated",
    message: `${toCreate.length} payroll entries created for ${month}`,
    link: "/payroll",
    triggeredBy: req.user._id,
  });

  res.status(201).json({
    message: `Generated ${toCreate.length} payroll entr${toCreate.length === 1 ? "y" : "ies"} for ${month}`,
    created: toCreate.length,
    skipped: employees.length - toCreate.length,
  });
});

// @route GET /api/payroll?month=YYYY-MM
// @access Admin only
const getPayrollByMonth = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = month ? { month } : {};
  const entries = await Payroll.find(filter)
    .sort({ createdAt: -1 })
    .populate("employee", "fullName email department designation");
  res.json(entries);
});

// @route PUT /api/payroll/:id
// @access Admin only — adjust allowances/bonus/deductions before paying
const updatePayrollEntry = asyncHandler(async (req, res) => {
  const { allowances, bonus, deductions } = req.body;

  const entry = await Payroll.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: "Payroll entry not found" });
  if (entry.status === "paid") {
    return res.status(400).json({ message: "Can't edit an entry that's already marked as paid" });
  }

  if (allowances !== undefined) entry.allowances = Math.max(0, Number(allowances) || 0);
  if (bonus !== undefined) entry.bonus = Math.max(0, Number(bonus) || 0);
  if (deductions !== undefined) entry.deductions = Math.max(0, Number(deductions) || 0);

  await entry.save(); // pre-save hook recomputes netSalary
  res.json(entry);
});

// @route PUT /api/payroll/:id/pay
// @access Admin only
const markAsPaid = asyncHandler(async (req, res) => {
  const entry = await Payroll.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: "Payroll entry not found" });
  if (entry.status === "paid") {
    return res.status(400).json({ message: "Already marked as paid" });
  }

  entry.status = "paid";
  entry.paidOn = new Date();
  await entry.save();
  res.json(entry);
});

// @route GET /api/payroll/mine
// @access Private — employee's own payslip history
const getMyPayroll = asyncHandler(async (req, res) => {
  const entries = await Payroll.find({ employee: req.user._id }).sort({ month: -1 });
  res.json(entries);
});

module.exports = { generatePayroll, getPayrollByMonth, updatePayrollEntry, markAsPaid, getMyPayroll };
