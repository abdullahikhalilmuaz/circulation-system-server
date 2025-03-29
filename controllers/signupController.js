const fs = require("fs");
const path = require("path");

const signup = (req, res) => {
  const filePath = path.join(__dirname, "../database/userDB.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error accessing user database" });
    }

    const { firstname, lastname, username, email, password } = req.body;

    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const users = JSON.parse(data || "[]");
    const existingUser = users.find((user) => user.email === email);

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = {
      id: users.length + 1,
      firstname,
      lastname,
      username,
      email,
      role: "user", // Default role for normal users
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to register user" });
      }
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          email: newUser.email,
          role: newUser.role,
        },
      });
    });
  });
};

module.exports = signup;
