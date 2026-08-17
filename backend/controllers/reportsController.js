const User       = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave      = require("../models/Leave");
const Payroll    = require("../models/Payroll");
const Task       = require("../models/Task");
const Project    = require("../models/Project");
const Department = require("../models/Department");
const asyncHandler = require("../middleware/asyncHandler");

const toDateStr = (d) => d.toISOString().slice(0, 10);

// helper — build date range from query params
const getRange = (query) => {
  const now    = new Date();
  const { from, to, period } = query;
  let start, end;
  if (from && to) {
    start = new Date(from);
    end   = new Date(to);
    end.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    start = new Date(now); start.setDate(now.getDate() - 7);
    end   = now;
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
    end   = now;
  } else {
    // default: current month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = now;
  }
  return { start, end };
};

// @route GET /api/reports/attendance
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req.query);
  const startStr = toDateStr(start);
  const endStr   = toDateStr(end);

  const [sessions, employees] = await Promise.all([
    Attendance.find({ date: { $gte: startStr, $lte: endStr } })
      .populate("employee", "fullName department designation"),
    User.find({ isActive: true }).select("fullName department designation"),
  ]);

  // Group by employee
  const empMap = {};
  for (const s of sessions) {
    const id = String(s.employee?._id);
    if (!empMap[id]) {
      empMap[id] = {
        employee: s.employee,
        totalDays: 0,
        totalMinutes: 0,
        sessions: 0,
        lateDays: 0,
      };
    }
    empMap[id].totalDays    = new Set([...Object.keys(empMap[id]).filter(k => k.startsWith("d_")), `d_${s.date}`]).size;
    empMap[id].totalMinutes += s.minutesWorked || 0;
    empMap[id].sessions     += 1;
  }

  // Days in range
  const rangeMs   = end - start;
  const rangeDays = Math.ceil(rangeMs / (1000 * 60 * 60 * 24)) + 1;

  // Trend: daily attendance count
  const trendRaw = await Attendance.aggregate([
    { $match: { date: { $gte: startStr, $lte: endStr } } },
    { $group: { _id: { date: "$date", emp: "$employee" } } },
    { $group: { _id: "$_id.date", present: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Absent employees per day (sample — last 7)
  const summary = {
    totalEmployees: employees.length,
    rangeDays,
    totalSessions: sessions.length,
    avgDailyPresent: trendRaw.length > 0
      ? Math.round(trendRaw.reduce((s, d) => s + d.present, 0) / trendRaw.length)
      : 0,
  };

  res.json({
    summary,
    trend: trendRaw.map(d => ({
      date: d._id,
      day: new Date(d._id + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      present: d.present,
      absent: Math.max(0, employees.length - d.present),
    })),
    byEmployee: Object.values(empMap),
    range: { from: startStr, to: endStr },
  });
});

// @route GET /api/reports/payroll
const getPayrollReport = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req.query);
  // Payroll uses month string YYYY-MM
  const startMonth = toDateStr(start).slice(0, 7);
  const endMonth   = toDateStr(end).slice(0, 7);

  const entries = await Payroll.find({
    month: { $gte: startMonth, $lte: endMonth },
  }).populate("employee", "fullName department designation");

  // Group by month
  const byMonth = {};
  for (const e of entries) {
    if (!byMonth[e.month]) byMonth[e.month] = { month: e.month, total: 0, paid: 0, draft: 0, employees: 0 };
    byMonth[e.month].total     += e.netSalary;
    byMonth[e.month].employees += 1;
    if (e.status === "paid")  byMonth[e.month].paid  += e.netSalary;
    else                      byMonth[e.month].draft += e.netSalary;
  }

  const summary = {
    totalEntries:   entries.length,
    totalNet:       entries.reduce((s, e) => s + e.netSalary, 0),
    paidEntries:    entries.filter(e => e.status === "paid").length,
    draftEntries:   entries.filter(e => e.status === "draft").length,
    avgSalary:      entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.netSalary, 0) / entries.length)
      : 0,
  };

  res.json({
    summary,
    trend: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)),
    entries,
    range: { from: startMonth, to: endMonth },
  });
});

