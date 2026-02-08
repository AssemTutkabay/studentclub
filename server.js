// server.js
require("dotenv").config();

const path = require("path");
const express = require("express");

const connectDB = require("./config/db");
const seedClubs = require("./seed/seedClubs");

// routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const clubRoutes = require("./routes/clubRoutes");
const resourceRoutes = require("./routes/resourceRoutes");

// middleware
const errorHandler = require("./middleware/errorHandler");

const app = express();

// ===== Core middleware =====
app.use(express.json({ limit: "1mb" }));

// (optional) tiny request log, helps during defense
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ===== Static frontend =====
// Your structure is: /public/index.html, /public/styles.css, /public/app.js, etc.
app.use(express.static(path.join(__dirname, "public")));

// ===== API routes =====
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/resource", resourceRoutes);

// ===== Nice root fallback (optional but useful) =====
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== API 404 (so missing endpoints are clear) =====
app.use("/api", (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ===== Error handler (must be last) =====
app.use(errorHandler);

// ===== Start server =====
const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await connectDB();
        await seedClubs();

        app.listen(PORT, () => {
            console.log(`Server running: http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Fatal start error:", err.message);
        process.exit(1);
    }
})();