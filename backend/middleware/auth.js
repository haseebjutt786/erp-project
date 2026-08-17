const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      // Token was valid but the account no longer exists (e.g. deleted
      // after the token was issued) — don't let controllers see a null user.
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user no longer exists" });
      }

      if (!req.user.isActive) {
        return res.status(403).json({ message: "This account has been deactivated" });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * adminOnly
 * ---------
 * Must run AFTER `protect` (needs req.user to already be set).
 * Blocks any request from a user whose `isAdmin` flag is false.
 * Use this on any route that manages other users' data, company-wide
 * settings, or anything only HR/Admin should touch.
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { protect, adminOnly };
