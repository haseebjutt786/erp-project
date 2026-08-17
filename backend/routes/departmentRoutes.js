const express = require("express");
const router = express.Router();
const {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect, adminOnly);

router.get("/", getAllDepartments);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;
