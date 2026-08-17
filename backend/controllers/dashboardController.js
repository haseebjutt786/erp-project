const Task = require("../models/Task");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");
const Project = require("../models/Project");
const Department = require("../models/Department");
const Announcement = require("../models/Announcement");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");

// ── Helper ────────────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().slice(0, 10);

// ── Employee dashboard ────────────────────────────────────────────────────────
// @route GET /api/dashboard
// @access Private
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const allTasks = await Task.find({ assignedTo: userId });
  const pendingTasks = allTasks.filter((t) => t.status !== "done");
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < new Date());

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = toDateStr(monthStart);
  const daysElapsed   = now.getDate();

  const distinctDays = await Attendance.distinct("date", {
    employee: userId,
    date: { $gte: monthStartStr },
  });

  const onLeaveToday = await Leave.countDocuments({
    status: "approved",
    fromDate: { $lte: now },
    toDate:   { $gte: now },
  });

  // Real WFH count
  const teammatesOnWFH = await User.countDocuments({ isActive: true, isWFH: true, _id: { $ne: userId } });

  // Real birthdays this week using dateOfBirth field
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const birthdaysThisWeek = await User.countDocuments({
    isActive: true,
    dateOfBirth: { $ne: null },
    $expr: {
      $and: [
        { $gte: [{ $dayOfYear: "$dateOfBirth" }, weekStart.getDay() === 0 ? 1 : { $dayOfYear: weekStart }] },
        { $lte: [{ $dayOfYear: "$dateOfBirth" }, { $dayOfYear: weekEnd }] },
      ],
    },
  }).catch(() => 0); // graceful fallback if no DOBs set yet

  res.json({
    stats: {
      pendingTasks:   pendingTasks.length,
      activeProjects: [...new Set(allTasks.map((t) => t.project))].filter(Boolean).length,
      overdueTasks:   overdueTasks.length,
      attendance: { present: distinctDays.length, total: daysElapsed },
    },
    tasks: allTasks.slice(0, 5),
    today: {
      birthdaysThisWeek,
      onLeaveToday,
      teammatesOnWFH,
    },
  });
});

