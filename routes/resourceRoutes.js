// routes/resourceRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
    resourceCreateSchema,
    resourceUpdateSchema,
} = require("../validators/resourceSchemas");

const resourceController = require("../controllers/resourceController");

const router = express.Router();

// all private
router.use(auth);

// club feed (private, joined-only)
router.get("/club/:slug", resourceController.getClubFeed);

// CRUD (required by final)
router.post("/", validate(resourceCreateSchema), resourceController.create);
router.get("/", resourceController.getMy);
router.get("/:id", resourceController.getById);
router.put("/:id", validate(resourceUpdateSchema), resourceController.update);
router.delete("/:id", resourceController.remove);

module.exports = router;