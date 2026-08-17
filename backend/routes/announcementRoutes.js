const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  getLatestAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/latest", getLatestAnnouncements);
router.get("/", getAnnouncements);
router.post("/", adminOnly, createAnnouncement);
router.put("/:id", adminOnly, updateAnnouncement);
router.delete("/:id", adminOnly, deleteAnnouncement);

module.exports = router;
