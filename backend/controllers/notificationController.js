const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");

/**
 * createNotification — internal helper used by other controllers.
 * Not an Express route handler. Call this whenever something notable happens.
 */
const createNotification = async ({
  recipient = null,
  type = "general",
  title,
  message,
  link = "",
  triggeredBy = null,
}) => {
  try {
    await Notification.create({ recipient, type, title, message, link, triggeredBy });
  } catch (err) {
    // Never throw — a failed notification must never break the main action
    console.error("Notification create failed:", err.message);
  }
};

// @route GET /api/notifications
// @access Private — returns notifications for the logged-in user
// Admins see: (a) their own personal notifications + (b) broadcast (recipient: null) ones
// Employees see: only their own
const getMyNotifications = asyncHandler(async (req, res) => {
  const query = req.user.isAdmin
    ? { $or: [{ recipient: req.user._id }, { recipient: null }] }
    : { recipient: req.user._id };

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("triggeredBy", "fullName");

  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

  res.json({ notifications, unreadCount });
});

// @route PUT /api/notifications/:id/read
// @access Private
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: "Marked as read" });
});

// @route PUT /api/notifications/read-all
// @access Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const query = req.user.isAdmin
    ? { $or: [{ recipient: req.user._id }, { recipient: null }], isRead: false }
    : { recipient: req.user._id, isRead: false };

  await Notification.updateMany(query, { isRead: true });
  res.json({ message: "All marked as read" });
});

// @route DELETE /api/notifications/:id
// @access Private
const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// @route DELETE /api/notifications/clear-all
// @access Private
const clearAll = asyncHandler(async (req, res) => {
  const query = req.user.isAdmin
    ? { $or: [{ recipient: req.user._id }, { recipient: null }] }
    : { recipient: req.user._id };
  await Notification.deleteMany(query);
  res.json({ message: "Cleared" });
});

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
};
