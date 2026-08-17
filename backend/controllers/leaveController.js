const Leave = require("../models/Leave");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

// @route POST /api/leaves
// @access Private — any logged-in employee, for themselves only
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, fromDate, toDate, reason } = req.body;

  if (!leaveType || !fromDate || !toDate) {
    return res.status(400).json({ message: "Leave type, from date, and to date are required" });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (isNaN(from) || isNaN(to)) {
    return res.status(400).json({ message: "Invalid date" });
  }
  if (to < from) {
    return res.status(400).json({ message: "To date can't be before from date" });
  }

  // employee is always the requesting user — nobody can file a leave
  // request on someone else's behalf through this endpoint.
  const leave = await Leave.create({
    employee: req.user._id,
    leaveType,
    fromDate: from,
    toDate: to,
    reason,
  });

  // Notify all admins that a leave was applied
  await createNotification({
    recipient: null,
    type: "leave_applied",
    title: "Leave Request",
    message: `${req.user.fullName} applied for ${leaveType} leave`,
    link: "/leaves",
    triggeredBy: req.user._id,
  });

  res.status(201).json(leave);
});

// @route GET /api/leaves/mine
// @access Private
const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
  res.json(leaves);
});

// @route PUT /api/leaves/:id/cancel
// @access Private — only the requester, only while still pending
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  if (String(leave.employee) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only cancel your own leave requests" });
  }
  if (leave.status !== "pending") {
    return res.status(400).json({ message: `Can't cancel a request that's already ${leave.status}` });
  }

  leave.status = "cancelled";
  await leave.save();
  res.json(leave);
});

// @route GET /api/leaves?status=pending
// @access Admin only — company-wide view
const getAllLeaves = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  // on-leave-today filter
  if (req.query.today === "1") {
    const now = new Date();
    filter.status   = "approved";
    filter.fromDate = { $lte: now };
    filter.toDate   = { $gte: now };
  }

  // department filter
  if (req.query.department) {
    // need to join through employee — use populate + post-filter
  }

  const leaves = await Leave.find(filter)
    .sort({ createdAt: -1 })
    .populate("employee", "fullName email department designation employeeId")
    .populate("reviewedBy", "fullName");

  // dept filter post-populate
  if (req.query.department) {
    const dept = req.query.department;
    return res.json(leaves.filter(l => l.employee?.department === dept));
  }

  res.json(leaves);
});

// @route PUT /api/leaves/:id/review
// @access Admin only — approve or reject a pending request
const reviewLeave = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });
  if (leave.status !== "pending") {
    return res.status(400).json({ message: `This request was already ${leave.status}` });
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote || "";
  await leave.save();

  // Notify the employee about the decision
  await createNotification({
    recipient: leave.employee,
    type: status === "approved" ? "leave_approved" : "leave_rejected",
    title: `Leave ${status === "approved" ? "Approved" : "Rejected"}`,
    message: `Your ${leave.leaveType} leave request has been ${status}`,
    link: "/leaves",
    triggeredBy: req.user._id,
  });

  res.json(leave);
});

module.exports = { applyLeave, getMyLeaves, cancelLeave, getAllLeaves, reviewLeave };
