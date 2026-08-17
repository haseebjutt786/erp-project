const mongoose = require("mongoose");

/**
 * WFHRequest
 * ----------
 * An employee's request to work from home on a specific date.
 * Admin approves/rejects. On approval, user.isWFH is set to true for that day.
 */
const wfhRequestSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    reason: { type: String, trim: true, default: "" },
    workType: {
      type: String,
      enum: ["home", "hybrid", "remote"],
      default: "home",
    },
    location: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

wfhRequestSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("WFHRequest", wfhRequestSchema);
