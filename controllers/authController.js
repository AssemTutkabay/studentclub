
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function signToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const normalizedEmail = String(email).toLowerCase().trim();

        const exists = await User.findOne({ email: normalizedEmail });
        if (exists) {
            const err = new Error("Email already exists");
            err.statusCode = 409;
            return next(err);
        }

        const hashed = await bcrypt.hash(String(password), 10);

        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password: hashed,
        });

        const token = signToken(user._id.toString());

        return res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (e) {
        return next(e);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail = String(email).toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            const err = new Error("Invalid credentials");
            err.statusCode = 401;
            return next(err);
        }

        const ok = await bcrypt.compare(String(password), user.password);
        if (!ok) {
            const err = new Error("Invalid credentials");
            err.statusCode = 401;
            return next(err);
        }

        const token = signToken(user._id.toString());

        return res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (e) {
        return next(e);
    }
};