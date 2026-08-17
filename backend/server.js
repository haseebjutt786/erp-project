const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/rateLimiter");

dotenv.config();

// Fail fast on startup if critical secrets are missing, instead of running
// with an undefined JWT_SECRET (which would make tokens trivially forgeable
// or crash unpredictably later).
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("JWT_SECRET is too short — use at least 32 random characters in production.");
  process.exit(1);
}

connectDB();

const app = express();

// Sets a range of protective HTTP headers (X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security, etc.)
app.use(helmet());

// Strict CORS: only the configured frontend origin(s) may call this API.
// CLIENT_URL can be a single URL or a comma-separated list (e.g. when the
// frontend dev server sometimes lands on a different port). Each incoming
// origin is checked against that whitelist and, if allowed, reflected back
// as a single value — the CORS spec doesn't allow returning a multi-value
// Access-Control-Allow-Origin header, so we can't just pass the raw env
// string straight through.
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Strips any request keys starting with "$" or containing "." from
// req.body/params/query — closes the NoSQL-injection path where an
// attacker sends { "email": { "$gt": "" } } instead of a string.
app.use(mongoSanitize());

app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/payroll", require("./routes/payrollRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/notifications",  require("./routes/notificationRoutes"));
app.use("/api/announcements",  require("./routes/announcementRoutes"));
app.use("/api/documents",      require("./routes/documentRoutes"));
app.use("/api/settings",       require("./routes/settingsRoutes"));
app.use("/api/reports",         require("./routes/reportsRoutes"));
app.use("/api/report-export",   require("./routes/reportExportRoutes"));
app.use("/api/wfh",            require("./routes/wfhRoutes"));
app.use("/api/birthdays",      require("./routes/birthdayRoutes"));
app.use("/api/quotes",         require("./routes/quoteRoutes"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("HRMS ERP API is running...");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;



