const fs = require("fs");
const path = require("path");

const userDBPath = path.join(__dirname, "../database/userDB.json");

// Helper function to read users
const readUsers = () => {
  try {
    const data = fs.readFileSync(userDBPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading user DB:", err);
    return [];
  }
};

// Helper function to write users
const writeUsers = (users) => {
  try {
    fs.writeFileSync(userDBPath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Error writing to user DB:", err);
    throw err;
  }
};

// Get all users
const getAllUsers = (req, res) => {
  try {
    const users = readUsers();
    res.status(200).json({
      success: true,
      message: users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load user data",
    });
  }
};

// Get user by ID
const getUserById = (req, res) => {
  try {
    const users = readUsers();
    const user = users.find((u) => u.id === parseInt(req.params.id));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load user data",
    });
  }
};

// Create new user
const createUser = (req, res) => {
  try {
    const users = readUsers();
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    res.status(201).json({
      success: true,
      message: newUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// Update user
const updateUser = (req, res) => {
  try {
    const users = readUsers();
    const index = users.findIndex((u) => u.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = {
      ...users[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    writeUsers(users);

    res.status(200).json({
      success: true,
      message: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user
const deleteUser = (req, res) => {
  try {
    let users = readUsers();
    const index = users.findIndex((u) => u.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const deletedUser = users.splice(index, 1);
    writeUsers(users);

    res.status(200).json({
      success: true,
      message: deletedUser[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
