// controllers/externalController.js

exports.getWeatherByCity = async (req, res, next) => {
    try {
        const city = String(req.query.city || "").trim();
        if (!city) {
            const err = new Error("Validation error: city is required");
            err.statusCode = 400;
            return next(err);
        }

        // 1) Geocoding (Open-Meteo)
        const geoUrl =
            "https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=" +
            encodeURIComponent(city);

        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) {
            const err = new Error("External API error: geocoding failed");
            err.statusCode = 502;
            return next(err);
        }

        const geo = await geoRes.json();
        const first = geo && geo.results && geo.results[0];
        if (!first) {
            const err = new Error("City not found");
            err.statusCode = 404;
            return next(err);
        }

        const { latitude, longitude, name, country } = first;

        // 2) Weather forecast (Open-Meteo)
        // Берем current_weather + hourly temperature/windspeed, чтобы было что показать
        const wUrl =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${encodeURIComponent(latitude)}` +
            `&longitude=${encodeURIComponent(longitude)}` +
            "&current_weather=true" +
            "&hourly=temperature_2m,windspeed_10m" +
            "&forecast_days=1";

        const wRes = await fetch(wUrl);
        if (!wRes.ok) {
            const err = new Error("External API error: weather failed");
            err.statusCode = 502;
            return next(err);
        }

        const w = await wRes.json();

        return res.json({
            city: `${name}${country ? ", " + country : ""}`,
            latitude,
            longitude,
            current: w.current_weather || null,
            hourly: w.hourly || null,
        });
    } catch (e) {
        return next(e);
    }
};