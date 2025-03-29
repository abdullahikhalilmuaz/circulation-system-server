const fs = require("fs");
const path = require("path");

const notificationsPath = path.join(
  __dirname,
  "../database/notifications.json"
);

// Initialize notifications file if it doesn't exist
if (!fs.existsSync(notificationsPath)) {
  fs.writeFileSync(notificationsPath, "[]");
}

const readNotifications = () => {
  try {
    const data = fs.readFileSync(notificationsPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading notifications:", err);
    return [];
  }
};

const writeNotifications = (notifications) => {
  try {
    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2));
  } catch (err) {
    console.error("Error writing notifications:", err);
  }
};

// Get all notifications (for admin view)
exports.getAllNotifications = (req, res) => {
  try {
    const notifications = readNotifications().sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error("Error getting notifications:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

// Create notification (include registration number)
exports.createNotification = (req, res) => {
  try {
    const { userId, message, type, registrationNumber } = req.body;

    const notifications = readNotifications();
    const newNotification = {
      _id: Date.now().toString(),
      userId,
      registrationNumber,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotification);
    writeNotifications(notifications);

    res.status(201).json({
      success: true,
      notification: newNotification,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
    });
  }
};

// Mark notification as read
exports.markAsRead = (req, res) => {
  try {
    const { notificationId } = req.params;
    const notifications = readNotifications();
    const notification = notifications.find((n) => n._id === notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.read = true;
    writeNotifications(notifications);

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};
