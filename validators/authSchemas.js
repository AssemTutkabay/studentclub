const Joi = require("joi");

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(60).required(),
    email: Joi.string().email().max(120).required(),
    password: Joi.string().min(6).max(72).required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().max(120).required(),
    password: Joi.string().min(6).max(72).required(),
});

module.exports = { registerSchema, loginSchema };