const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    description: { type: String, default: "", trim: true },

    // Optional — who heads this department. Not required, since a new
    // department might exist before a manager is assigned to it.
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
