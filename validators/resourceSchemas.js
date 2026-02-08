// validators/resourceSchemas.js
const Joi = require("joi");

const CLUB_SLUGS = ["sports", "debate", "music"];
const TYPES = ["event", "post"];

// Базовые поля
const baseFields = {
    clubSlug: Joi.string().valid(...CLUB_SLUGS),
    type: Joi.string().valid(...TYPES),
    title: Joi.string().min(2).max(120),
    description: Joi.string().max(1000).allow(""),
    // date/location: логика зависит от type, см. ниже
    date: Joi.date().iso(),
    location: Joi.string().min(2).max(120),
};

// CREATE: обязательные поля + условие для event
const resourceCreateSchema = Joi.object({
    clubSlug: baseFields.clubSlug.required(),
    type: baseFields.type.required(),
    title: baseFields.title.required(),
    description: baseFields.description.optional(),

    date: baseFields.date.optional(),
    location: baseFields.location.optional(),
})
    // если event -> date/location обязательны
    .when(Joi.object({ type: Joi.valid("event") }).unknown(), {
        then: Joi.object({
            date: baseFields.date.required(),
            location: baseFields.location.required(),
        }),
    })
    // если post -> date/location запрещаем (чтобы не было мусора)
    .when(Joi.object({ type: Joi.valid("post") }).unknown(), {
        then: Joi.object({
            date: Joi.forbidden(),
            location: Joi.forbidden(),
        }),
    });

// UPDATE: все поля optional, но тело не может быть пустым + та же условная логика
const resourceUpdateSchema = Joi.object({
    clubSlug: baseFields.clubSlug.optional(),
    type: baseFields.type.optional(),
    title: baseFields.title.optional(),
    description: baseFields.description.optional(),

    date: baseFields.date.optional(),
    location: baseFields.location.optional(),
})
    .min(1)
    .when(Joi.object({ type: Joi.valid("event") }).unknown(), {
        then: Joi.object({
            date: baseFields.date.required(),
            location: baseFields.location.required(),
        }),
    })
    .when(Joi.object({ type: Joi.valid("post") }).unknown(), {
        then: Joi.object({
            date: Joi.forbidden(),
            location: Joi.forbidden(),
        }),
    });

module.exports = { resourceCreateSchema, resourceUpdateSchema };