const express = require("express");
const adminBookController = require("../controllers/adminBookController");
const adminBookRoute = express.Router();

adminBookRoute.post("/books", adminBookController.addBook);
adminBookRoute.get("/books", adminBookController.getAllBooks);
adminBookRoute.get("/books/:id", adminBookController.getBookById);
adminBookRoute.put("/books/:id", adminBookController.updateBook);
adminBookRoute.delete("/books/:id", adminBookController.deleteBook);

module.exports = adminBookRoute;