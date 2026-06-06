const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

// Note: The Webhook endpoint is defined directly in app.js before express.json()
// so we don't define it here to avoid body-parser issues.

// Protected routes for generating Stripe sessions
router.post('/create-checkout-session', protect, paymentController.createCheckoutSession);

module.exports = router;
