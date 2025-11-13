const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

// Public routes
router.get("/", recommendationController.getRecommendations);
router.get("/ratings/:bookId", recommendationController.getBookRatings);

// Protected routes (for admins/librarians)
router.post("/add", recommendationController.addRecommendation);
router.delete("/remove/:bookId", recommendationController.removeRecommendation);
router.post("/rate/:bookId", recommendationController.rateBook);

module.exports = router;