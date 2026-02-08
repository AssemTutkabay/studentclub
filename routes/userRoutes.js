const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { updateProfileSchema } = require("../validators/userSchemas");
const { getProfile, updateProfile } = require("../controllers/userController");

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, validate(updateProfileSchema), updateProfile);

module.exports = router;