const fs = require("fs");
const path = require("path");

const login = (req, res) => {
  const filePath = path.join(__dirname, "../database/userDB.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error accessing user database" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const users = JSON.parse(data || "[]");
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid user credentials" });
    }

    res.status(200).json({
      message: "User login successful",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  });
};

module.exports = login;
