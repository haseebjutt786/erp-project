const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getMyNotifications);
router.put("/read-all", markAllAsRead);
router.delete("/clear-all", clearAll);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
