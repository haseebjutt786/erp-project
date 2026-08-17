const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    text:      { type: String, required: true, trim: true },
    author:    { type: String, default: "Unknown", trim: true },
    category:  { type: String, default: "motivation", trim: true },
    isActive:  { type: Boolean, default: true },
    // Day index (0-364) — if set, this quote shows on that day of year
    dayIndex:  { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
