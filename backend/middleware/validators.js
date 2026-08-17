const { body, validationResult } = require("express-validator");

// Runs after the body(...) checks below; if any failed, respond with 400
// instead of letting bad data reach the controller/DB.
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// express-validator coerces/validates types, which also closes off the
// classic NoSQL-injection trick of sending `{ "email": { "$ne": null } }`
// instead of a string — .isEmail() etc. will reject non-string input.
const registerValidation = [
  body("fullName").trim().isLength({ min: 2, max: 100 }).withMessage("Full name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),
  handleValidation,
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
  handleValidation,
];

module.exports = { registerValidation, loginValidation };
