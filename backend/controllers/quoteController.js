const Quote      = require("../models/Quote");
const asyncHandler = require("../middleware/asyncHandler");

// Fallback quotes — used when DB has no quotes yet
const FALLBACK_QUOTES = [
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
];

// @route GET /api/quotes/today
// @access Private — returns one quote per day (same all day, different every day)
const getTodayQuote = asyncHandler(async (req, res) => {
  // Seed: YYYYMMDD — stable within a day, changes every midnight
  const today = new Date();
  const seed  = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  const total = await Quote.countDocuments({ isActive: true });

  let quote;
  if (total > 0) {
    // Deterministic random: seed mod total → unique index each day
    const skip = seed % total;
    quote = await Quote.findOne({ isActive: true }).skip(skip).lean();
    // Fallback if skip overshoots (edge case)
    if (!quote) quote = await Quote.findOne({ isActive: true }).lean();
  }

  if (!quote) {
    const fb = FALLBACK_QUOTES[seed % FALLBACK_QUOTES.length];
    return res.json({ text: fb.text, author: fb.author, isFallback: true });
  }

  res.json(quote);
});

// @route GET /api/quotes         — admin: list all
const getAllQuotes = asyncHandler(async (req, res) => {
  const quotes = await Quote.find().sort({ createdAt: -1 });
  res.json(quotes);
});

// @route POST /api/quotes        — admin: create
const createQuote = asyncHandler(async (req, res) => {
  const { text, author, category } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: "Quote text is required" });
  const quote = await Quote.create({
    text: text.trim(),
    author: author?.trim() || "Unknown",
    category: category?.trim() || "motivation",
  });
  res.status(201).json(quote);
});

// @route PUT /api/quotes/:id     — admin: update
const updateQuote = asyncHandler(async (req, res) => {
  const { text, author, category, isActive } = req.body;
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ message: "Quote not found" });
  if (text     !== undefined) quote.text     = text.trim();
  if (author   !== undefined) quote.author   = author.trim();
  if (category !== undefined) quote.category = category.trim();
  if (isActive !== undefined) quote.isActive = Boolean(isActive);
  await quote.save();
  res.json(quote);
});

// @route DELETE /api/quotes/:id  — admin: delete
const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);
  if (!quote) return res.status(404).json({ message: "Quote not found" });
  await quote.deleteOne();
  res.json({ message: "Quote deleted" });
});

module.exports = { getTodayQuote, getAllQuotes, createQuote, updateQuote, deleteQuote };
