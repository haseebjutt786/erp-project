/**
 * makeAdmin.js
 * ------------
 * One-off CLI script to promote an existing user to Admin.
 * This is intentionally a script (run manually by whoever has server/DB
 * access) and NOT an API endpoint — an "become admin" HTTP route would be
 * a serious privilege-escalation risk if it were ever exposed.
 *
 * Usage:
 *   node scripts/makeAdmin.js someone@example.com
 */
const dns = require("dns");

// Force Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "../.env") });

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { isAdmin: true },
      { new: true }
    );

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ ${user.fullName} (${user.email}) is now an admin.`);
    console.log("Log out and log back in on the frontend for the change to take effect.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
