// routes/clubRoutes.js
const express = require("express");
const { getAllClubs, getClubBySlug } = require("../controllers/clubController");

const router = express.Router();

// public routes (no auth)
router.get("/", getAllClubs);
router.get("/:slug", getClubBySlug);

module.exports = router;