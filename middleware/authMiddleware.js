
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const header = req.headers.authorization; // "Bearer <token>"

        if (!header || !header.startsWith("Bearer ")) {
            const err = new Error("Unauthorized: no token");
            err.statusCode = 401;
            return next(err);
        }

        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = { id: decoded.id };

        return next();
    } catch (e) {
        const err = new Error("Unauthorized: invalid token");
        err.statusCode = 401;
        return next(err);
    }
};