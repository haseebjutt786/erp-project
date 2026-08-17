const Department = require("../models/Department");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

// @route GET /api/departments
// @access Admin only
// Returns each department along with a live employee count — computed on
// read rather than stored, so it can never drift out of sync with the
// actual User records.
const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 }).populate("manager", "fullName email");

  const counts = await User.aggregate([{ $group: { _id: "$department", count: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  const withCounts = departments.map((d) => ({
    ...d.toObject(),
    employeeCount: countMap[d.name] || 0,
  }));

  res.json(withCounts);
});

// @route POST /api/departments
// @access Admin only
const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, manager } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Department name is required" });
  }

  const exists = await Department.findOne({ name: name.trim() });
  if (exists) return res.status(400).json({ message: "A department with this name already exists" });

  const department = await Department.create({
    name: name.trim(),
    description,
    manager: manager || null,
  });
  res.status(201).json(department);
});

// @route PUT /api/departments/:id
// @access Admin only
const updateDepartment = asyncHandler(async (req, res) => {
  const { name, description, manager } = req.body;

  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ message: "Department not found" });

  // Renaming a department is allowed, but note: existing employees still
  // hold the OLD department name as free text on their User record (see
  // models/User.js) until they're individually re-assigned. This mirrors
  // how the field works elsewhere in the app for now — a proper ObjectId
  // relation is a natural next refactor once this module is stable.
  if (name !== undefined) {
    const trimmed = name.trim();
    const clash = await Department.findOne({ name: trimmed, _id: { $ne: department._id } });
    if (clash) return res.status(400).json({ message: "A department with this name already exists" });
    department.name = trimmed;
  }
  if (description !== undefined) department.description = description;
  if (manager !== undefined) department.manager = manager || null;

  await department.save();
  res.json(department);
});

// @route DELETE /api/departments/:id
// @access Admin only
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ message: "Department not found" });

  // Referential-integrity guard: since employees reference a department by
  // name (not a hard foreign key), deleting one out from under active
  // employees would silently orphan them. Block it and tell the admin
  // exactly why, rather than deleting and leaving inconsistent data.
  const employeeCount = await User.countDocuments({ department: department.name });
  if (employeeCount > 0) {
    return res.status(400).json({
      message: `Can't delete "${department.name}" — ${employeeCount} employee(s) are still assigned to it. Reassign them first.`,
    });
  }

  await department.deleteOne();
  res.json({ message: "Department deleted" });
});

module.exports = { getAllDepartments, createDepartment, updateDepartment, deleteDepartment };
