const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// Get all notifications (for admin view)
router.get("/", notificationController.getAllNotifications);

// Create new notification
router.post("/", notificationController.createNotification);

// Mark notification as read
router.put("/:notificationId/read", notificationController.markAsRead);

module.exports = router;
