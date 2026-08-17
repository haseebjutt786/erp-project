const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: ["HR", "Finance", "Legal", "Operations", "IT", "General", "Personal"],
      default: "General",
    },
    folder: { type: String, default: "Root", trim: true },
    // File storage
    filename: { type: String, required: true }, // stored filename (uuid)
    mimetype: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    path: { type: String, required: true }, // disk path
    // Access control
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isPublic: { type: Boolean, default: false }, // if false, only uploader + admins see it
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String, trim: true }],
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ category: 1 });
documentSchema.index({ folder: 1 });
documentSchema.index({ name: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Document", documentSchema);
