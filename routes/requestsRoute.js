const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requestsController');

// GET all requests
router.get('/', requestsController.getAllRequests);

// PUT approve entire request
router.put('/:requestId/approve', requestsController.approveRequest);

// PUT reject entire request
router.put('/:requestId/reject', requestsController.rejectRequest);

// PUT approve individual book
router.put('/:requestId/books/:bookId/approve', requestsController.approveBook);

// PUT reject individual book
router.put('/:requestId/books/:bookId/reject', requestsController.rejectBook);

module.exports = router;