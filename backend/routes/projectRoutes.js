const express = require("express");
const router = express.Router();
const { getAllProjects, createProject, updateProject, deleteProject } = require("../controllers/projectController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", protect, getAllProjects);
router.post("/", protect, adminOnly, createProject);
router.put("/:id", protect, adminOnly, updateProject);
router.delete("/:id", protect, adminOnly, deleteProject);

module.exports = router;
