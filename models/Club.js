// models/Club.js
const mongoose = require("mongoose");

const CLUB_SLUGS = ["sports", "debate", "music"];

const clubSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: [true, "Slug is required"],
            enum: CLUB_SLUGS,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        imageUrl: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Club", clubSchema);