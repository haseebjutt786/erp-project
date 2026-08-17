const mongoose = require("mongoose");

/**
 * BirthdayWish
 * ------------
 * One document per (sender → recipient) per year.
 * The unique index prevents sending duplicate wishes in the same calendar year.
 */
const birthdayWishSchema = new mongoose.Schema(
  {
    // The employee whose birthday it is
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // The employee sending the wish
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: "Happy Birthday! 🎉",
      maxlength: 500,
    },
    year: { type: Number, required: true }, // calendar year to prevent duplicate wishes
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One wish per sender-recipient pair per year
birthdayWishSchema.index({ sender: 1, recipient: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("BirthdayWish", birthdayWishSchema);
