// middleware/validate.js
module.exports = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const message = error.details.map((d) => d.message).join(", ");
        const err = new Error(message);
        err.statusCode = 400; // Bad Request
        return next(err);
    }

    req.body = value;
    next();
};