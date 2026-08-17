const Attendance  = require("../models/Attendance");
const Leave       = require("../models/Leave");
const WFHRequest  = require("../models/WFHRequest");
const User        = require("../models/User");
const Task        = require("../models/Task");
const Project     = require("../models/Project");
const asyncHandler = require("../middleware/asyncHandler");

// ── helpers ──────────────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().slice(0, 10);
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDur = (mins) => {
  if (!mins) return "0h 0m";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// Build all calendar days in a month
const getMonthDays = (year, month) => {
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    days.push(`${year}-${mm}-${dd}`);
  }
  return days;
};

// Count working days in month (Mon–Fri)
const countWorkDays = (year, month) => {
  let count = 0;
  const days = getMonthDays(year, month);
  for (const d of days) {
    const dow = new Date(d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

// ── Monthly Attendance for ONE employee ──────────────────────────────────────
// @route GET /api/report-export/attendance/monthly?month=8&year=2026&employeeId=xxx
// @access Private — employee can only query their own, admin can query any
const getMonthlyAttendanceReport = asyncHandler(async (req, res) => {
  const { month, year, employeeId } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year)  || new Date().getFullYear();

  // Role-based access: employee can only see their own
  let targetId;
  if (req.user.isAdmin && employeeId) {
    targetId = employeeId;
  } else {
    targetId = String(req.user._id);
    // Block employee from querying another employee
    if (employeeId && employeeId !== targetId) {
      return res.status(403).json({ message: "Access denied" });
    }
  }

  const emp = await User.findById(targetId).select(
    "fullName email department designation employeeId basicSalary dateOfBirth createdAt"
  );
  if (!emp) return res.status(404).json({ message: "Employee not found" });

  const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
  const endStr   = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;
  const allDays  = getMonthDays(y, m);

  // Attendance sessions for the month
  const sessions = await Attendance.find({
    employee: targetId,
    date: { $gte: startStr, $lte: endStr },
  }).sort({ clockIn: 1 });

  // Group sessions by date
  const attByDate = {};
  for (const s of sessions) {
    if (!attByDate[s.date]) attByDate[s.date] = { sessions: [], totalMinutes: 0 };
    attByDate[s.date].sessions.push({ clockIn: s.clockIn, clockOut: s.clockOut });
    attByDate[s.date].totalMinutes += s.minutesWorked || 0;
  }

  // Approved leaves this month
  const leaves = await Leave.find({
    employee: targetId,
    status: "approved",
    fromDate: { $lte: new Date(endStr + "T23:59:59") },
    toDate:   { $gte: new Date(startStr + "T00:00:00") },
  });
  const leaveDates = new Set();
  for (const l of leaves) {
    const from = new Date(l.fromDate);
    const to   = new Date(l.toDate);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      leaveDates.add(toDateStr(d));
    }
  }

  // Approved WFH this month
  const wfhReqs = await WFHRequest.find({
    employee: targetId,
    status: "approved",
    date: { $gte: startStr, $lte: endStr },
  });
  const wfhDates = new Set(wfhReqs.map(w => w.date));

  // Build daily rows
  const LATE_THRESHOLD_MINS = 15; // minutes after 9:00 AM
  const dailyRows = allDays.map(dateStr => {
    const dow       = new Date(dateStr + "T12:00:00").getDay();
    const isWeekend = dow === 0 || dow === 6;
    const dayName   = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
    const att       = attByDate[dateStr];
    const isLeave   = leaveDates.has(dateStr);
    const isWFH     = wfhDates.has(dateStr);

    let status = "Absent";
    let totalMins = 0;
    let firstIn = null;
    let lastOut = null;
    let sessionCount = 0;
    let isLate = false;

    if (att && att.sessions.length > 0) {
      totalMins    = att.totalMinutes;
      sessionCount = att.sessions.length;
      firstIn      = att.sessions[att.sessions.length - 1]?.clockIn || att.sessions[0]?.clockIn;
      lastOut      = att.sessions[0]?.clockOut;
      const hrs    = Math.floor(totalMins / 60);
      status       = hrs >= 8 ? "Full Day" : "Partial";

      // Check late
      if (firstIn) {
        const inTime  = new Date(firstIn);
        const nineAM  = new Date(inTime);
        nineAM.setHours(9, LATE_THRESHOLD_MINS, 0, 0);
        if (inTime > nineAM) isLate = true;
      }
    } else if (isLeave) {
      status = "Leave";
    } else if (isWeekend) {
      status = "Weekend";
    }

    if (isWFH && status !== "Absent" && status !== "Weekend" && status !== "Leave") {
      status = status + " (WFH)";
    }

    return {
      date:         dateStr,
      dayName,
      isWeekend,
      firstClockIn: firstIn ? fmtTime(firstIn) : "—",
      lastClockOut: lastOut ? fmtTime(lastOut) : "—",
      sessions:     sessionCount,
      totalHours:   fmtDur(totalMins),
      totalMinutes: totalMins,
      status,
      isLate,
    };
  });

  // Summary counters
  const workDays   = allDays.filter(d => {
    const dow = new Date(d + "T12:00:00").getDay();
    return dow !== 0 && dow !== 6;
  });
  const presentDays   = dailyRows.filter(r => r.totalMinutes > 0).length;
  const fullDays      = dailyRows.filter(r => r.status.startsWith("Full Day")).length;
  const partialDays   = dailyRows.filter(r => r.status.startsWith("Partial")).length;
  const absentDays    = dailyRows.filter(r => r.status === "Absent").length;
  const leaveDaysCount = dailyRows.filter(r => r.status === "Leave").length;
  const wfhDaysCount  = dailyRows.filter(r => r.status.includes("WFH")).length;
  const totalMins     = dailyRows.reduce((s, r) => s + r.totalMinutes, 0);
  const avgMins       = presentDays > 0 ? Math.round(totalMins / presentDays) : 0;
  const lateDays      = dailyRows.filter(r => r.isLate).length;

  const monthName = new Date(`${y}-${String(m).padStart(2, "0")}-01`).toLocaleString("en-US", { month: "long" });

  res.json({
    employee: {
      _id:         emp._id,
      fullName:    emp.fullName,
      email:       emp.email,
      department:  emp.department,
      designation: emp.designation,
      employeeId:  emp.employeeId,
    },
    period: { month: m, year: y, monthName, label: `${monthName} ${y}` },
    summary: {
      totalWorkingDays: workDays.length,
      presentDays,
      fullDays,
      partialDays,
      absentDays,
      leaveDays:       leaveDaysCount,
      wfhDays:         wfhDaysCount,
      totalHours:      fmtDur(totalMins),
      totalMinutes,
      avgHoursPerDay:  fmtDur(avgMins),
      lateDays,
    },
    dailyRows,
  });
});

// ── Monthly Attendance for ALL employees (admin) ──────────────────────────────
// @route GET /api/report-export/attendance/org-monthly?month=8&year=2026&department=xxx
// @access Admin only
const getOrgMonthlyAttendance = asyncHandler(async (req, res) => {
  const { month, year, department, employeeId } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year)  || new Date().getFullYear();

  const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
  const endStr   = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

  // Filter employees
  const empFilter = { isActive: true };
  if (department) empFilter.department = department;
  if (employeeId) empFilter._id = employeeId;

  const employees = await User.find(empFilter).select(
    "fullName department designation employeeId"
  );

  const sessions = await Attendance.find({
    date: { $gte: startStr, $lte: endStr },
    employee: { $in: employees.map(e => e._id) },
  });

  // Approved leaves
  const leaves = await Leave.find({
    employee: { $in: employees.map(e => e._id) },
    status: "approved",
    fromDate: { $lte: new Date(endStr + "T23:59:59") },
    toDate:   { $gte: new Date(startStr + "T00:00:00") },
  });

  // WFH
  const wfhReqs = await WFHRequest.find({
    employee: { $in: employees.map(e => e._id) },
    status: "approved",
    date: { $gte: startStr, $lte: endStr },
  });

  // Group by employee
  const workDayCount = countWorkDays(y, m);

  const rows = employees.map(emp => {
    const empId   = String(emp._id);
    const empSess = sessions.filter(s => String(s.employee) === empId);
    const empLeaves = leaves.filter(l => String(l.employee) === empId);
    const empWFH    = wfhReqs.filter(w => String(w.employee) === empId);

    // Count unique present days
    const presentDates = new Set(empSess.map(s => s.date));
    const presentDays  = presentDates.size;

    // Count leave days (within month)
    const leaveDateSet = new Set();
    for (const l of empLeaves) {
      const from = new Date(l.fromDate);
      const to   = new Date(l.toDate);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const ds = toDateStr(d);
        if (ds >= startStr && ds <= endStr) leaveDateSet.add(ds);
      }
    }

    const totalMins = empSess.reduce((s, sess) => s + (sess.minutesWorked || 0), 0);
    const absentDays = Math.max(0, workDayCount - presentDays - leaveDateSet.size);

    return {
      employeeId:  emp.employeeId || "—",
      name:        emp.fullName,
      department:  emp.department || "—",
      designation: emp.designation || "—",
      presentDays,
      leaveDays:   leaveDateSet.size,
      wfhDays:     empWFH.length,
      absentDays,
      totalHours:  fmtDur(totalMins),
      totalMinutes: totalMins,
    };
  });

  const monthName = new Date(`${y}-${String(m).padStart(2, "0")}-01`).toLocaleString("en-US", { month: "long" });

  res.json({
    period: { month: m, year: y, monthName, label: `${monthName} ${y}` },
    totalWorkingDays: workDayCount,
    rows,
  });
});

