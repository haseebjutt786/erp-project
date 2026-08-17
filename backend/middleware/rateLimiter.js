const rateLimit = require("express-rate-limit");

/**
 * authLimiter
 * -----------
 * Applies to /login and /register.
 * Limits each IP to a small number of attempts per window — this is the
 * standard defense against brute-force password guessing and credential
 * stuffing. Legitimate users rarely hit this; attackers trying thousands
 * of combinations do.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

/**
 * apiLimiter
 * ----------
 * A looser, general-purpose limiter for the rest of the API, to blunt
 * scripted abuse / accidental infinite-loop clients without affecting
 * normal usage.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
