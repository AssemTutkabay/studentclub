// routes/externalRoutes.js
const express = require("express");
const { getWeatherByCity } = require("../controllers/externalController");

const router = express.Router();

// Public (можно public, потому что это не про приватные данные)
router.get("/weather", getWeatherByCity);

module.exports = router;