const fs = require("fs");
const path = require("path");

const adminSignupController = (req, res) => {
  const filePath = path.join(__dirname, "../admin/adminDB.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error loading admin database" });
    }

    const { firstname, lastname, username, email, password } = req.body;

    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admins = JSON.parse(data || "[]");
    const existingAdmin = admins.find((admin) => admin.email === email);

    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const newAdmin = {
      id: admins.length + 1,
      firstname,
      lastname,
      username,
      email,
      role: "admin", // Force admin role
      password,
      createdAt: new Date().toISOString(),
    };

    admins.push(newAdmin);

    fs.writeFile(filePath, JSON.stringify(admins, null, 2), (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to register admin" });
      }
      res.status(201).json({
        message: "Admin registered successfully",
        admin: {
          id: newAdmin.id,
          firstname: newAdmin.firstname,
          lastname: newAdmin.lastname,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      });
    });
  });
};

module.exports = adminSignupController;
