const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../admin/adminBooks.json");

// Helper function to read books file
const readBooksFile = () => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    return [];
  }
};

// Helper function to write to books file
const writeBooksFile = (books) => {
  fs.writeFileSync(filePath, JSON.stringify(books, null, 2));
};

// Add a new book
const addBook = (req, res) => {
  const {
    title,
    author,
    isbn,
    issn,
    dateAdded,
    quantity,
    section,
    description
  } = req.body;

  if (!title || !author || !isbn || !dateAdded || !quantity || !section) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const books = readBooksFile();
  
  // Check if book with same ISBN already exists
  const existingBook = books.find(book => book.isbn === isbn);
  if (existingBook) {
    return res.status(409).json({ message: "Book with this ISBN already exists" });
  }

  const newBook = {
    id: books.length + 1,
    title,
    author,
    isbn,
    issn: issn || null,
    dateAdded,
    quantity: parseInt(quantity),
    section,
    description: description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  books.push(newBook);
  writeBooksFile(books);

  res.status(201).json({
    message: "Book added successfully",
    book: newBook
  });
};

// Get all books
const getAllBooks = (req, res) => {
  const books = readBooksFile();
  res.status(200).json(books);
};

// Get single book by ID
const getBookById = (req, res) => {
  const books = readBooksFile();
  const book = books.find(b => b.id === parseInt(req.params.id));

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.status(200).json(book);
};

// Update a book
const updateBook = (req, res) => {
  const books = readBooksFile();
  const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));

  if (bookIndex === -1) {
    return res.status(404).json({ message: "Book not found" });
  }

  const updatedBook = {
    ...books[bookIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  books[bookIndex] = updatedBook;
  writeBooksFile(books);

  res.status(200).json({
    message: "Book updated successfully",
    book: updatedBook
  });
};

// Delete a book
const deleteBook = (req, res) => {
  const books = readBooksFile();
  const filteredBooks = books.filter(b => b.id !== parseInt(req.params.id));

  if (filteredBooks.length === books.length) {
    return res.status(404).json({ message: "Book not found" });
  }

  writeBooksFile(filteredBooks);
  res.status(200).json({ message: "Book deleted successfully" });
};

module.exports = {
  addBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook
};