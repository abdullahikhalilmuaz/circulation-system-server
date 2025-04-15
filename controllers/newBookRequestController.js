const fs = require("fs");
const path = require("path");

const requestsPath = path.join(__dirname, "../database/newBookRequests.json");

// Helper functions
const readRequests = () => {
  try {
    const data = fs.readFileSync(requestsPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeRequests = (requests) => {
  fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2));
};

// Controller methods
exports.createRequest = (req, res) => {
  try {
    const requests = readRequests();
    const newRequest = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      status: "pending",
      type: "new-book", // To distinguish from other request types
    };

    requests.push(newRequest);
    writeRequests(requests);

    res.status(201).json({
      success: true,
      message: "New book request submitted successfully",
      request: newRequest,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create new book request",
      error: err.message,
    });
  }
};

exports.getAllRequests = (req, res) => {
  try {
    const requests = readRequests();
    res.status(200).json({
      success: true,
      requests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch new book requests",
      error: err.message,
    });
  }
};

exports.updateRequestStatus = (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const requests = readRequests();
    const requestIndex = requests.findIndex((req) => req._id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    requests[requestIndex].status = status;
    requests[requestIndex].updatedAt = new Date().toISOString();

    writeRequests(requests);

    res.status(200).json({
      success: true,
      message: "Request status updated successfully",
      request: requests[requestIndex],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update request status",
      error: err.message,
    });
  }
};

// Add this new method to your controller
exports.completeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = readRequests();
    const requestIndex = requests.findIndex((req) => req._id === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    requests[requestIndex].status = "completed";
    requests[requestIndex].completedAt = new Date().toISOString();
    requests[requestIndex].completedBy = req.user.id; // Assuming you have admin user info

    writeRequests(requests);

    // Create a notification (you'll need to implement this)
    await createNotification({
      userId: requests[requestIndex].userId,
      type: "request",
      message: `Your book request for "${requests[requestIndex].bookTitle}" has been completed`,
      relatedRequest: requestId,
    });

    res.status(200).json({
      message: "Request marked as completed",
      request: requests[requestIndex],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to complete request" });
  }
};
