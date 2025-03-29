const express = require('express');
const router = express.Router();
const requestsController = require('../controllers/requestsController');

// GET all requests
router.get('/', requestsController.getAllRequests);

// PUT approve request
router.put('/:requestId/approve', requestsController.approveRequest);

// PUT reject request
router.put('/:requestId/reject', requestsController.rejectRequest);

module.exports = router;