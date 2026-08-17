const Announcement = require("../models/Announcement");
const { createNotification } = require("./notificationController");
const asyncHandler = require("../middleware/asyncHandler");

// @route GET /api/announcements?page=1&limit=10&search=
// @access Private — all logged-in users
const getAnnouncements = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const s = String(req.query.search).trim();
    filter.$or = [
      { title: { $regex: s, $options: "i" } },
      { body:  { $regex: s, $options: "i" } },
    ];
  }
  if (req.query.type) filter.type = req.query.type;

  // Non-admins only see "all" audience announcements
  if (!req.user.isAdmin) {
    filter.$or = filter.$or
      ? [{ $and: [{ $or: filter.$or }, { audience: "all" }] }]
      : [{ audience: "all" }, { audience: req.user.department || "__none__" }];
    delete filter.$or; // simplify: non-admin always sees 'all' + their dept
    filter.$or = [
      { audience: "all" },
      ...(req.user.department ? [{ audience: req.user.department }] : []),
    ];
  }

  const [total, announcements] = await Promise.all([
    Announcement.countDocuments(filter),
    Announcement.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("postedBy", "fullName"),
  ]);

  res.json({
    announcements,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route GET /api/announcements/latest?limit=5
// @access Private — for dashboard widget
const getLatestAnnouncements = asyncHandler(async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit) || 5);
  const filter = req.user.isAdmin ? {} : { $or: [{ audience: "all" }, { audience: req.user.department || "" }] };

  const announcements = await Announcement.find(filter)
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .populate("postedBy", "fullName");

  res.json(announcements);
});

// @route POST /api/announcements
// @access Admin only
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, type, audience, isPinned } = req.body;

  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ message: "Title and body are required" });
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    body: body.trim(),
    type: ["info", "success", "warning", "danger"].includes(type) ? type : "info",
    audience: audience || "all",
    isPinned: !!isPinned,
    postedBy: req.user._id,
  });

  // Notify all users (broadcast)
  await createNotification({
    recipient: null, // broadcast to all admins
    type: "announcement_published",
    title: "New Announcement",
    message: announcement.title,
    link: "/announcements",
    triggeredBy: req.user._id,
  });

  await announcement.populate("postedBy", "fullName");
  res.status(201).json(announcement);
});

// @route PUT /api/announcements/:id
// @access Admin only
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, type, audience, isPinned } = req.body;

  const ann = await Announcement.findById(req.params.id);
  if (!ann) return res.status(404).json({ message: "Announcement not found" });

  if (title !== undefined) ann.title = title.trim();
  if (body  !== undefined) ann.body  = body.trim();
  if (type  !== undefined && ["info","success","warning","danger"].includes(type)) ann.type = type;
  if (audience  !== undefined) ann.audience  = audience;
  if (isPinned  !== undefined) ann.isPinned  = !!isPinned;

  await ann.save();
  await ann.populate("postedBy", "fullName");
  res.json(ann);
});

// @route DELETE /api/announcements/:id
// @access Admin only
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const ann = await Announcement.findById(req.params.id);
  if (!ann) return res.status(404).json({ message: "Announcement not found" });
  await ann.deleteOne();
  res.json({ message: "Announcement deleted" });
});

module.exports = {
  getAnnouncements,
  getLatestAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
