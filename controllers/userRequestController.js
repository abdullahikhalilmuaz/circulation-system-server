const fs = require("fs");
const path = require("path");

const requestsPath = path.join(__dirname, "../database/requests.json");

// Helper functions
const readRequests = () => {
  try {
    return JSON.parse(fs.readFileSync(requestsPath, "utf8"));
  } catch (err) {
    return [];
  }
};

const writeRequests = (requests) => {
  fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2));
};

// Create request
const createRequest = (req, res) => {
  const { userId, username, userRole, bookId, bookTitle, status } = req.body;

  if (!userId || !bookId || !bookTitle) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const requests = readRequests();
  const newRequest = {
    id: requests.length + 1,
    userId,
    username,
    userRole,
    bookId,
    bookTitle,
    status: status || "pending",
    requestDate: new Date().toISOString(),
    processed: false,
  };

  requests.push(newRequest);
  writeRequests(requests);

  res.status(201).json({
    message: "Request created successfully",
    request: newRequest,
  });
};

// Get all requests (for admin)
const getAllRequests = (req, res) => {
  const requests = readRequests();
  res.status(200).json(requests);
};

module.exports = {
  createRequest,
  getAllRequests,
};