// ── Project Report ─────────────────────────────────────────────────────────
// @route GET /api/report-export/projects?status=&month=&year=&employeeId=
// @access Private — employee sees only their projects/tasks
const getProjectReport = asyncHandler(async (req, res) => {
  const { status, month, year, employeeId, projectId } = req.query;
  const isAdmin = req.user.isAdmin;

  // Build task filter
  const taskFilter = {};
  if (!isAdmin) {
    taskFilter.assignedTo = req.user._id; // employee only sees own tasks
  } else if (employeeId) {
    taskFilter.assignedTo = employeeId;
  }
  if (status) taskFilter.status = status;

  // Month/year filter on tasks
  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 0, 23, 59, 59);
    taskFilter.createdAt = { $gte: start, $lte: end };
  }

  // Project filter
  const projFilter = {};
  if (projectId) projFilter._id = projectId;
  if (status) projFilter.status = status;

  const [projects, tasks] = await Promise.all([
    isAdmin
      ? Project.find(projFilter).populate("createdBy members", "fullName department").sort({ createdAt: -1 })
      : Project.find({ members: req.user._id, ...projFilter }).populate("createdBy members", "fullName").sort({ createdAt: -1 }),
    Task.find(taskFilter).populate("assignedTo", "fullName department").sort({ createdAt: -1 }),
  ]);

  const now = new Date();

  // Enrich projects with task stats
  const projectRows = projects.map(p => {
    const projTasks = tasks.filter(t => t.project === p.name);
    const done      = projTasks.filter(t => t.status === "done").length;
    const overdue   = projTasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now).length;
    return {
      _id:           p._id,
      name:          p.name,
      description:   p.description || "",
      status:        p.status,
      deadline:      p.deadline ? toDateStr(new Date(p.deadline)) : "—",
      createdBy:     p.createdBy?.fullName || "—",
      members:       p.members.map(m => m.fullName).join(", "),
      totalTasks:    projTasks.length,
      doneTasks:     done,
      pendingTasks:  projTasks.length - done,
      overdueTasks:  overdue,
      progress:      projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0,
    };
  });

  // Task rows
  const taskRows = tasks.map(t => ({
    _id:        t._id,
    title:      t.title,
    project:    t.project || "General",
    assignedTo: t.assignedTo?.fullName || "—",
    department: t.assignedTo?.department || "—",
    status:     t.status,
    dueDate:    t.dueDate ? toDateStr(new Date(t.dueDate)) : "—",
    isOverdue:  t.status !== "done" && t.dueDate && new Date(t.dueDate) < now,
    createdAt:  toDateStr(new Date(t.createdAt)),
  }));

  const monthName = (month && year)
    ? new Date(`${year}-${String(month).padStart(2,"0")}-01`).toLocaleString("en-US", { month: "long" })
    : null;

  res.json({
    period: month && year ? { month, year, label: `${monthName} ${year}` } : { label: "All Time" },
    summary: {
      totalProjects: projects.length,
      totalTasks:    tasks.length,
      doneTasks:     tasks.filter(t => t.status === "done").length,
      inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
      overdueTasks:  tasks.filter(t => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now).length,
    },
    projectRows,
    taskRows,
  });
});

module.exports = {
  getMonthlyAttendanceReport,
  getOrgMonthlyAttendance,
  getProjectReport,
};
