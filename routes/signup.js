const express = require("express");
const signupController = require("../controllers/signupController");
const signupRoute = express.Router();

signupRoute.post("/auth/signup", signupController);

module.exports = signupRoute;
