const fs = require("fs");
const path = require("path");

const adminLoginController = (req, res) => {
  const filePath = path.join(__dirname, "../admin/adminDB.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error accessing admin database" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admins = JSON.parse(data || "[]");
    const admin = admins.find(
      (a) => a.email === email && a.password === password
    );

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    res.status(200).json({
      message: "Admin login successful",
      admin: {
        id: admin.id,
        firstname: admin.firstname,
        lastname: admin.lastname,
        email: admin.email,
        role: admin.role,
      },
    });
  });
};

module.exports = adminLoginController;
