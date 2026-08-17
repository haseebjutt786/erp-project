const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../middleware/asyncHandler");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Generate JWT Token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

// ==========================
// Register User
// ==========================
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, designation } = req.body;

  const userExists = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (userExists) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    fullName,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    designation,
  });

  res.status(201).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    designation: user.designation,
    isAdmin: user.isAdmin,
    isClockedIn: user.isClockedIn,
    token: generateToken(user._id),
  });
});

// ==========================
// Login User
// ==========================
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: "Your account has been deactivated. Contact HR." });
  }

  res.json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    designation: user.designation,
    department: user.department,
    isAdmin: user.isAdmin,
    isClockedIn: user.isClockedIn,
    clockInTime: user.clockInTime,
    token: generateToken(user._id),
  });
});

// ==========================
// Clock In / Clock Out
// ==========================
const toggleClock = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (!user.isClockedIn) {
    await Attendance.create({
      employee: user._id,
      date: todayStr,
      clockIn: now,
    });

    user.isClockedIn = true;
    user.clockInTime = now;
  } else {
    const openSession = await Attendance.findOne({
      employee: user._id,
      clockOut: null,
    }).sort({ clockIn: -1 });

    if (openSession) {
      openSession.clockOut = now;
      openSession.minutesWorked = Math.round(
        (now - openSession.clockIn) / 60000
      );
      await openSession.save();
    }

    user.isClockedIn = false;
    user.clockInTime = null;
  }

  await user.save();

  res.json({
    isClockedIn: user.isClockedIn,
    clockInTime: user.clockInTime,
  });
});

// ==========================
// Toggle WFH
// ==========================
const toggleWFH = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isWFH = !user.isWFH;
  await user.save();
  res.json({ isWFH: user.isWFH });
});

module.exports = {
  registerUser,
  loginUser,
  toggleClock,
  toggleWFH,
};