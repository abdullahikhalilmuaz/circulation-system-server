const express = require("express");
const newBookRequest = express.Router();
const newBookRequestController = require("../controllers/newBookRequestController");

// POST create new book request
newBookRequest.post("/", newBookRequestController.createRequest);

// GET all book requests (optional)
newBookRequest.get("/", newBookRequestController.getAllRequests);

// PUT update request status
newBookRequest.put(
  "/:requestId/status",
  newBookRequestController.updateRequestStatus
);

// Add this new route
newBookRequest.put(
  "/:requestId/complete",
  newBookRequestController.completeRequest
);

module.exports = newBookRequest;
