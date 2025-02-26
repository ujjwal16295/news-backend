// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payementController');

// Regular route for creating checkout session
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Remove the webhook route from here since it's handled in server.js
// We don't want it in the router because of middleware ordering issues

module.exports = router;
