const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    project: { type: String, default: "General project" },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "done"],
      default: "not_started",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
