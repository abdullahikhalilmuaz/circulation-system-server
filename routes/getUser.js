const express = require("express");
const getAllUser = require("../controllers/getUserController");
const getUser = express.Router();

getUser.get("/get/users", getAllUser);

module.exports = getUser;
