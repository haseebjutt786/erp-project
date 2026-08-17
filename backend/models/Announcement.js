const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    body: { type: String, required: [true, "Body is required"], trim: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger"],
      default: "info",
    },
    // null = visible to everyone; specific ObjectId = only that user/dept
    audience: { type: String, default: "all", trim: true }, // "all" or dept name
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
