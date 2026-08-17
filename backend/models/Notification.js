const mongoose = require("mongoose");

/**
 * Notification
 * ------------
 * Stores in-app notifications for individual users or all admins.
 * `recipient` is either a specific user _id, or null meaning "all admins".
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = broadcast to all admins
      index: true,
    },
    type: {
      type: String,
      enum: [
        "employee_joined",
        "employee_updated",
        "leave_applied",
        "leave_approved",
        "leave_rejected",
        "payroll_generated",
        "task_assigned",
        "task_completed",
        "announcement_published",
        "department_created",
        "clock_in",
        "clock_out",
        "wfh_applied",
        "wfh_approved",
        "wfh_rejected",
        "birthday_wish",
        "general",
      ],
      default: "general",
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "" }, // frontend route to navigate on click
    isRead: { type: Boolean, default: false, index: true },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
