const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const userDBPath = path.join(__dirname, '../database/userDB.json');

// Helper function to read users
const readUsers = () => {
  try {
    const data = fs.readFileSync(userDBPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading user DB:', err);
    return [];
  }
};

// Dashboard statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const users = readUsers();
    
    // Get last 4 registered users (sorted by createdAt)
    const recentUsers = users
      .filter(user => user.createdAt) // Ensure user has createdAt
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    res.json({
      totalUsers: users.length,
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        lastLogin: user.updatedAt || user.createdAt // Use updatedAt if available, else createdAt
      }))
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;