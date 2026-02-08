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


app.use(express.json({ limit: "1mb" }));


app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, "public")));

// API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/resource", resourceRoutes);

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api", (req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

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