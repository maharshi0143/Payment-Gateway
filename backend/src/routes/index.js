const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const healthController = require('../controllers/healthController');
const testController = require('../controllers/testController');
const { authenticateMerchant } = require('../middlewares/auth');

// Health Check (Public)
router.get('/health', healthController.getHealth);

// Authenticated Routes
router.post('/api/v1/orders', authenticateMerchant, orderController.createOrder);
router.get('/api/v1/orders/:order_id', authenticateMerchant, orderController.getOrder);

router.post('/api/v1/payments', authenticateMerchant, paymentController.createPayment);
router.get('/api/v1/payments/:payment_id', authenticateMerchant, paymentController.getPayment);

// Public/Checkout Routes (If we want to implement them as public variant)
// The spec says: Checkout Page needs to make unauthenticated calls.
// "Public Endpoints (Recommended): GET /api/v1/orders/{order_id}/public"
router.get('/api/v1/orders/:order_id/public', orderController.getOrderPublic);
// "POST /api/v1/payments/public"
router.post('/api/v1/payments/public', paymentController.createPaymentPublic);
router.get('/api/v1/payments/:payment_id/public', paymentController.getPaymentPublic);

// Test Endpoints
router.get('/api/v1/test/merchant', testController.getTestMerchant);

// Additional endpoints for dashboard (not strictly in spec but needed for UI)
// Assuming we need a login endpoint for dashboard
// We will just expose the merchant details for the logged-in user via a check
router.get('/api/v1/me', authenticateMerchant, (req, res) => {
    res.json(req.merchant);
});

// Dashboard Transactions
router.get('/api/v1/transactions', authenticateMerchant, paymentController.getTransactions);

module.exports = router;
