const express = require("express");
const cartController = require("../controllers/cartController");
const router = express.Router();

router.post("/", cartController.createOrUpdateCart);
router.get("/:userId", cartController.getUserCart);
router.post("/:userId/checkout", cartController.checkoutCart);
router.delete("/:userId/items/:bookId", cartController.removeFromCart);

module.exports = router;