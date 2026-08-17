const express = require("express");
const router  = express.Router();
const {
  getTodayQuote, getAllQuotes, createQuote, updateQuote, deleteQuote,
} = require("../controllers/quoteController");
const { protect, adminOnly } = require("../middleware/auth");

router.use(protect);

router.get("/today", getTodayQuote);           // any employee
router.get("/",      adminOnly, getAllQuotes);  // admin list
router.post("/",     adminOnly, createQuote);
router.put("/:id",   adminOnly, updateQuote);
router.delete("/:id",adminOnly, deleteQuote);

module.exports = router;
