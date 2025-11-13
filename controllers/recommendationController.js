const fs = require("fs");
const path = require("path");

const booksPath = path.join(__dirname, "../admin/adminBooks.json");
const recommendationsPath = path.join(__dirname, "../database/recommendations.json");

// Helper functions
const readBooks = () => {
  try {
    const data = fs.readFileSync(booksPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const readRecommendations = () => {
  try {
    const data = fs.readFileSync(recommendationsPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeRecommendations = (recommendations) => {
  fs.writeFileSync(recommendationsPath, JSON.stringify(recommendations, null, 2));
};

// Helper function to compare IDs (handles both string and number)
const compareIds = (id1, id2) => {
  return id1 == id2; // Use loose equality to handle string vs number
};

// Calculate average rating for a book
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((total, rating) => total + rating.stars, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
};

// Generate star display
const generateStarRating = (averageRating) => {
  const fullStars = Math.floor(averageRating);
  const halfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return {
    average: averageRating,
    fullStars,
    halfStar,
    emptyStars,
    totalRatings: 0 // This will be set when calculating
  };
};

// Controller methods
exports.getRecommendations = (req, res) => {
  try {
    const books = readBooks();
    const recommendations = readRecommendations();
    
    // Get recommended books (admin curated)
    const recommendedBooks = recommendations
      .filter(rec => rec.isRecommended)
      .map(rec => {
        const book = books.find(b => compareIds(b.id, rec.bookId));
        if (book) {
          const averageRating = calculateAverageRating(book.ratings || []);
          return {
            ...book,
            starRating: generateStarRating(averageRating),
            totalRatings: (book.ratings || []).length,
            recommendationReason: rec.reason
          };
        }
        return null;
      })
      .filter(book => book !== null);

    // Get popular books (based on ratings and checkout frequency)
    const popularBooks = books
      .map(book => {
        const averageRating = calculateAverageRating(book.ratings || []);
        const popularityScore = averageRating * 2 + (book.checkoutCount || 0);
        return {
          ...book,
          starRating: generateStarRating(averageRating),
          totalRatings: (book.ratings || []).length,
          popularityScore
        };
      })
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 6);

    // Get recently added books
    const recentBooks = books
      .sort((a, b) => new Date(b.dateAdded || b.addedDate || b.createdAt) - new Date(a.dateAdded || a.addedDate || a.createdAt))
      .slice(0, 4)
      .map(book => {
        const averageRating = calculateAverageRating(book.ratings || []);
        return {
          ...book,
          starRating: generateStarRating(averageRating),
          totalRatings: (book.ratings || []).length
        };
      });

    res.status(200).json({
      success: true,
      recommended: recommendedBooks,
      popular: popularBooks,
      recent: recentBooks
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
      error: err.message
    });
  }
};

exports.addRecommendation = (req, res) => {
  try {
    const { bookId, reason } = req.body;
    const books = readBooks();
    
    // Use loose comparison to handle both string and number IDs
    const book = books.find(b => compareIds(b.id, bookId));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const recommendations = readRecommendations();
    
    // Check if already recommended (using loose comparison)
    const existingRec = recommendations.find(rec => compareIds(rec.bookId, bookId));
    if (existingRec) {
      return res.status(400).json({
        success: false,
        message: "Book is already recommended"
      });
    }

    const newRecommendation = {
      id: Date.now().toString(),
      bookId: book.id, // Use the actual book ID from the found book
      reason: reason || "Highly recommended by library staff",
      isRecommended: true,
      addedBy: req.user?.id || "admin",
      addedAt: new Date().toISOString()
    };

    recommendations.push(newRecommendation);
    writeRecommendations(recommendations);

    res.status(201).json({
      success: true,
      message: "Book added to recommendations",
      recommendation: newRecommendation
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add recommendation",
      error: err.message
    });
  }
};

exports.removeRecommendation = (req, res) => {
  try {
    const { bookId } = req.params;
    const recommendations = readRecommendations();
    
    // Use loose comparison for removal
    const updatedRecommendations = recommendations.filter(rec => !compareIds(rec.bookId, bookId));
    
    if (updatedRecommendations.length === recommendations.length) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found"
      });
    }

    writeRecommendations(updatedRecommendations);

    res.status(200).json({
      success: true,
      message: "Recommendation removed successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to remove recommendation",
      error: err.message
    });
  }
};

exports.rateBook = (req, res) => {
  try {
    const { bookId } = req.params;
    const { userId, stars, comment } = req.body;

    if (!userId || !stars || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        message: "Valid userId and stars (1-5) are required"
      });
    }

    const books = readBooks();
    
    // Use loose comparison to find book
    const bookIndex = books.findIndex(b => compareIds(b.id, bookId));

    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Initialize ratings array if it doesn't exist
    if (!books[bookIndex].ratings) {
      books[bookIndex].ratings = [];
    }

    // Check if user already rated this book
    const existingRatingIndex = books[bookIndex].ratings.findIndex(r => compareIds(r.userId, userId));
    const newRating = {
      userId,
      stars: parseInt(stars),
      comment: comment || "",
      ratedAt: new Date().toISOString()
    };

    if (existingRatingIndex !== -1) {
      // Update existing rating
      books[bookIndex].ratings[existingRatingIndex] = newRating;
    } else {
      // Add new rating
      books[bookIndex].ratings.push(newRating);
    }

    // Calculate new average rating
    const averageRating = calculateAverageRating(books[bookIndex].ratings);
    books[bookIndex].averageRating = averageRating;
    books[bookIndex].totalRatings = books[bookIndex].ratings.length;

    // Write updated books back to file
    fs.writeFileSync(booksPath, JSON.stringify(books, null, 2));

    res.status(200).json({
      success: true,
      message: "Book rated successfully",
      rating: newRating,
      averageRating: averageRating,
      totalRatings: books[bookIndex].ratings.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to rate book",
      error: err.message
    });
  }
};

exports.getBookRatings = (req, res) => {
  try {
    const { bookId } = req.params;
    const books = readBooks();
    
    // Use loose comparison to find book
    const book = books.find(b => compareIds(b.id, bookId));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const averageRating = calculateAverageRating(book.ratings || []);
    const starRating = generateStarRating(averageRating);
    starRating.totalRatings = (book.ratings || []).length;

    res.status(200).json({
      success: true,
      ratings: book.ratings || [],
      averageRating: averageRating,
      starRating: starRating,
      totalRatings: (book.ratings || []).length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch book ratings",
      error: err.message
    });
  }
};