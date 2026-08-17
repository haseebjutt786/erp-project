const mongoose = require("mongoose");

/**
 * Payroll
 * -------
 * One document per employee per month. Generated in bulk from each
 * employee's current `basicSalary` (see User model), then an admin can
 * adjust allowances/bonus/deductions before marking it paid.
 */
const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true, index: true }, // "YYYY-MM"

    basicSalary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    bonus: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    // Denormalized on every save via a pre-save hook — always
    // basicSalary + allowances + bonus - deductions, never trusted
    // from the client, so it can't be tampered with by sending a bogus
    // netSalary directly.
    netSalary: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ["draft", "paid"], default: "draft", index: true },
    paidOn: { type: Date, default: null },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One payroll entry per employee per month — prevents accidentally
// generating duplicates.
payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

payrollSchema.pre("save", function (next) {
  this.netSalary = Math.max(0, this.basicSalary + this.allowances + this.bonus - this.deductions);
  next();
});

module.exports = mongoose.model("Payroll", payrollSchema);
