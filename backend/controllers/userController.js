const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// @route GET /api/users?search=&department=
// @access Admin only
// Simple search-by-name/email + optional department filter. No pagination
// yet — fine at small headcount; add skip/limit once the employee list
// actually gets long.
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const filter = {};

  if (search) {
    // Case-insensitive partial match on name or email. Using a regex here
    // (not raw string interpolation into a query operator) keeps this safe
    // from injection — express-mongo-sanitize also strips any "$"/"." keys
    // globally as a second layer.
    const safe = String(search).trim();
    filter.$or = [{ fullName: { $regex: safe, $options: "i" } }, { email: { $regex: safe, $options: "i" } }];
  }
  if (department) {
    filter.department = department;
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
});

// @route GET /api/users/:id
// @access Admin only
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Employee not found" });
  res.json(user);
});

// @route POST /api/users
// @access Admin only
// This is how new employee accounts get created — public self-registration
// stays open too (see authController) for now, per your earlier call to
// keep both paths available; if you decide to lock signup down later,
// this endpoint becomes the only way in.
const createEmployee = asyncHandler(async (req, res) => {
  const { fullName, email, password, designation, department, employeeId, isAdmin, basicSalary, dateOfBirth } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Full name, email, and password are required" });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return res.status(400).json({ message: "An employee with this email already exists" });

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    designation,
    basicSalary: Number(basicSalary) || 0,
    department,
    employeeId,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    isAdmin: Boolean(isAdmin),
  });

  // Notify all admins
  await createNotification({
    recipient: null,
    type: "employee_joined",
    title: "New Employee Added",
    message: `${user.fullName} joined${user.department ? ` — ${user.department}` : ""}`,
    link: "/employees",
    triggeredBy: req.user._id,
  });

  res.status(201).json(user);
});

// @route PUT /api/users/:id
// @access Admin only
// Whitelisted field update — deliberately does NOT accept `password` here
// (that belongs in a separate reset flow) or let the fields be spread
// blindly from req.body, so a stray/unexpected field can never sneak in.
const updateEmployee = asyncHandler(async (req, res) => {
  const { fullName, designation, department, employeeId, isAdmin, basicSalary, dateOfBirth } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Employee not found" });

  if (fullName    !== undefined) user.fullName    = fullName;
  if (designation !== undefined) user.designation = designation;
  if (department  !== undefined) user.department  = department;
  if (employeeId  !== undefined) user.employeeId  = employeeId;
  if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  if (basicSalary !== undefined) {
    const val = Number(basicSalary);
    if (isNaN(val) || val < 0) return res.status(400).json({ message: "Basic salary must be a non-negative number" });
    user.basicSalary = val;
  }

  if (isAdmin !== undefined) {
    // Guard rail: an admin can't accidentally strip their own admin access
    // via this generic endpoint (that could lock everyone out if they're
    // the only admin). Demoting yourself has to be a deliberate, separate
    // action — not something this form can do by mistake.
    if (String(user._id) === String(req.user._id) && isAdmin === false) {
      return res.status(400).json({ message: "You can't remove your own admin access here" });
    }
    user.isAdmin = Boolean(isAdmin);
  }

  await user.save();
  res.json(user);
});

// @route PUT /api/users/:id/deactivate
// @access Admin only
const deactivateEmployee = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ message: "You can't deactivate your own account" });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ message: "Employee not found" });
  res.json(user);
});

// @route PUT /api/users/:id/reactivate
// @access Admin only
const reactivateEmployee = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!user) return res.status(404).json({ message: "Employee not found" });
  res.json(user);
});

module.exports = {
  getAllUsers,
  getUserById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
};
