const User         = require("../models/User");
const BirthdayWish = require("../models/BirthdayWish");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

const toMMDD = (date) => {
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ── Get today's + upcoming birthdays ─────────────────────────────────────────
// @route GET /api/birthdays?days=30
// @access Private
const getBirthdays = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  const now  = new Date();

  // Get all active users with a DOB
  const users = await User.find({
    isActive:    true,
    dateOfBirth: { $ne: null },
  }).select("fullName department designation employeeId dateOfBirth createdAt profileImage");

  // Calculate birthday info for each user
  const results = users.map((u) => {
    const dob   = new Date(u.dateOfBirth);
    // Next birthday in the current year (or next year if already passed)
    const thisYear  = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    const nextBday  = thisYear < now
      ? new Date(now.getFullYear() + 1, dob.getMonth(), dob.getDate())
      : thisYear;
    const daysLeft  = Math.ceil((nextBday - now) / (1000 * 60 * 60 * 24));
    const isToday   = dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate();
    const age       = now.getFullYear() - dob.getFullYear() + (isToday ? 0 : (nextBday.getFullYear() > now.getFullYear() ? -1 : 0));
    const yearsInCompany = Math.floor((now - new Date(u.createdAt)) / (1000 * 60 * 60 * 24 * 365));

    return {
      _id:          u._id,
      fullName:     u.fullName,
      department:   u.department,
      designation:  u.designation,
      employeeId:   u.employeeId,
      dateOfBirth:  u.dateOfBirth,
      profileImage: u.profileImage,
      createdAt:    u.createdAt,
      daysLeft,
      isToday,
      age,
      yearsInCompany,
      birthdayDate: nextBday,
    };
  })
  .filter((u) => u.daysLeft <= days)
  .sort((a, b) => a.daysLeft - b.daysLeft);

  // Attach wish count and whether current user already wished
  const recipientIds = results.map((r) => r._id);
  const year = now.getFullYear();
  const wishes = await BirthdayWish.find({
    recipient: { $in: recipientIds },
    year,
  });

  const wishCountMap = {};
  const alreadyWishedSet = new Set();
  for (const w of wishes) {
    const rid = String(w.recipient);
    wishCountMap[rid] = (wishCountMap[rid] || 0) + 1;
    if (String(w.sender) === String(req.user._id)) {
      alreadyWishedSet.add(rid);
    }
  }

  const enriched = results.map((r) => ({
    ...r,
    wishCount:     wishCountMap[String(r._id)] || 0,
    alreadyWished: alreadyWishedSet.has(String(r._id)),
  }));

  res.json(enriched);
});

// ── Send a birthday wish ──────────────────────────────────────────────────────
// @route POST /api/birthdays/:userId/wish
// @access Private
const sendWish = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const recipientId = req.params.userId;
  const year        = new Date().getFullYear();

  if (String(recipientId) === String(req.user._id)) {
    return res.status(400).json({ message: "You can't wish yourself" });
  }

  const recipient = await User.findById(recipientId).select("fullName dateOfBirth");
  if (!recipient) return res.status(404).json({ message: "Employee not found" });
  if (!recipient.dateOfBirth) {
    return res.status(400).json({ message: "This employee has no birthday set" });
  }

  // Check duplicate
  const existing = await BirthdayWish.findOne({
    sender: req.user._id,
    recipient: recipientId,
    year,
  });
  if (existing) {
    return res.status(400).json({ message: "You have already wished them this year" });
  }

  const wish = await BirthdayWish.create({
    recipient: recipientId,
    sender:    req.user._id,
    message:   message?.trim() || "Happy Birthday! 🎉",
    year,
  });

  // Notify the birthday person
  await createNotification({
    recipient:   recipientId,
    type:        "general",
    title:       "Birthday Wish Received 🎂",
    message:     `${req.user.fullName} wished you Happy Birthday!`,
    link:        "/birthdays",
    triggeredBy: req.user._id,
  });

  await wish.populate("sender", "fullName department designation");
  res.status(201).json(wish);
});

// ── Get wishes received by an employee ───────────────────────────────────────
// @route GET /api/birthdays/:userId/wishes
// @access Private — own record, or admin
const getWishesForEmployee = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (String(userId) !== String(req.user._id) && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const year   = parseInt(req.query.year) || new Date().getFullYear();
  const wishes = await BirthdayWish.find({ recipient: userId, year })
    .sort({ createdAt: -1 })
    .populate("sender", "fullName department designation");

  // Mark as read
  await BirthdayWish.updateMany(
    { recipient: userId, year, isRead: false },
    { isRead: true }
  );

  res.json(wishes);
});

// ── Unread wish count (for badge) ────────────────────────────────────────────
// @route GET /api/birthdays/wishes/unread-count
// @access Private
const getUnreadWishCount = asyncHandler(async (req, res) => {
  const year  = new Date().getFullYear();
  const count = await BirthdayWish.countDocuments({
    recipient: req.user._id,
    year,
    isRead: false,
  });
  res.json({ count });
});

module.exports = {
  getBirthdays,
  sendWish,
  getWishesForEmployee,
  getUnreadWishCount,
};
