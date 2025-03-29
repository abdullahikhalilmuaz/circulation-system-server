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
      items: [book],
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
      userCart.items.push({ ...book, quantity: 1 });
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
  const userCart = carts.find((cart) => cart.userId == userId);

  if (!userCart) {
    return res.status(200).json({
      userId: parseInt(userId),
      items: [],
      status: "empty",
    });
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

  // Create checkout request
  const checkoutData = {
    userId: userCart.userId,
    registrationNumber,
    books: [...userCart.items],
    status: "pending", // Will be updated to "confirmed" by admin
    checkoutDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Save to requests
  const requests = readRequests();
  requests.push(checkoutData);
  writeRequests(requests);

  // Update cart status
  carts[userCartIndex] = {
    ...userCart,
    items: [],
    status: "pending",
    registrationNumber,
    updatedAt: new Date().toISOString(),
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

  carts[userCartIndex].items = carts[userCartIndex].items.filter(
    (item) => item.id !== bookId
  );

  // Update cart status if empty
  if (carts[userCartIndex].items.length === 0) {
    carts[userCartIndex].status = "empty";
  }

  carts[userCartIndex].updatedAt = new Date().toISOString();
  writeCarts(carts);
  res.status(200).json(carts[userCartIndex]);
};

module.exports = {
  createOrUpdateCart,
  getUserCart,
  checkoutCart,
  removeFromCart,
};
