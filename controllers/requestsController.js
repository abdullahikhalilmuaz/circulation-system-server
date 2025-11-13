const fs = require('fs');
const path = require('path');

const requestsPath = path.join(__dirname, '../database/requests.json');
const cartsPath = path.join(__dirname, '../carts/carts.json');

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

const readCarts = () => {
  try {
    const data = fs.readFileSync(cartsPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeCarts = (carts) => {
  fs.writeFileSync(cartsPath, JSON.stringify(carts, null, 2));
};

// Update overall request status based on individual book statuses
const updateOverallRequestStatus = (request) => {
  const books = request.books || [];
  const totalBooks = books.length;
  const approvedBooks = books.filter(book => book.status === 'approved').length;
  const rejectedBooks = books.filter(book => book.status === 'rejected').length;
  const pendingBooks = books.filter(book => book.status === 'pending').length;
  
  if (approvedBooks === totalBooks) {
    request.status = 'approved';
  } else if (rejectedBooks === totalBooks) {
    request.status = 'rejected';
  } else if (approvedBooks > 0 || rejectedBooks > 0) {
    request.status = 'partially_approved';
  } else {
    request.status = 'pending';
  }
};

// Update cart items status to match request
const updateCartFromRequest = (request) => {
  try {
    const carts = readCarts();
    const userCartIndex = carts.findIndex(cart => cart.userId == request.userId);
    
    if (userCartIndex !== -1) {
      const userCart = carts[userCartIndex];
      
      // Update each book status in cart to match request
      if (userCart.items && request.books) {
        userCart.items = userCart.items.map(cartItem => {
          const requestBook = request.books.find(reqBook => reqBook.id == cartItem.id);
          if (requestBook) {
            return {
              ...cartItem,
              status: requestBook.status,
              adminNotes: requestBook.adminNotes || ""
            };
          }
          return cartItem;
        });
        
        // Update cart overall status
        userCart.status = request.status;
        userCart.updatedAt = new Date().toISOString();
        
        writeCarts(carts);
      }
    }
  } catch (err) {
    console.error('Error updating cart from request:', err);
  }
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

// Approve individual book
exports.approveBook = (req, res) => {
  try {
    const { requestId, bookId } = req.params;
    const { adminNotes } = req.body;
    
    console.log('=== APPROVE BOOK REQUEST ===');
    console.log('Request ID:', requestId);
    console.log('Book ID:', bookId);
    console.log('Admin Notes:', adminNotes);
    
    const requests = readRequests();
    
    // Log all available requests for debugging
    console.log('Available requests:', requests.map(r => ({
      id: r.id,
      _id: r._id,
      checkoutDate: r.checkoutDate,
      userId: r.userId,
      status: r.status
    })));

    // Find the request - try different ID fields
    const requestIndex = requests.findIndex(req => {
      const match = 
        req.id == requestId || 
        req._id == requestId || 
        req.checkoutDate == requestId;
      
      if (match) {
        console.log('Found request:', {
          requestId: requestId,
          matchedRequest: {
            id: req.id,
            _id: req._id,
            checkoutDate: req.checkoutDate
          }
        });
      }
      return match;
    });

    if (requestIndex === -1) {
      console.log('❌ Request not found. Looking for:', requestId);
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requests[requestIndex];
    console.log('✅ Found request:', {
      id: request.id,
      userId: request.userId,
      bookCount: request.books?.length
    });

    if (!request.books || !Array.isArray(request.books)) {
      console.log('❌ No books array in request');
      return res.status(404).json({ message: "No books found in request" });
    }

    // Log all books in this request for debugging
    console.log('📚 Books in request:', request.books.map(book => ({
      id: book.id,
      title: book.title,
      status: book.status
    })));

    // Find the book - convert both IDs to strings for comparison
    const bookIndex = request.books.findIndex(book => {
      const bookIdStr = String(book.id);
      const searchIdStr = String(bookId);
      const match = bookIdStr === searchIdStr;
      
      if (match) {
        console.log('✅ Found matching book:', {
          searchId: searchIdStr,
          bookId: bookIdStr,
          title: book.title
        });
      }
      return match;
    });

    if (bookIndex === -1) {
      console.log('❌ Book not found in request. Looking for book ID:', bookId);
      console.log('Available book IDs:', request.books.map(b => b.id));
      return res.status(404).json({ message: "Book not found in request" });
    }

    console.log('✅ Updating book:', {
      title: request.books[bookIndex].title,
      oldStatus: request.books[bookIndex].status,
      newStatus: 'approved'
    });

    // Update book status
    request.books[bookIndex].status = "approved";
    request.books[bookIndex].adminNotes = adminNotes || "";
    request.books[bookIndex].processedAt = new Date().toISOString();
    
    // Update overall request status
    updateOverallRequestStatus(request);
    request.updatedAt = new Date().toISOString();
    
    writeRequests(requests);
    
    // Update corresponding cart
    updateCartFromRequest(request);

    console.log('✅ Book approved successfully');
    res.status(200).json({ 
      message: "Book approved successfully",
      request: request
    });
  } catch (err) {
    console.error("❌ Failed to approve book:", err);
    res.status(500).json({ message: "Failed to approve book" });
  }
};

// Reject individual book
exports.rejectBook = (req, res) => {
  try {
    const { requestId, bookId } = req.params;
    const { adminNotes } = req.body;
    
    console.log('=== REJECT BOOK REQUEST ===');
    console.log('Request ID:', requestId);
    console.log('Book ID:', bookId);
    console.log('Admin Notes:', adminNotes);
    
    const requests = readRequests();

    // Find the request - try different ID fields
    const requestIndex = requests.findIndex(req => 
      req.id == requestId || 
      req._id == requestId || 
      req.checkoutDate == requestId
    );

    if (requestIndex === -1) {
      console.log('❌ Request not found. Looking for:', requestId);
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requests[requestIndex];
    console.log('✅ Found request:', {
      id: request.id,
      userId: request.userId,
      bookCount: request.books?.length
    });

    if (!request.books || !Array.isArray(request.books)) {
      console.log('❌ No books array in request');
      return res.status(404).json({ message: "No books found in request" });
    }

    // Log all books in this request for debugging
    console.log('📚 Books in request:', request.books.map(book => ({
      id: book.id,
      title: book.title,
      status: book.status
    })));

    // Find the book - convert both IDs to strings for comparison
    const bookIndex = request.books.findIndex(book => {
      const bookIdStr = String(book.id);
      const searchIdStr = String(bookId);
      return bookIdStr === searchIdStr;
    });

    if (bookIndex === -1) {
      console.log('❌ Book not found in request. Looking for book ID:', bookId);
      console.log('Available book IDs:', request.books.map(b => b.id));
      return res.status(404).json({ message: "Book not found in request" });
    }

    console.log('✅ Updating book:', {
      title: request.books[bookIndex].title,
      oldStatus: request.books[bookIndex].status,
      newStatus: 'rejected'
    });

    // Update book status
    request.books[bookIndex].status = "rejected";
    request.books[bookIndex].adminNotes = adminNotes || "";
    request.books[bookIndex].processedAt = new Date().toISOString();
    
    // Update overall request status
    updateOverallRequestStatus(request);
    request.updatedAt = new Date().toISOString();
    
    writeRequests(requests);
    
    // Update corresponding cart
    updateCartFromRequest(request);

    console.log('✅ Book rejected successfully');
    res.status(200).json({ 
      message: "Book rejected successfully",
      request: request
    });
  } catch (err) {
    console.error("❌ Failed to reject book:", err);
    res.status(500).json({ message: "Failed to reject book" });
  }
};

exports.approveRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    
    const requests = readRequests();
    const requestIndex = requests.findIndex(req => req._id === requestId || req.id === requestId || req.checkoutDate === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requests[requestIndex];

    // Approve all pending books in the request
    request.books.forEach(book => {
      if (book.status === 'pending') {
        book.status = "approved";
        book.adminNotes = adminNotes || "";
        book.processedAt = new Date().toISOString();
      }
    });

    // Update request status
    request.status = "approved";
    request.updatedAt = new Date().toISOString();
    
    writeRequests(requests);
    
    // Update corresponding cart
    updateCartFromRequest(request);

    res.status(200).json({ 
      message: "Request approved successfully",
      request: request
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve request" });
  }
};

exports.rejectRequest = (req, res) => {
  try {
    const { requestId } = req.params;
    const { adminNotes } = req.body;
    
    const requests = readRequests();
    const requestIndex = requests.findIndex(req => req._id === requestId || req.id === requestId || req.checkoutDate === requestId);

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requests[requestIndex];

    // Reject all pending books in the request
    request.books.forEach(book => {
      if (book.status === 'pending') {
        book.status = "rejected";
        book.adminNotes = adminNotes || "";
        book.processedAt = new Date().toISOString();
      }
    });

    // Update request status
    request.status = "rejected";
    request.updatedAt = new Date().toISOString();
    
    writeRequests(requests);
    
    // Update corresponding cart
    updateCartFromRequest(request);

    res.status(200).json({ 
      message: "Request rejected successfully",
      request: request
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request" });
  }
};