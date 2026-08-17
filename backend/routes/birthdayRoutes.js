const express = require("express");
const router  = express.Router();
const {
  getBirthdays, sendWish,
  getWishesForEmployee, getUnreadWishCount,
} = require("../controllers/birthdayController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/",                       getBirthdays);
router.get("/wishes/unread-count",    getUnreadWishCount);
router.get("/:userId/wishes",         getWishesForEmployee);
router.post("/:userId/wish",          sendWish);

module.exports = router;
