const path = require("path");
const fs   = require("fs");
const Document = require("../models/Document");
const { createNotification } = require("./notificationController");
const asyncHandler = require("../middleware/asyncHandler");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// ── helpers ──────────────────────────────────────────────────────────────────
const buildAccessFilter = (user) => {
  if (user.isAdmin) return {};
  return {
    $or: [
      { uploadedBy: user._id },
      { isPublic: true },
      { sharedWith: user._id },
    ],
  };
};

// @route GET /api/documents?page=&limit=&search=&category=&folder=
// @access Private
const getDocuments = asyncHandler(async (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page)  || 1);
  const limit    = Math.min(50, parseInt(req.query.limit) || 12);
  const skip     = (page - 1) * limit;

  const filter = { ...buildAccessFilter(req.user) };

  if (req.query.search) {
    const s = String(req.query.search).trim();
    filter.$or = [
      { name:         { $regex: s, $options: "i" } },
      { description:  { $regex: s, $options: "i" } },
      { originalName: { $regex: s, $options: "i" } },
      { tags:         { $regex: s, $options: "i" } },
    ];
    if (req.user.isAdmin) {
      // already fine
    } else {
      // merge access filter with search
      const access = buildAccessFilter(req.user);
      if (access.$or) {
        filter.$and = [{ $or: access.$or }, { $or: filter.$or }];
        delete filter.$or;
        delete filter.$or;
      }
    }
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.folder)   filter.folder   = req.query.folder;

  const [total, documents] = await Promise.all([
    Document.countDocuments(filter),
    Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "fullName"),
  ]);

  res.json({
    documents,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @route GET /api/documents/recent?limit=5
// @access Private — for dashboard widget
const getRecentDocuments = asyncHandler(async (req, res) => {
  const limit  = Math.min(10, parseInt(req.query.limit) || 5);
  const filter = buildAccessFilter(req.user);

  const docs = await Document.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("uploadedBy", "fullName");

  res.json(docs);
});

// @route GET /api/documents/folders
// @access Private — unique folder names the user can see
const getFolders = asyncHandler(async (req, res) => {
  const filter = buildAccessFilter(req.user);
  const folders = await Document.distinct("folder", filter);
  res.json(folders.sort());
});

// @route POST /api/documents/upload
// @access Private
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { name, description, category, folder, isPublic, tags } = req.body;

  const doc = await Document.create({
    name:         (name || req.file.originalname).trim(),
    originalName: req.file.originalname,
    description:  description || "",
    category:     category || "General",
    folder:       folder   || "Root",
    filename:     req.file.filename,
    mimetype:     req.file.mimetype,
    size:         req.file.size,
    path:         req.file.path,
    uploadedBy:   req.user._id,
    isPublic:     isPublic === "true" || isPublic === true,
    tags:         tags ? String(tags).split(",").map(t => t.trim()).filter(Boolean) : [],
  });

  await createNotification({
    recipient:   null,
    type:        "general",
    title:       "Document Uploaded",
    message:     `${req.user.fullName} uploaded "${doc.name}"`,
    link:        "/documents",
    triggeredBy: req.user._id,
  });

  await doc.populate("uploadedBy", "fullName");
  res.status(201).json(doc);
});

// @route GET /api/documents/:id/download
// @access Private — supports ?token= query param for direct browser downloads
const downloadDocument = asyncHandler(async (req, res) => {
  // Allow token via query param so browser <a href> downloads work
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
    // Re-verify token manually since protect middleware already ran
    const jwt  = require("jsonwebtoken");
    const User = require("../models/User");
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  const filter = { _id: req.params.id, ...buildAccessFilter(req.user) };
  const doc    = await Document.findOne(filter);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const filePath = path.join(UPLOADS_DIR, doc.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found on server" });
  }

  await Document.findByIdAndUpdate(doc._id, { $inc: { downloadCount: 1 } });
  res.download(filePath, doc.originalName);
});

// @route PUT /api/documents/:id
// @access Private — owner or admin
const updateDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const isOwner = String(doc.uploadedBy) === String(req.user._id);
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const { name, description, category, folder, isPublic, tags } = req.body;
  if (name        !== undefined) doc.name        = name.trim();
  if (description !== undefined) doc.description = description;
  if (category    !== undefined) doc.category    = category;
  if (folder      !== undefined) doc.folder      = folder;
  if (isPublic    !== undefined) doc.isPublic    = Boolean(isPublic);
  if (tags        !== undefined) {
    doc.tags = String(tags).split(",").map(t => t.trim()).filter(Boolean);
  }

  await doc.save();
  await doc.populate("uploadedBy", "fullName");
  res.json(doc);
});

// @route DELETE /api/documents/:id
// @access Private — owner or admin
const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const isOwner = String(doc.uploadedBy) === String(req.user._id);
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Delete physical file
  const filePath = path.join(UPLOADS_DIR, doc.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await doc.deleteOne();
  res.json({ message: "Document deleted" });
});

// @route GET /api/documents/stats
// @access Admin only
const getDocumentStats = asyncHandler(async (req, res) => {
  const [total, byCategory, recentUploads] = await Promise.all([
    Document.countDocuments(),
    Document.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 }, totalSize: { $sum: "$size" } } },
      { $sort: { count: -1 } },
    ]),
    Document.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  const totalSize = await Document.aggregate([
    { $group: { _id: null, total: { $sum: "$size" } } },
  ]);

  res.json({
    total,
    recentUploads,
    totalSize: totalSize[0]?.total || 0,
    byCategory,
  });
});

module.exports = {
  getDocuments, getRecentDocuments, getFolders,
  uploadDocument, downloadDocument, updateDocument, deleteDocument,
  getDocumentStats,
};
