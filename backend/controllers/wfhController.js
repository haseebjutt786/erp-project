const WFHRequest = require("../models/WFHRequest");
const User       = require("../models/User");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

const toDateStr = (d) => d.toISOString().slice(0, 10);

// ── Employee: submit WFH request ─────────────────────────────────────────────
// @route POST /api/wfh
const submitWFHRequest = asyncHandler(async (req, res) => {
  const { date, reason, workType, location } = req.body;

  if (!date) return res.status(400).json({ message: "Date is required" });

  const reqDate = new Date(date);
  if (isNaN(reqDate)) return res.status(400).json({ message: "Invalid date" });

  // Prevent duplicate request for same day
  const exists = await WFHRequest.findOne({
    employee: req.user._id,
    date,
    status: { $in: ["pending", "approved"] },
  });
  if (exists) {
    return res.status(400).json({ message: "You already have a WFH request for this date" });
  }

  const wfh = await WFHRequest.create({
    employee: req.user._id,
    date,
    reason:   reason   || "",
    workType: workType || "home",
    location: location || "",
  });

  // Notify all admins
  await createNotification({
    recipient:   null,
    type:        "general",
    title:       "WFH Request",
    message:     `${req.user.fullName} submitted a WFH request for ${date}`,
    link:        "/wfh",
    triggeredBy: req.user._id,
  });

  await wfh.populate("employee", "fullName department designation employeeId");
  res.status(201).json(wfh);
});

// ── Employee: get own WFH requests ───────────────────────────────────────────
// @route GET /api/wfh/mine
const getMyWFHRequests = asyncHandler(async (req, res) => {
  const requests = await WFHRequest.find({ employee: req.user._id })
    .sort({ date: -1 })
    .populate("reviewedBy", "fullName");
  res.json(requests);
});

// ── Employee: cancel pending request ─────────────────────────────────────────
// @route PUT /api/wfh/:id/cancel
const cancelWFHRequest = asyncHandler(async (req, res) => {
  const wfh = await WFHRequest.findById(req.params.id);
  if (!wfh) return res.status(404).json({ message: "WFH request not found" });
  if (String(wfh.employee) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized" });
  }
  if (wfh.status !== "pending") {
    return res.status(400).json({ message: `Cannot cancel a ${wfh.status} request` });
  }
  wfh.status = "cancelled";
  await wfh.save();

  // If was approved, flip user.isWFH off if it was today
  const todayStr = toDateStr(new Date());
  if (wfh.date === todayStr) {
    await User.findByIdAndUpdate(req.user._id, { isWFH: false });
  }

  res.json(wfh);
});

// ── Admin: get all WFH requests ───────────────────────────────────────────────
// @route GET /api/wfh?status=&date=
const getAllWFHRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date)   filter.date   = req.query.date;

  const requests = await WFHRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("employee", "fullName department designation employeeId isWFH clockInTime")
    .populate("reviewedBy", "fullName");

  res.json(requests);
});

// ── Admin: get employees currently WFH today ─────────────────────────────────
// @route GET /api/wfh/today
const getWFHToday = asyncHandler(async (req, res) => {
  const todayStr = toDateStr(new Date());

  const requests = await WFHRequest.find({ date: todayStr, status: "approved" })
    .populate("employee", "fullName department designation employeeId isClockedIn clockInTime isWFH")
    .populate("reviewedBy", "fullName");

  // Enrich with today's attendance
  const empIds = requests.map(r => r.employee?._id).filter(Boolean);
  const attendanceSessions = await Attendance.find({
    employee: { $in: empIds },
    date: todayStr,
  });

  const attMap = {};
  for (const s of attendanceSessions) {
    const id = String(s.employee);
    if (!attMap[id]) attMap[id] = { clockIn: s.clockIn, minutesWorked: 0 };
    attMap[id].minutesWorked += s.minutesWorked || 0;
  }

  const enriched = requests.map(r => {
    const att = attMap[String(r.employee?._id)] || {};
    const h   = Math.floor((att.minutesWorked || 0) / 60);
    const m   = (att.minutesWorked || 0) % 60;
    return {
      ...r.toObject(),
      clockInTime:  att.clockIn || null,
      workingHours: att.minutesWorked ? `${h}h ${m}m` : "—",
    };
  });

  res.json(enriched);
});

// ── Admin: review (approve/reject) ───────────────────────────────────────────
// @route PUT /api/wfh/:id/review
const reviewWFHRequest = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }

  const wfh = await WFHRequest.findById(req.params.id)
    .populate("employee", "fullName");
  if (!wfh) return res.status(404).json({ message: "WFH request not found" });
  if (wfh.status !== "pending") {
    return res.status(400).json({ message: `Request is already ${wfh.status}` });
  }

  wfh.status     = status;
  wfh.reviewedBy = req.user._id;
  wfh.reviewNote = reviewNote || "";
  await wfh.save();

  // If approved and date is today, flip user.isWFH on
  const todayStr = toDateStr(new Date());
  if (status === "approved" && wfh.date === todayStr) {
    await User.findByIdAndUpdate(wfh.employee._id, { isWFH: true });
  }

  // Notify the employee
  await createNotification({
    recipient:   wfh.employee._id,
    type:        "general",
    title:       `WFH Request ${status === "approved" ? "Approved" : "Rejected"}`,
    message:     `Your WFH request for ${wfh.date} has been ${status}`,
    link:        "/wfh",
    triggeredBy: req.user._id,
  });

  res.json(wfh);
});

module.exports = {
  submitWFHRequest,
  getMyWFHRequests,
  cancelWFHRequest,
  getAllWFHRequests,
  getWFHToday,
  reviewWFHRequest,
};
