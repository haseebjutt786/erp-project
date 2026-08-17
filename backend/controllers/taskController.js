const Task = require("../models/Task");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

// @route GET /api/tasks/mine
const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id }).sort({ dueDate: 1 });
  res.json(tasks);
});

// @route GET /api/tasks?project=&status=
// @access Admin only — company-wide task list
const getAllTasks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;

  const tasks = await Task.find(filter).sort({ createdAt: -1 }).populate("assignedTo", "fullName email");
  res.json(tasks);
});

// @route POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, project, dueDate, assignedTo } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Task title is required" });
  }

  // Regular employees can only ever create a task for themselves. Admins
  // may optionally assign it to someone else (validated against a real
  // user first, so a task can never end up pointing at a bogus ID).
  let targetUser = req.user._id;
  if (req.user.isAdmin && assignedTo) {
    const exists = await User.findById(assignedTo).select("_id");
    if (!exists) return res.status(400).json({ message: "Assigned employee not found" });
    targetUser = assignedTo;
  }

  const task = await Task.create({
    assignedTo: targetUser,
    title: title.trim(),
    project,
    dueDate,
  });
  const populated = await task.populate("assignedTo", "fullName email");

  // Notify the assignee if it's not the creator assigning to themselves
  if (String(targetUser) !== String(req.user._id)) {
    await createNotification({
      recipient: targetUser,
      type: "task_assigned",
      title: "Task Assigned",
      message: `You have been assigned: "${task.title}"`,
      link: "/tasks",
      triggeredBy: req.user._id,
    });
  }

  res.status(201).json(populated);
});

// @route PUT /api/tasks/:id/status
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["not_started", "in_progress", "done"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  // Ownership check: only the person the task is assigned to, or an
  // admin/HR user, may change its status. Without this, any logged-in
  // user could update ANY task by guessing/enumerating its ID (IDOR).
  const isOwner = task.assignedTo.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not authorized to update this task" });
  }

  task.status = status;
  await task.save();

  // When a task is completed, notify admins
  if (status === "done") {
    await createNotification({
      recipient: null,
      type: "task_completed",
      title: "Task Completed",
      message: `"${task.title}" marked as done`,
      link: "/tasks",
      triggeredBy: req.user._id,
    });
  }

  res.json(task);
});

module.exports = { getMyTasks, getAllTasks, createTask, updateTaskStatus };
