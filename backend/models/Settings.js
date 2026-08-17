const mongoose = require("mongoose");

// One singleton document per company — upserted by companyId "default"
const settingsSchema = new mongoose.Schema(
  {
    companyId: { type: String, default: "default", unique: true },
    // Company Info
    companyName:    { type: String, default: "HA Technologies" },
    companyEmail:   { type: String, default: "" },
    companyPhone:   { type: String, default: "" },
    companyAddress: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    companyLogo:    { type: String, default: "" }, // stored filename
    timezone:       { type: String, default: "Asia/Karachi" },
    currency:       { type: String, default: "USD" },
    currencySymbol: { type: String, default: "$" },
    dateFormat:     { type: String, default: "MM/DD/YYYY" },
    // Work Schedule
    workingDays:    { type: [String], default: ["Mon","Tue","Wed","Thu","Fri"] },
    workStartTime:  { type: String, default: "09:00" },
    workEndTime:    { type: String, default: "18:00" },
    lateThreshold:  { type: Number, default: 15 }, // minutes after workStartTime
    // Leave Policy
    annualLeavePerYear: { type: Number, default: 14 },
    sickLeavePerYear:   { type: Number, default: 10 },
    casualLeavePerYear: { type: Number, default: 7 },
    // Notifications
    emailNotifications: { type: Boolean, default: false },
    // Theme
    theme:       { type: String, enum: ["light","dark","system"], default: "light" },
    primaryColor: { type: String, default: "#ff7b0d" },
    // Payroll
    payrollCycle: { type: String, enum: ["monthly","bi-monthly","weekly"], default: "monthly" },
    payrollDay:   { type: Number, default: 25 }, // day of month to run payroll
    taxRate:      { type: Number, default: 0 },  // percentage
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
