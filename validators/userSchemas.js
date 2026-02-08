// validators/userSchemas.js
const Joi = require("joi");

const CLUB_SLUGS = ["sports", "debate", "music"];

const updateProfileSchema = Joi.object({
    // optional: user may update name
    name: Joi.string().min(2).max(60).optional(),

    // optional: join club by slug
    joinClubSlug: Joi.string().valid(...CLUB_SLUGS).optional(),
})
    // require at least one field (so empty body is 400)
    .min(1);

module.exports = { updateProfileSchema };