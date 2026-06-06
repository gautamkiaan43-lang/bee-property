const express = require('express');
const router = express.Router();
const ghlController = require('../controllers/ghl.controller');

// Public webhook endpoint to receive data from GoHighLevel
router.post('/webhook', ghlController.ghlWebhook);

module.exports = router;
