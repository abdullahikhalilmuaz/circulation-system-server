const fs = require("fs");
const path = require("path");

const cartsPath = path.join(__dirname, "../carts/carts.json");
const requestsPath = path.join(__dirname, "../database/requests.json");

const readCarts = () => {
  try {
    return JSON.parse(fs.readFileSync(cartsPath, "utf8"));
  } catch (err) {
    return [];
  }
};

const writeCarts = (carts) => {
  fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));
};

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

const createOrUpdateCart = (req, res) => {
  const { userId, book } = req.body;

  if (!userId || !book || !book.id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const carts = readCarts();
  let userCart = carts.find((cart) => cart.userId === userId);

  if (!userCart) {
    userCart = {
      userId,
      items: [{
        ...book,
        quantity: 1,
        status: "pending", // Default status for new items
        adminNotes: "" // Initialize admin notes
      }],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    carts.push(userCart);
  } else {
    const existingItem = userCart.items.find((item) => item.id === book.id);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      userCart.items.push({
        ...book,
        quantity: 1,
        status: "pending", // Default status for new items
        adminNotes: "" // Initialize admin notes
      });
    }
    userCart.updatedAt = new Date().toISOString();
    userCart.status = "active"; // Reset status if cart is modified
  }

  writeCarts(carts);
  res.status(200).json(userCart);
};

const getUserCart = (req, res) => {
  const { userId } = req.params;
  const carts = readCarts();
  const requests = readRequests();
  
  let userCart = carts.find((cart) => cart.userId == userId);

  // If no cart exists, return empty cart
  if (!userCart) {
    return res.status(200).json({
      userId: parseInt(userId),
      items: [],
      status: "empty",
      registrationNumber: ""
    });
  }

  // If cart has pending status, check if there's a corresponding request
  // and sync the book statuses from the request
  if (userCart.status === "pending" || userCart.status === "confirmed") {
    const userRequest = requests.find(request => 
      request.userId == userId && 
      request.status && 
      (request.status === "pending" || request.status === "approved" || request.status === "rejected")
    );

    if (userRequest && userRequest.books) {
      // Update cart items with status from request
      userCart.items = userCart.items.map(cartItem => {
        const requestBook = userRequest.books.find(reqBook => reqBook.id === cartItem.id);
        if (requestBook) {
          return {
            ...cartItem,
            status: requestBook.status || "pending",
            adminNotes: requestBook.adminNotes || ""
          };
        }
        return cartItem;
      });

      // Also update registration number from request if available
      if (userRequest.registrationNumber) {
        userCart.registrationNumber = userRequest.registrationNumber;
      }
    }
  }

  res.status(200).json(userCart);
};

const checkoutCart = (req, res) => {
  const { userId } = req.params;
  const { registrationNumber } = req.body;

  const carts = readCarts();
  const userCartIndex = carts.findIndex((cart) => cart.userId == userId);

  if (userCartIndex === -1) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const userCart = carts[userCartIndex];

  if (!userCart.items || userCart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  if (!registrationNumber) {
    return res.status(400).json({ message: "Registration number is required" });
  }

  // Prepare books with initial pending status
  const booksWithStatus = userCart.items.map(book => ({
    ...book,
    status: "pending", // Initial status
    adminNotes: "" // Initialize admin notes
  }));

  // Create checkout request
  const checkoutData = {
    id: Date.now().toString(), // Generate unique ID
    userId: userCart.userId,
    registrationNumber,
    books: booksWithStatus,
    status: "pending", // Will be updated to "approved"/"rejected" by admin
    checkoutDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to requests
  const requests = readRequests();
  requests.push(checkoutData);
  writeRequests(requests);

  // Update cart status but keep items for status tracking
  carts[userCartIndex] = {
    ...userCart,
    status: "pending",
    registrationNumber,
    updatedAt: new Date().toISOString(),
    // Don't clear items - we need them to show status to user
    // But mark them as pending in checkout
    items: booksWithStatus
  };
  writeCarts(carts);

  res.status(200).json({
    message: "Checkout successful. Waiting for admin approval.",
    cart: carts[userCartIndex],
    request: checkoutData,
  });
};

const removeFromCart = (req, res) => {
  const { userId, bookId } = req.params;
  const carts = readCarts();
  const userCartIndex = carts.findIndex((cart) => cart.userId == userId);

  if (userCartIndex === -1) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const userCart = carts[userCartIndex];

  // Only allow removal if cart is active (not pending/confirmed)
  if (userCart.status !== "active") {
    return res.status(400).json({ 
      message: "Cannot remove items from a pending or confirmed cart" 
    });
  }

  userCart.items = userCart.items.filter((item) => item.id !== bookId);

  // Update cart status if empty
  if (userCart.items.length === 0) {
    userCart.status = "empty";
  }

  userCart.updatedAt = new Date().toISOString();
  writeCarts(carts);
  res.status(200).json(userCart);
};

module.exports = {
  createOrUpdateCart,
  getUserCart,
  checkoutCart,
  removeFromCart,
};