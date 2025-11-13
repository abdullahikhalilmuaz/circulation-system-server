const express = require("express");
const router = express.Router();
const userRecommendationController = require("../controllers/userRecommendationController");

// Public routes (for users to submit recommendations)
router.post("/", userRecommendationController.createUserRecommendation);
router.get("/user/:userId", userRecommendationController.getUserRecommendationsByUser);

// Admin routes (for managing recommendations)
router.get("/", userRecommendationController.getAllUserRecommendations);
router.get("/stats", userRecommendationController.getRecommendationStats);
router.put("/:recommendationId/status", userRecommendationController.updateRecommendationStatus);
router.delete("/:recommendationId", userRecommendationController.deleteUserRecommendation);

module.exports = router;