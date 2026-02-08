
const User = require("../models/User");

const CLUB_SLUGS = ["sports", "debate", "music"];

// GET /api/users/profile (private)
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        const user = await User.findById(userId)
            .select("name email joinedClubs")
            .lean();

        if (!user) {
            const err = new Error("User not found");
            err.statusCode = 404;
            return next(err);
        }

        return res.json({ user });
    } catch (e) {
        return next(e);
    }
};

// PUT /api/users/profile (private)
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { name, joinClubSlug } = req.body || {};

        const user = await User.findById(userId);
        if (!user) {
            const err = new Error("User not found");
            err.statusCode = 404;
            return next(err);
        }

        // update name (optional)
        if (typeof name !== "undefined") {
            const trimmed = String(name).trim();
            if (trimmed.length < 2) {
                const err = new Error("Validation error: name must be at least 2 characters");
                err.statusCode = 400;
                return next(err);
            }
            user.name = trimmed;
        }

        // join club (optional)
        if (typeof joinClubSlug !== "undefined") {
            const slug = String(joinClubSlug).toLowerCase().trim();

            if (!CLUB_SLUGS.includes(slug)) {
                const err = new Error("Validation error: invalid joinClubSlug");
                err.statusCode = 400;
                return next(err);
            }

            // make join idempotent (no duplicates)
            if (!user.joinedClubs.includes(slug)) {
                user.joinedClubs.push(slug);
            }
        }

        await user.save();

        return res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                joinedClubs: user.joinedClubs,
            },
        });
    } catch (e) {
        return next(e);
    }
};