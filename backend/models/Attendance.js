const mongoose = require("mongoose");

/**
 * Attendance
 * ----------
 * One document per clock-in → clock-out session. An employee can have
 * multiple sessions on the same day (clock in, break, clock back in) —
 * `date` (YYYY-MM-DD, derived from clockIn) lets us group sessions by day
 * without timezone-sensitive date math on every query.
 *
 * A session with `clockOut: null` is "currently open" — the employee is
 * clocked in right now.
 */
const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    clockIn: { type: Date, required: true },
    clockOut: { type: Date, default: null },
    minutesWorked: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
