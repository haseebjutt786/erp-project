const Project = require("../models/Project");
const Task = require("../models/Task");
const asyncHandler = require("../middleware/asyncHandler");

// @route GET /api/projects
// @access Private — any logged-in user (needed to populate project pickers
// when creating a task, not just for admins managing projects)
// Includes a live task-progress summary per project, computed on read.
const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 }).populate("members", "fullName email").populate("createdBy", "fullName");

  const taskCounts = await Task.aggregate([
    { $group: { _id: { project: "$project", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const progressMap = {};
  for (const t of taskCounts) {
    const name = t._id.project;
    if (!progressMap[name]) progressMap[name] = { total: 0, done: 0 };
    progressMap[name].total += t.count;
    if (t._id.status === "done") progressMap[name].done += t.count;
  }

  const withProgress = projects.map((p) => ({
    ...p.toObject(),
    taskCount: progressMap[p.name]?.total || 0,
    tasksDone: progressMap[p.name]?.done || 0,
  }));

  res.json(withProgress);
});

// @route POST /api/projects
// @access Admin only
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, deadline, members } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const exists = await Project.findOne({ name: name.trim() });
  if (exists) return res.status(400).json({ message: "A project with this name already exists" });

  const project = await Project.create({
    name: name.trim(),
    description,
    status: ["active", "on_hold", "completed"].includes(status) ? status : "active",
    deadline: deadline || null,
    members: Array.isArray(members) ? members : [],
    createdBy: req.user._id,
  });

  res.status(201).json(project);
});

// @route PUT /api/projects/:id
// @access Admin only
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, status, deadline, members } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  // Renaming: same caveat as Departments — Task.project is free text
  // matched by name, so a rename doesn't retroactively relink old tasks.
  if (name !== undefined) {
    const trimmed = name.trim();
    const clash = await Project.findOne({ name: trimmed, _id: { $ne: project._id } });
    if (clash) return res.status(400).json({ message: "A project with this name already exists" });
    project.name = trimmed;
  }
  if (description !== undefined) project.description = description;
  if (status !== undefined) {
    if (!["active", "on_hold", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    project.status = status;
  }
  if (deadline !== undefined) project.deadline = deadline || null;
  if (members !== undefined) project.members = Array.isArray(members) ? members : [];

  await project.save();
  res.json(project);
});

// @route DELETE /api/projects/:id
// @access Admin only
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  const taskCount = await Task.countDocuments({ project: project.name });
  if (taskCount > 0) {
    return res.status(400).json({
      message: `Can't delete "${project.name}" — ${taskCount} task(s) still reference it. Reassign or delete them first.`,
    });
  }

  await project.deleteOne();
  res.json({ message: "Project deleted" });
});

module.exports = { getAllProjects, createProject, updateProject, deleteProject };
