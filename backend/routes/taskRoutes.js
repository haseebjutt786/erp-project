const express = require("express");
const router = express.Router();
const { getMyTasks, getAllTasks, createTask, updateTaskStatus } = require("../controllers/taskController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/mine", protect, getMyTasks);
router.get("/", protect, adminOnly, getAllTasks);
router.post("/", protect, createTask);
router.put("/:id/status", protect, updateTaskStatus);

module.exports = router;
