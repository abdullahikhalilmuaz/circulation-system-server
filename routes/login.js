const express = require("express");
const login = require("../controllers/loginController");
const loginRoute = express.Router();

loginRoute.post("/auth/login", login);

module.exports = loginRoute;
