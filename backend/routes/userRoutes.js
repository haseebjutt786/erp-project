const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
} = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/auth");

// Every route here requires an authenticated admin — applied once at the
// router level rather than repeated on each line.
router.use(protect, adminOnly);

router.get("/", getAllUsers);
router.post("/", createEmployee);
router.get("/:id", getUserById);
router.put("/:id", updateEmployee);
router.put("/:id/deactivate", deactivateEmployee);
router.put("/:id/reactivate", reactivateEmployee);

module.exports = router;
