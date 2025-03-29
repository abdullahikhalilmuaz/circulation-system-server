const express = require("express");
const userRequestController = require("../controllers/userRequestController");
const router = express.Router();

router.post("/requests", userRequestController.createRequest);
router.get("/requests", userRequestController.getAllRequests);

module.exports = router;
