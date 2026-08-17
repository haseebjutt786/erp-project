const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Project name is required"], unique: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["active", "on_hold", "completed"],
      default: "active",
    },
    deadline: { type: Date, default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
