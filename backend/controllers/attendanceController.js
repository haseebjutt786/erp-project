const Attendance = require("../models/Attendance");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

const toDateStr = (d) => d.toISOString().slice(0, 10);

// @route GET /api/attendance/mine?days=30
// @access Private — any logged-in user, their own records only
const getMyAttendance = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90); // cap to keep responses small
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sessions = await Attendance.find({
    employee: req.user._id,
    clockIn: { $gte: since },
  }).sort({ clockIn: -1 });

  // Group sessions by day so the frontend gets one row per date with total
  // hours, rather than every individual clock in/out pair.
  const byDate = {};
  for (const s of sessions) {
    if (!byDate[s.date]) byDate[s.date] = { date: s.date, sessions: [], totalMinutes: 0 };
    byDate[s.date].sessions.push({ clockIn: s.clockIn, clockOut: s.clockOut });
    byDate[s.date].totalMinutes += s.minutesWorked || 0;
  }

  res.json(Object.values(byDate).sort((a, b) => (a.date < b.date ? 1 : -1)));
});

// @route GET /api/attendance?date=YYYY-MM-DD
// @access Admin only — company-wide view for a single day (defaults today)
const getDailyAttendance = asyncHandler(async (req, res) => {
  const date = req.query.date || toDateStr(new Date());

  const [sessions, allEmployees] = await Promise.all([
    Attendance.find({ date }).populate("employee", "fullName email department"),
    User.find({ isActive: true }).select("fullName email department"),
  ]);

  const presentIds = new Set(sessions.map((s) => String(s.employee?._id)));

  // Group each present employee's sessions together with total hours.
  const presentMap = {};
  for (const s of sessions) {
    const id = String(s.employee?._id);
    if (!presentMap[id]) {
      presentMap[id] = { employee: s.employee, sessions: [], totalMinutes: 0 };
    }
    presentMap[id].sessions.push({ clockIn: s.clockIn, clockOut: s.clockOut });
    presentMap[id].totalMinutes += s.minutesWorked || 0;
  }

  const absent = allEmployees.filter((e) => !presentIds.has(String(e._id)));

  res.json({
    date,
    present: Object.values(presentMap),
    absent,
    totalEmployees: allEmployees.length,
  });
});

// @route GET /api/attendance/trend?days=7
// @access Admin only — how many distinct employees clocked in each of the
// last N days. Powers the Attendance Trend chart on the admin dashboard.
const getAttendanceTrend = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 30);
  const dateList = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateList.push(toDateStr(d));
  }

  const counts = await Attendance.aggregate([
    { $match: { date: { $in: dateList } } },
    { $group: { _id: { date: "$date", employee: "$employee" } } },
    { $group: { _id: "$_id.date", present: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.present]));

  const data = dateList.map((date) => ({
    day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    date,
    present: countMap[date] || 0,
  }));

  res.json(data);
});

module.exports = { getMyAttendance, getDailyAttendance, getAttendanceTrend };
