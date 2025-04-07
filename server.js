require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const fs = require("fs");
const port = process.env.PORT || 3000;
const userRoutes = require("./routes/userRoutes");

// Import routes
const adminBookRoute = require("./routes/adminBookRoute");
const signupRoute = require("./routes/signup");
const loginRoute = require("./routes/login");
const adminLoginRoute = require("./routes/adminLogin");
const adminSignupRoute = require("./routes/adminSignup");
const cartRoute = require("./routes/cartRoute");
const getUser = require("./routes/getUser");
const requestsRoute = require("./routes/requestsRoute");
const notificationRoute = require("./routes/notificationRoute");

// Ensure directories exist
const dataDirs = ["admin", "database", "carts"].map((dir) =>
  path.join(__dirname, dir)
);

dataDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize data files
const initFile = (filePath, initialData = "[]") => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, initialData);
  }
};

initFile(path.join(__dirname, "admin/adminBooks.json"));
initFile(path.join(__dirname, "database/requests.json"));
initFile(path.join(__dirname, "carts/carts.json"));

// MIDDLEWARES
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api/admin", adminBookRoute);
app.use("/api/admin", adminSignupRoute);
app.use("/api/admin", adminLoginRoute);
app.use("/api", signupRoute);
app.use("/api", loginRoute);
app.use("/api/cart", cartRoute);
app.use("/api", getUser);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestsRoute);
app.use("/api/notifications", notificationRoute);

// GET ALL USER FOR DISPLAY ROUTE
app.get("/api/allusers", (req, res) => {
  fs.readFile("./database/userDB.json", "utf8", (err, data) => {
    if (err) {
      res.status(400).json({ message: "Failed to load data files!" });
    } else {
      res.status(200).json({ message: JSON.parse(data) });
    }
  });
});

// GET ALL BOOKS ROUTE
app.get("/api/books/all", (req, res) => {
  fs.readFile("./admin/adminBooks.json", "utf8", (err, data) => {
    if (err) {
      res.status(400).json({ message: "Failed to load book files!" });
    } else {
      res.status(200).json({ message: JSON.parse(data) });
    }
  });
});

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "running",
    message: "Library System API",
    version: "1.0.0",
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Admin books: ${path.join(__dirname, "admin/adminBooks.json")}`);
  console.log(`Carts data: ${path.join(__dirname, "carts/carts.json")}`);
});
