// models/Resource.js
const mongoose = require("mongoose");

const CLUB_SLUGS = ["sports", "debate", "music"];
const RESOURCE_TYPES = ["event", "post"];

const resourceSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Owner is required"],
            index: true,
        },
        clubSlug: {
            type: String,
            required: [true, "clubSlug is required"],
            enum: CLUB_SLUGS,
            index: true,
        },
        type: {
            type: String,
            required: [true, "type is required"],
            enum: RESOURCE_TYPES, // "event" or "post"
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: 2,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        // for events (optional)
        date: {
            type: Date,
            default: null,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);