const express = require("express");
const router  = express.Router();
const upload  = require("../middleware/upload");
const { getSettings, updateSettings } = require("../controllers/settingsController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/", getSettings);
router.put("/", adminOnly, upload.single("logo"), updateSettings);

module.exports = router;