// ── Admin dashboard ───────────────────────────────────────────────────────────
// @route GET /api/dashboard/admin
// @access Private + adminOnly
const getAdminDashboardData = asyncHandler(async (req, res) => {
  const now      = new Date();
  const todayStr = toDateStr(now);

  // ── Parallel DB queries ───────────────────────────────────────────────────
  const [
    totalEmployees,
    activeEmployees,
    totalDepartments,
    allTasks,
    presentTodayIds,
    pendingLeavesCount,
    approvedLeavesCount,
    rejectedLeavesCount,
    currentMonthPayroll,
    totalProjects,
    activeProjects,
    recentEmployees,
    recentTasks,
    latestAnnouncements,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Department.countDocuments(),
    Task.find().sort({ createdAt: -1 }),
    Attendance.distinct("employee", { date: todayStr }),
    Leave.countDocuments({ status: "pending" }),
    Leave.countDocuments({ status: "approved" }),
    Leave.countDocuments({ status: "rejected" }),
    Payroll.find({ month: now.toISOString().slice(0, 7) }),
    Project.countDocuments(),
    Project.countDocuments({ status: "active" }),
    User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select("fullName email designation department createdAt employeeId"),
    Task.find().sort({ createdAt: -1 }).limit(6).populate("assignedTo", "fullName"),
    Announcement.find().sort({ isPinned: -1, createdAt: -1 }).limit(4).populate("postedBy", "fullName"),
  ]);

  // Derived counts
  const openTasks      = allTasks.filter((t) => t.status !== "done").length;
  const completedTasks = allTasks.filter((t) => t.status === "done").length;
  const overdueTasks   = allTasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now).length;
  const payrollAmount  = currentMonthPayroll.reduce((s, p) => s + p.netSalary, 0);
  const absentToday    = activeEmployees - presentTodayIds.length;

  // ── Attendance trend (last 7 days) ────────────────────────────────────────
  const dateList = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateList.push(toDateStr(d));
  }
  const trendRaw = await Attendance.aggregate([
    { $match: { date: { $in: dateList } } },
    { $group: { _id: { date: "$date", employee: "$employee" } } },
    { $group: { _id: "$_id.date", present: { $sum: 1 } } },
  ]);
  const trendMap = Object.fromEntries(trendRaw.map((c) => [c._id, c.present]));
  const attendanceTrendData = dateList.map((date) => ({
    day:     new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }),
    date,
    present: trendMap[date] || 0,
    absent:  Math.max(0, activeEmployees - (trendMap[date] || 0)),
  }));

  // ── Task status breakdown ─────────────────────────────────────────────────
  const taskStatusBreakdown = {
    not_started: allTasks.filter((t) => t.status === "not_started").length,
    in_progress: allTasks.filter((t) => t.status === "in_progress").length,
    done:        completedTasks,
    overdue:     overdueTasks,
  };

  // ── Payroll trend (last 6 months) ─────────────────────────────────────────
  const payrollTrendMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    payrollTrendMonths.push(d.toISOString().slice(0, 7));
  }
  const payrollTrendRaw = await Payroll.aggregate([
    { $match: { month: { $in: payrollTrendMonths } } },
    { $group: { _id: "$month", total: { $sum: "$netSalary" } } },
    { $sort: { _id: 1 } },
  ]);
  const payrollMap = Object.fromEntries(payrollTrendRaw.map((p) => [p._id, p.total]));
  const payrollTrend = payrollTrendMonths.map((m) => ({
    month: new Date(m + "-01").toLocaleDateString("en-US", { month: "short" }),
    cost:  payrollMap[m] || 0,
  }));

  // ── Department distribution ───────────────────────────────────────────────
  const deptDistRaw = await User.aggregate([
    { $match: { isActive: true, department: { $ne: "" } } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  // ── Late employees today (clocked in after 09:15) ─────────────────────────
  const nineAMToday = new Date(todayStr + "T09:15:00.000Z");
  const lateCount   = await Attendance.countDocuments({
    date: todayStr,
    clockIn: { $gt: nineAMToday },
  });

  // ── Activity timeline ─────────────────────────────────────────────────────
  const [latestLeaves, latestPayroll, latestDepts] = await Promise.all([
    Leave.find().sort({ updatedAt: -1 }).limit(4).populate("employee", "fullName"),
    Payroll.find().sort({ createdAt: -1 }).limit(2).populate("employee", "fullName"),
    Department.find().sort({ createdAt: -1 }).limit(3),
  ]);

  const activityTimeline = [
    ...recentEmployees.map((u) => ({
      type:  "employee_joined",
      icon:  "ti-user-plus",
      color: "#466ae6",
      text:  `${u.fullName} joined${u.department ? ` — ${u.department}` : ""}`,
      at:    u.createdAt,
    })),
    ...recentTasks.map((t) => ({
      type:  "task_created",
      icon:  "ti-list-check",
      color: "#ff7b0d",
      text:  `Task "${t.title}" assigned to ${t.assignedTo?.fullName || "employee"}`,
      at:    t.createdAt,
    })),
    ...latestLeaves.map((l) => ({
      type:  "leave_" + l.status,
      icon:  l.status === "approved" ? "ti-check" : l.status === "rejected" ? "ti-x" : "ti-notes",
      color: l.status === "approved" ? "#18a04b" : l.status === "rejected" ? "#eb0910" : "#e89f00",
      text:  `${l.employee?.fullName} — leave ${l.status}`,
      at:    l.updatedAt,
    })),
    ...latestPayroll.map((p) => ({
      type:  "payroll_generated",
      icon:  "ti-currency-dollar",
      color: "#18a04b",
      text:  `Payroll generated for ${p.employee?.fullName} (${p.month})`,
      at:    p.createdAt,
    })),
    ...latestDepts.map((d) => ({
      type:  "department_created",
      icon:  "ti-building",
      color: "#7b4fa0",
      text:  `Department "${d.name}" created`,
      at:    d.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  // ── Response ──────────────────────────────────────────────────────────────
  res.json({
    stats: {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      totalProjects,
      activeProjects,
      openTasks,
      completedTasks,
      overdueTasks,
      pendingLeaves:    pendingLeavesCount,
      approvedLeaves:   approvedLeavesCount,
      rejectedLeaves:   rejectedLeavesCount,
      payrollThisMonth: payrollAmount,
      attendanceToday:  { present: presentTodayIds.length, absent: absentToday, late: lateCount, total: activeEmployees },
    },
    taskStatusBreakdown,
    attendanceTrend:      { data: attendanceTrendData },
    payrollTrend,
    departmentDistribution: deptDistRaw.map((d) => ({ name: d._id, value: d.count })),
    recentTasks,
    recentEmployees,
    latestAnnouncements,
    activityTimeline,
  });
});

module.exports = { getDashboardData, getAdminDashboardData };
