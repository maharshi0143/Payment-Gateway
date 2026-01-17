const { Payment, Order, Merchant, Refund, IdempotencyKey } = require('../models');
const { paymentQueue, refundQueue } = require('../queues');
const { generateId } = require('../utils/idGenerator');
const { validateVPA, validateCardNumber, getCardNetwork, validateCardExpiry } = require('../utils/validation');
const { Op } = require('sequelize');

// Helper to format payment response
const formatPaymentResponse = (payment) => {
    const response = {
        id: payment.id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        captured: payment.captured,
        created_at: payment.createdAt,
        updated_at: payment.updatedAt
    };

    if (payment.method === 'upi') response.vpa = payment.vpa;
    if (payment.method === 'card') {
        response.card_network = payment.card_network;
        response.card_last4 = payment.card_last4;
    }
    if (payment.status === 'failed') {
        response.error_code = payment.error_code;
        response.error_description = payment.error_description;
    }
    return response;
};

// POST /api/v1/payments (Authenticated)
const createPayment = async (req, res) => {
    await handlePaymentCreation(req, res, req.merchant);
};

// POST /api/v1/payments/public (Unauthenticated)
const createPaymentPublic = async (req, res) => {
    await handlePaymentCreation(req, res, null);
};

const handlePaymentCreation = async (req, res, authenticatedMerchant) => {
    try {
        const idempotencyKey = req.headers['idempotency-key'];

        // 1. Check Idempotency
        if (idempotencyKey && authenticatedMerchant) {
            const cached = await IdempotencyKey.findOne({
                where: {
                    key: idempotencyKey,
                    merchant_id: authenticatedMerchant.id
                }
            });

            if (cached) {
                if (new Date() < cached.expires_at) {
                    return res.status(201).json(cached.response);
                } else {
                    await cached.destroy(); // Expired, treat as new
                }
            }
        }

        const { order_id, method, vpa, card } = req.body;

        // 2. Validate Order
        const order = await Order.findByPk(order_id);
        if (!order) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' }
            });
        }

        if (authenticatedMerchant && order.merchant_id !== authenticatedMerchant.id) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND_ERROR', description: 'Order not found' }
            });
        }

        // 3. Validate Method Specifics
        let paymentData = {
            order_id,
            merchant_id: order.merchant_id,
            amount: order.amount,
            currency: order.currency,
            method,
            status: 'pending', // Async flow
            captured: false
        };

        if (method === 'upi') {
            if (!vpa || !validateVPA(vpa)) {
                return res.status(400).json({
                    error: { code: 'INVALID_VPA', description: 'VPA format invalid' }
                });
            }
            paymentData.vpa = vpa;
        } else if (method === 'card') {
            if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
                return res.status(400).json({
                    error: { code: 'BAD_REQUEST_ERROR', description: 'Incomplete card details' }
                });
            }
            if (!validateCardNumber(card.number)) {
                return res.status(400).json({
                    error: { code: 'INVALID_CARD', description: 'Card validation failed' }
                });
            }
            if (!validateCardExpiry(card.expiry_month, card.expiry_year)) {
                return res.status(400).json({
                    error: { code: 'EXPIRED_CARD', description: 'Card expiry date invalid' }
                });
            }
            paymentData.card_network = getCardNetwork(card.number);
            paymentData.card_last4 = card.number.slice(-4);
        } else {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid payment method' }
            });
        }

        // 4. Create Payment
        let paymentId;
        let isUnique = false;
        while (!isUnique) {
            paymentId = generateId('pay_');
            const existing = await Payment.findByPk(paymentId);
            if (!existing) isUnique = true;
        }
        paymentData.id = paymentId;

        const payment = await Payment.create(paymentData);

        // 5. Enqueue Job
        await paymentQueue.add({ paymentId: payment.id });

        // 6. Response
        const responseData = formatPaymentResponse(payment);

        // Store Idempotency
        if (idempotencyKey && authenticatedMerchant) {
            await IdempotencyKey.create({
                key: idempotencyKey,
                merchant_id: authenticatedMerchant.id,
                response: responseData,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });
        }

        res.status(201).json(responseData);

    } catch (error) {
        console.error('Create Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST /api/v1/payments/:payment_id/capture
const capturePayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { amount } = req.body;

        const payment = await Payment.findByPk(payment_id);
        if (!payment) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }

        // Verify Merchant
        if (payment.merchant_id !== req.merchant.id) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }

        if (payment.status !== 'success' || payment.captured) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in capturable state' }
            });
        }

        // Capture logic (simplified: just update flag)
        payment.captured = true;
        await payment.save();

        res.json(formatPaymentResponse(payment));

    } catch (error) {
        console.error('Capture Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST /api/v1/payments/:payment_id/refunds
const createRefund = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const { amount, reason } = req.body;

        if (!amount) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Amount is required' } });
        }

        const payment = await Payment.findByPk(payment_id);
        if (!payment || payment.merchant_id !== req.merchant.id) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }

        if (payment.status !== 'success') {
            return res.status(400).json({ error: { code: 'BAD_REQUEST_ERROR', description: 'Payment not in refundable state' } });
        }

        // Calculate processed/pending refunds
        const refunds = await Refund.findAll({
            where: {
                payment_id,
                status: { [Op.in]: ['pending', 'processed'] }
            }
        });

        const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

        if (amount + totalRefunded > payment.amount) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST_ERROR', description: 'Refund amount exceeds available amount' }
            });
        }

        // Create Refund
        let refundId;
        let isUnique = false;
        while (!isUnique) {
            refundId = generateId('rfnd_');
            const existing = await Refund.findByPk(refundId);
            if (!existing) isUnique = true;
        }

        const refund = await Refund.create({
            id: refundId,
            payment_id,
            merchant_id: req.merchant.id,
            amount,
            reason: reason || null, // Optional reason
            status: 'pending'
        });

        // Enqueue Job
        await refundQueue.add({ refundId: refund.id });

        res.status(201).json({
            id: refund.id,
            payment_id: refund.payment_id,
            amount: refund.amount,
            reason: refund.reason,
            status: refund.status,
            created_at: refund.createdAt
        });

    } catch (error) {
        console.error('Create Refund Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/refunds/:refund_id
const getRefund = async (req, res) => {
    try {
        const { refund_id } = req.params;
        const refund = await Refund.findByPk(refund_id);

        if (!refund || refund.merchant_id !== req.merchant.id) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Refund not found' } });
        }

        res.json({
            id: refund.id,
            payment_id: refund.payment_id,
            amount: refund.amount,
            reason: refund.reason,
            status: refund.status,
            created_at: refund.createdAt,
            processed_at: refund.processed_at
        });
    } catch (error) {
        console.error('Get Refund Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Previous GET methods (Updated to use formatPaymentResponse)
const getPayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const payment = await Payment.findByPk(payment_id);
        if (!payment || payment.merchant_id !== req.merchant.id) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }
        res.json(formatPaymentResponse(payment));
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
};

const getPaymentPublic = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const payment = await Payment.findByPk(payment_id);
        if (!payment) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Payment not found' } });
        }
        res.json(formatPaymentResponse(payment));
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
};

const getTransactions = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { merchant_id: req.merchant.id },
            order: [['createdAt', 'DESC']],
            include: [{ model: Order }]
        });
        const formatted = payments.map(p => ({
            id: p.id,
            order_id: p.order_id,
            amount: p.amount,
            currency: p.currency,
            method: p.method,
            status: p.status,
            created_at: p.createdAt
        }));
        res.json(formatted);
    } catch (error) { res.status(500).json({ error: 'Internal Server Error' }); }
};

module.exports = {
    createPayment,
    createPaymentPublic,
    capturePayment,
    createRefund,
    getRefund,
    getPayment,
    getPaymentPublic,
    getTransactions
};
