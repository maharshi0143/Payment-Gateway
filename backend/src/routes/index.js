const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const healthController = require('../controllers/healthController');
const testController = require('../controllers/testController');
const webhookController = require('../controllers/webhookController');
const { authenticateMerchant } = require('../middlewares/auth');

// Health Check (Public)
router.get('/health', healthController.getHealth);

// Authenticated Routes
router.post('/api/v1/orders', authenticateMerchant, orderController.createOrder);
router.get('/api/v1/orders/:order_id', authenticateMerchant, orderController.getOrder);

router.post('/api/v1/payments', authenticateMerchant, paymentController.createPayment);
router.get('/api/v1/payments/:payment_id', authenticateMerchant, paymentController.getPayment);
router.post('/api/v1/payments/:payment_id/capture', authenticateMerchant, paymentController.capturePayment);
router.post('/api/v1/payments/:payment_id/refunds', authenticateMerchant, paymentController.createRefund);

router.get('/api/v1/refunds/:refund_id', authenticateMerchant, paymentController.getRefund);

// Webhooks
router.get('/api/v1/webhooks', authenticateMerchant, webhookController.getWebhookLogs);
router.post('/api/v1/webhooks/:webhook_id/retry', authenticateMerchant, webhookController.retryWebhook);

// Public/Checkout Routes
router.get('/api/v1/orders/:order_id/public', orderController.getOrderPublic);
router.post('/api/v1/payments/public', paymentController.createPaymentPublic);
router.get('/api/v1/payments/:payment_id/public', paymentController.getPaymentPublic);

// Test Endpoints
router.get('/api/v1/test/merchant', testController.getTestMerchant);
router.get('/api/v1/test/jobs/status', testController.getJobStatus);

// Dashboard Routes
router.get('/api/v1/me', authenticateMerchant, (req, res) => {
    res.json(req.merchant);
});
router.get('/api/v1/transactions', authenticateMerchant, paymentController.getTransactions);

// Regenerate Webhook Secret
const { Merchant } = require('../models');
const crypto = require('crypto');
router.post('/api/v1/merchants/webhook-secret', authenticateMerchant, async (req, res) => {
    try {
        const secret = 'whsec_' + crypto.randomBytes(12).toString('hex');
        const merchant = await Merchant.findByPk(req.merchant.id);
        merchant.webhook_secret = secret;
        await merchant.save();
        res.json({ webhook_secret: secret });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Webhook URL
router.put('/api/v1/merchants/webhook-url', authenticateMerchant, async (req, res) => {
    try {
        const { webhook_url } = req.body;
        const merchant = await Merchant.findByPk(req.merchant.id);
        merchant.webhook_url = webhook_url;
        await merchant.save();
        res.json({ webhook_url });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
