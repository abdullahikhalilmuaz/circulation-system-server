const fs = require("fs");
const path = require("path");

const userRecommendationsPath = path.join(__dirname, "../database/userRecommendations.json");

// Helper functions
const readUserRecommendations = () => {
  try {
    const data = fs.readFileSync(userRecommendationsPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeUserRecommendations = (recommendations) => {
  fs.writeFileSync(userRecommendationsPath, JSON.stringify(recommendations, null, 2));
};

// Initialize file if it doesn't exist
const initUserRecommendationsFile = () => {
  if (!fs.existsSync(userRecommendationsPath)) {
    writeUserRecommendations([]);
  }
};

// Initialize on require
initUserRecommendationsFile();

// Controller methods
exports.createUserRecommendation = (req, res) => {
  try {
    const { title, author, genre, reason, bookLink, userId, userName } = req.body;

    // Validation
    if (!title || !author || !reason || !userId) {
      return res.status(400).json({
        success: false,
        message: "Title, author, reason, and userId are required fields"
      });
    }

    const recommendations = readUserRecommendations();

    const newRecommendation = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      genre: genre || "General",
      reason: reason.trim(),
      bookLink: bookLink || "",
      userId: userId,
      userName: userName || "Anonymous User",
      status: "pending", // pending, approved, rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    recommendations.push(newRecommendation);
    writeUserRecommendations(recommendations);

    res.status(201).json({
      success: true,
      message: "Book recommendation submitted successfully",
      recommendation: newRecommendation
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to submit book recommendation",
      error: err.message
    });
  }
};

exports.getAllUserRecommendations = (req, res) => {
  try {
    const { status } = req.query;
    let recommendations = readUserRecommendations();

    // Filter by status if provided
    if (status) {
      recommendations = recommendations.filter(rec => rec.status === status);
    }

    // Sort by creation date (newest first)
    recommendations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      recommendations: recommendations,
      total: recommendations.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user recommendations",
      error: err.message
    });
  }
};

exports.getUserRecommendationsByUser = (req, res) => {
  try {
    const { userId } = req.params;
    const recommendations = readUserRecommendations();

    const userRecommendations = recommendations.filter(rec => rec.userId == userId);
    
    // Sort by creation date (newest first)
    userRecommendations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      recommendations: userRecommendations,
      total: userRecommendations.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user recommendations",
      error: err.message
    });
  }
};

exports.updateRecommendationStatus = (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (pending, approved, rejected) is required"
      });
    }

    const recommendations = readUserRecommendations();
    const recommendationIndex = recommendations.findIndex(rec => rec.id === recommendationId);

    if (recommendationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found"
      });
    }

    recommendations[recommendationIndex].status = status;
    recommendations[recommendationIndex].adminNotes = adminNotes || "";
    recommendations[recommendationIndex].updatedAt = new Date().toISOString();
    recommendations[recommendationIndex].processedBy = req.user?.id || "admin";
    recommendations[recommendationIndex].processedAt = new Date().toISOString();

    writeUserRecommendations(recommendations);

    res.status(200).json({
      success: true,
      message: `Recommendation ${status} successfully`,
      recommendation: recommendations[recommendationIndex]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update recommendation status",
      error: err.message
    });
  }
};

exports.deleteUserRecommendation = (req, res) => {
  try {
    const { recommendationId } = req.params;
    const recommendations = readUserRecommendations();

    const recommendationIndex = recommendations.findIndex(rec => rec.id === recommendationId);

    if (recommendationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found"
      });
    }

    const deletedRecommendation = recommendations.splice(recommendationIndex, 1);
    writeUserRecommendations(recommendations);

    res.status(200).json({
      success: true,
      message: "Recommendation deleted successfully",
      recommendation: deletedRecommendation[0]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete recommendation",
      error: err.message
    });
  }
};

exports.getRecommendationStats = (req, res) => {
  try {
    const recommendations = readUserRecommendations();

    const stats = {
      total: recommendations.length,
      pending: recommendations.filter(rec => rec.status === 'pending').length,
      approved: recommendations.filter(rec => rec.status === 'approved').length,
      rejected: recommendations.filter(rec => rec.status === 'rejected').length,
      byGenre: {}
    };

    // Count by genre
    recommendations.forEach(rec => {
      const genre = rec.genre || 'Unknown';
      stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendation statistics",
      error: err.message
    });
  }
};