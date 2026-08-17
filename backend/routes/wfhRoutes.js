const express = require("express");
const router  = express.Router();
const {
  submitWFHRequest, getMyWFHRequests, cancelWFHRequest,
  getAllWFHRequests, getWFHToday, reviewWFHRequest,
} = require("../controllers/wfhController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/today",       getWFHToday);          // admin — today's WFH list
router.get("/mine",        getMyWFHRequests);      // employee — own requests
router.get("/",            adminOnly, getAllWFHRequests);
router.post("/",           submitWFHRequest);
router.put("/:id/cancel",  cancelWFHRequest);
router.put("/:id/review",  adminOnly, reviewWFHRequest);

module.exports = router;
