const Settings = require("../models/Settings");
const asyncHandler = require("../middleware/asyncHandler");
const path = require("path");
const fs   = require("fs");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// @route GET /api/settings
// @access Private — any logged-in user (read)
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ companyId: "default" });
  if (!settings) {
    settings = await Settings.create({ companyId: "default" });
  }
  res.json(settings);
});

// @route PUT /api/settings
// @access Admin only
const updateSettings = asyncHandler(async (req, res) => {
  const allowedFields = [
    "companyName", "companyEmail", "companyPhone", "companyAddress",
    "companyWebsite", "timezone", "currency", "currencySymbol", "dateFormat",
    "workingDays", "workStartTime", "workEndTime", "lateThreshold",
    "annualLeavePerYear", "sickLeavePerYear", "casualLeavePerYear",
    "emailNotifications", "theme", "primaryColor",
    "payrollCycle", "payrollDay", "taxRate",
  ];

  const update = {};
  allowedFields.forEach(f => {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  });

  // Handle logo upload
  if (req.file) {
    // Delete old logo if exists
    const current = await Settings.findOne({ companyId: "default" });
    if (current?.companyLogo) {
      const oldPath = path.join(UPLOADS_DIR, current.companyLogo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    update.companyLogo = req.file.filename;
  }

  const settings = await Settings.findOneAndUpdate(
    { companyId: "default" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(settings);
});

module.exports = { getSettings, updateSettings };
