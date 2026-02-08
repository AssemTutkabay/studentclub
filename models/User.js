const mongoose = require("mongoose");

const CLUB_SLUGS = ["sports", "debate", "music"];

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 2,
            maxlength: 60,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 120,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },

        // NEW: user joins fixed clubs by slug
        joinedClubs: {
            type: [String],
            enum: CLUB_SLUGS,
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);