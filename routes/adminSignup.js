const express = require("express");
const adminSignupController = require("../controllers/adminSignupController");
const adminSignupRoute = express.Router();

adminSignupRoute.post("/auth/signup", adminSignupController);

module.exports = adminSignupRoute;
