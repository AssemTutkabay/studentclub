
const Club = require("../models/Club");


exports.getAllClubs = async (req, res, next) => {
    try {
        const clubs = await Club.find({})
            .sort({ slug: 1 })
            .lean();

        return res.json({ clubs });
    } catch (e) {
        return next(e);
    }
};


exports.getClubBySlug = async (req, res, next) => {
    try {
        const slug = String(req.params.slug || "").toLowerCase().trim();

        const club = await Club.findOne({ slug }).lean();
        if (!club) {
            const err = new Error("Club not found");
            err.statusCode = 404;
            return next(err);
        }

        return res.json({ club });
    } catch (e) {
        return next(e);

    }
};