// @route GET /api/reports/leaves
const getLeavesReport = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req.query);

  const leaves = await Leave.find({
    fromDate: { $gte: start },
    toDate:   { $lte: end },
  }).populate("employee", "fullName department");

  const byStatus = {
    pending:  leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    cancelled:leaves.filter(l => l.status === "cancelled").length,
  };

  const byType = {};
  for (const l of leaves) {
    byType[l.leaveType] = (byType[l.leaveType] || 0) + 1;
  }

  const byDept = {};
  for (const l of leaves) {
    const dept = l.employee?.department || "Unknown";
    byDept[dept] = (byDept[dept] || 0) + 1;
  }

  res.json({
    summary: {
      total: leaves.length,
      ...byStatus,
      avgDuration: leaves.length > 0
        ? Math.round(leaves.reduce((s, l) => {
            const days = Math.ceil((new Date(l.toDate) - new Date(l.fromDate)) / (1000*60*60*24)) + 1;
            return s + days;
          }, 0) / leaves.length)
        : 0,
    },
    byStatus: Object.entries(byStatus).map(([k, v]) => ({ name: k, value: v })),
    byType:   Object.entries(byType).map(([k, v])   => ({ name: k, value: v })),
    byDept:   Object.entries(byDept).map(([k, v])   => ({ name: k, value: v })),
    leaves,
    range: { from: toDateStr(start), to: toDateStr(end) },
  });
});

// @route GET /api/reports/employees
const getEmployeesReport = asyncHandler(async (req, res) => {
  const [all, active, admins, deptDist, monthlyHiring] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isAdmin: true }),
    User.aggregate([
      { $match: { isActive: true, department: { $ne: "" } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  const employees = await User.find({ isActive: true })
    .select("fullName email department designation basicSalary createdAt isAdmin")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    summary: {
      total: all,
      active,
      inactive: all - active,
      admins,
      regularEmployees: all - admins,
    },
    deptDistribution: deptDist.map(d => ({ name: d._id || "Unassigned", value: d.count })),
    monthlyHiring: monthlyHiring.map(m => ({
      month: new Date(m._id + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      count: m.count,
    })),
    employees,
  });
});

// @route GET /api/reports/tasks
const getTasksReport = asyncHandler(async (req, res) => {
  const { start, end } = getRange(req.query);

  const tasks = await Task.find({
    createdAt: { $gte: start, $lte: end },
  }).populate("assignedTo", "fullName department");

  const now = new Date();
  const byStatus = {
    not_started: tasks.filter(t => t.status === "not_started").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done:        tasks.filter(t => t.status === "done").length,
    overdue:     tasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now).length,
  };

  const byProject = {};
  for (const t of tasks) {
    const p = t.project || "General";
    if (!byProject[p]) byProject[p] = { done: 0, total: 0 };
    byProject[p].total += 1;
    if (t.status === "done") byProject[p].done += 1;
  }

  res.json({
    summary: {
      total: tasks.length,
      completionRate: tasks.length > 0
        ? Math.round((byStatus.done / tasks.length) * 100)
        : 0,
      ...byStatus,
    },
    byStatus: Object.entries(byStatus).map(([k, v]) => ({ name: k, value: v })),
    byProject: Object.entries(byProject).map(([k, v]) => ({
      name: k, total: v.total, done: v.done,
      progress: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    })),
    tasks,
    range: { from: toDateStr(start), to: toDateStr(end) },
  });
});

// @route GET /api/reports/overview — for dashboard summary cards
const getOverviewReport = asyncHandler(async (req, res) => {
  const now   = new Date();
  const month = toDateStr(now).slice(0, 7);

  const [
    totalEmp, activeEmp,
    presentToday, totalDepts,
    pendingLeaves, approvedLeaves,
    payrollMonth, totalTasks, doneTasks,
    activeProjects,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Attendance.distinct("employee", { date: toDateStr(now) }),
    Department.countDocuments(),
    Leave.countDocuments({ status: "pending" }),
    Leave.countDocuments({ status: "approved" }),
    Payroll.aggregate([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: "$netSalary" }, count: { $sum: 1 } } },
    ]),
    Task.countDocuments(),
    Task.countDocuments({ status: "done" }),
    Project.countDocuments({ status: "active" }),
  ]);

  res.json({
    employees:     { total: totalEmp, active: activeEmp },
    attendance:    { present: presentToday.length, total: activeEmp, absent: activeEmp - presentToday.length },
    departments:   totalDepts,
    leaves:        { pending: pendingLeaves, approved: approvedLeaves },
    payroll:       { amount: payrollMonth[0]?.total || 0, entries: payrollMonth[0]?.count || 0 },
    tasks:         { total: totalTasks, done: doneTasks, completionRate: totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0 },
    activeProjects,
  });
});

module.exports = {
  getAttendanceReport,
  getPayrollReport,
  getLeavesReport,
  getEmployeesReport,
  getTasksReport,
  getOverviewReport,
};
