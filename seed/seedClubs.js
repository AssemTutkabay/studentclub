// seed/seedClubs.js
const Club = require("../models/Club");

const DEFAULT_CLUBS = [
    {
        slug: "sports",
        title: "Sports Club",
        description: "Training, competitions, and active student life.",
        imageUrl: "",
    },
    {
        slug: "debate",
        title: "Debate Club",
        description: "Weekly debates, public speaking, and critical thinking.",
        imageUrl: "",
    },
    {
        slug: "music",
        title: "Music Club",
        description: "Rehearsals, jam sessions, and performances.",
        imageUrl: "",
    },
];

async function seedClubs() {
    try {
        // какие клубы уже есть
        const existing = await Club.find(
            { slug: { $in: DEFAULT_CLUBS.map((c) => c.slug) } },
            { slug: 1 }
        ).lean();

        const existingSlugs = new Set(existing.map((c) => c.slug));

        const missing = DEFAULT_CLUBS.filter((c) => !existingSlugs.has(c.slug));

        if (missing.length === 0) {
            console.log("Seed: clubs already exist (sports/debate/music).");
            return;
        }

        await Club.insertMany(missing);
        console.log(`Seed: inserted clubs: ${missing.map((c) => c.slug).join(", ")}`);
    } catch (err) {
        // не ломаем запуск сервера
        console.error("Seed: failed to seed clubs:", err.message);
    }
}

module.exports = seedClubs;