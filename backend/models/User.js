const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    // Stores the bcrypt HASH, never the plaintext password. `select: false`
    // means normal queries (User.find, User.findById, etc.) never return
    // this field at all — you must explicitly call .select("+password")
    // in the rare case you actually need it (see authController login).
    password: { type: String, required: true, select: false },
    designation: { type: String, default: "" }, // e.g. "Web Development Intern"
    department: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    // Monthly base salary, set by an admin/HR user (see userController.updateEmployee).
    // Used as the starting point when generating a Payroll entry for a given month.
    basicSalary: { type: Number, default: 0, min: 0 },
    profileImage: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false }, // HR/Admin access

    // Deactivated employees (e.g. left the company) keep their historical
    // records (tasks, attendance, etc. once those modules exist) intact —
    // we never hard-delete a User, just flip this off.
    isActive: { type: Boolean, default: true },

    // Clock in/out tracking
    isClockedIn: { type: Boolean, default: false },
    clockInTime: { type: Date },
    // Birthday for dashboard widget
    dateOfBirth: { type: Date, default: null },
    // Work From Home status (reset daily)
    isWFH: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
