
const mongoose = require("mongoose");
const Resource = require("../models/Resource");
const User = require("../models/User");

const ALLOWED_SLUGS = ["sports", "debate", "music"];

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function ensureJoined(user, clubSlug) {
    return Array.isArray(user.joinedClubs) && user.joinedClubs.includes(clubSlug);
}

async function getUserJoinedClubs(ownerId) {
    return User.findById(ownerId).select("joinedClubs").lean();
}

exports.create = async (req, res, next) => {
    try {
        const ownerId = req.user?.id;
        const { clubSlug, type, title, description, date, location } = req.body || {};

        if (!ALLOWED_SLUGS.includes(clubSlug)) {
            const err = new Error("Validation error: invalid clubSlug");
            err.statusCode = 400;
            return next(err);
        }

        const user = await getUserJoinedClubs(ownerId);
        if (!user) {
            const err = new Error("Unauthorized");
            err.statusCode = 401;
            return next(err);
        }
        if (!ensureJoined(user, clubSlug)) {
            const err = new Error("Forbidden: join the club first");
            err.statusCode = 403;
            return next(err);
        }

        const payload = {
            owner: ownerId,
            clubSlug,
            type,
            title: String(title).trim(),
            description: String(description || "").trim(),
        };

        if (type === "event") {
            if (date) payload.date = date; // else don't set -> schema default null
            if (location) payload.location = String(location).trim(); // else default ""
        }

        const resource = await Resource.create(payload);
        return res.status(201).json({ resource });
    } catch (e) {
        return next(e);
    }
};

exports.getMy = async (req, res, next) => {
    try {
        const ownerId = req.user?.id;
        const resources = await Resource.find({ owner: ownerId })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ resources });
    } catch (e) {
        return next(e);
    }
};

exports.getClubFeed = async (req, res, next) => {
    try {
        const ownerId = req.user?.id;
        const slug = String(req.params.slug || "").trim();

        if (!ALLOWED_SLUGS.includes(slug)) {
            return res.status(400).json({ message: "Validation error: invalid clubSlug" });
        }

        const user = await getUserJoinedClubs(ownerId);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        if (!ensureJoined(user, slug)) {
            return res.status(403).json({ message: "Forbidden: join the club first" });
        }

        const resources = await Resource.find({ clubSlug: slug })
            .sort({ createdAt: -1 })
            .lean();

        return res.json({ resources });
    } catch (e) {
        return next(e);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            const err = new Error("Resource not found");
            err.statusCode = 404;
            return next(err);
        }

        const resource = await Resource.findById(id);
        if (!resource) {
            const err = new Error("Resource not found");
            err.statusCode = 404;
            return next(err);
        }

        if (resource.owner.toString() !== ownerId) {
            const err = new Error("Forbidden: not your resource");
            err.statusCode = 403;
            return next(err);
        }

        return res.json({ resource });
    } catch (e) {
        return next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            const err = new Error("Resource not found");
            err.statusCode = 404;
            return next(err);
        }

        const resource = await Resource.findById(id);
        if (!resource) {
            const err = new Error("Resource not found");
            err.statusCode = 404;
            return next(err);
        }

        if (resource.owner.toString() !== ownerId) {
            const err = new Error("Forbidden: not your resource");
            err.statusCode = 403;
            return next(err);
        }

        const { clubSlug, type, title, description, date, location } = req.body || {};

        // safest: forbid changing clubSlug (prevents join bypass)
        if (typeof clubSlug !== "undefined" && clubSlug !== resource.clubSlug) {
            const err = new Error("Validation error: clubSlug cannot be changed");
            err.statusCode = 400;
            return next(err);
        }

        if (typeof type !== "undefined") resource.type = type;
        if (typeof title !== "undefined") resource.title = String(title).trim();
        if (typeof description !== "undefined") resource.description = String(description || "").trim();

        // keep consistent:
        if (typeof date !== "undefined") resource.date = date ? date : null;
        if (typeof location !== "undefined") resource.location = location ? String(location).trim() : "";

        await resource.save();
        return res.json({ resource });
    } catch (e) {
        return next(e);
    }
};

// DELETE /api/resource/:id (private, required by final)
exports.remove = async (req, res, next) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            const err = new Error("Resource not found");
            err.statusCode = 404;
            return next(err);
        }

        const resource = await Resource.findById(id);
        if (!resource) {
            const err = new Error("Resource not found");
            err.statusCode = 404;
            return next(err);
        }

        if (resource.owner.toString() !== ownerId) {
            const err = new Error("Forbidden: not your resource");
            err.statusCode = 403;
            return next(err);
        }

        await resource.deleteOne();
        return res.json({ ok: true });
    } catch (e) {
        return next(e);
    }
};