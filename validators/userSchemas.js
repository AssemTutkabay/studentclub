const Joi = require("joi");

const CLUB_SLUGS = ["sports", "debate", "music"];

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(60).optional(),

    joinClubSlug: Joi.string().valid(...CLUB_SLUGS).optional(),
})
    .min(1);

module.exports = { updateProfileSchema };