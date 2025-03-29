const fs = require('fs');
const path = require('path');

const requestsPath = path.join(__dirname, '../database/requests.json');

// Helper functions
const readRequests = () => {
  try {
    const data = fs.readFileSync(requestsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeRequests = (requests) => {
  fs.writeFileSync(requestsPath, JSON.stringify(requests, null, 2));
};

// Controller methods
exports.getAllRequests = (req, res) => {
  try {
    const requests = readRequests();
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to load requests" });
  }
};

exports.approveRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = readRequests();
    const requestIndex = requests.findIndex(req => req._id === requestId || req.checkoutDate === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    requests[requestIndex].status = "confirmed";
    requests[requestIndex].processedAt = new Date().toISOString();
    
    // Update corresponding cart (if exists)
    const cartsPath = path.join(__dirname, '../carts/carts.json');
    if (fs.existsSync(cartsPath)) {
      const carts = JSON.parse(fs.readFileSync(cartsPath, 'utf8'));
      const userCartIndex = carts.findIndex(cart => cart.userId == requests[requestIndex].userId);
      
      if (userCartIndex !== -1) {
        carts[userCartIndex].status = "confirmed";
        fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));
      }
    }

    writeRequests(requests);
    res.status(200).json({ 
      message: "Request approved successfully",
      request: requests[requestIndex]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve request" });
  }
};

exports.rejectRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const requests = readRequests();
    const requestIndex = requests.findIndex(req => req._id === requestId || req.checkoutDate === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request status
    requests[requestIndex].status = "rejected";
    requests[requestIndex].processedAt = new Date().toISOString();
    
    // Update corresponding cart (if exists)
    const cartsPath = path.join(__dirname, '../carts/carts.json');
    if (fs.existsSync(cartsPath)) {
      const carts = JSON.parse(fs.readFileSync(cartsPath, 'utf8'));
      const userCartIndex = carts.findIndex(cart => cart.userId == requests[requestIndex].userId);
      
      if (userCartIndex !== -1) {
        carts[userCartIndex].status = "rejected";
        fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));
      }
    }

    writeRequests(requests);
    res.status(200).json({ 
      message: "Request rejected successfully",
      request: requests[requestIndex]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request" });
  }
};