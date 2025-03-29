const express = require("express");
const adminLoginController = require("../controllers/adminLoginController");
const adminLoginRoute = express.Router();

adminLoginRoute.post("/auth/login", adminLoginController);

module.exports = adminLoginRoute;
