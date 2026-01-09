const { Payment, Order, Merchant } = require('../models');
const { generateId } = require('../utils/idGenerator');
const { validateVPA, validateCardNumber, getCardNetwork, validateCardExpiry } = require('../utils/validation');

const processPaymentInternal = async (paymentId) => {
    // This function simulates the bank processing delay and random success/failure
    // It runs asynchronously in a real scenario, but spec says synchronous for Deliverable 1.
    // However, Node.js is single threaded. Sleeping blocks the event loop!
    // BUT "Process payment synchronously: Add a delay of 5-10 seconds"
    // Valid implementation: await a promise that resolves after N seconds.

    // Check Config
    const isTestMode = process.env.TEST_MODE === 'true';
    const forceSuccess = process.env.TEST_PAYMENT_SUCCESS !== 'false'; // Default to true if not 'false'
    const testDelay = parseInt(process.env.TEST_PAYMENT_SUCCESS_DELAY || process.env.TEST_PROCESSING_DELAY || '1000', 10);

    // Random delay between 5000 and 10000 ms if not test mode
    const delay = isTestMode ? testDelay : Math.floor(Math.random() * (10000 - 5000 + 1) + 5000);

    await new Promise(resolve => setTimeout(resolve, delay));

    // Determine Status
    let success = false;

    // Retch payment to get method and latest status
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return; // Should not happen

    if (isTestMode) {
        success = forceSuccess;
    } else {
        const rand = Math.random();
        if (payment.method === 'upi') {
            success = rand < 0.90; // 90% success
        } else {
            success = rand < 0.95; // 95% success
        }
    }

    if (success) {
        payment.status = 'success';
    } else {
        payment.status = 'failed';
        payment.error_code = 'PAYMENT_FAILED';
        payment.error_description = 'Bank rejected the transaction';
    }

    await payment.save();
    return payment;
};

// POST /api/v1/payments
const createPayment = async (req, res) => {
    await handlePaymentCreation(req, res, req.merchant);
};

// POST /api/v1/payments/public
const createPaymentPublic = async (req, res) => {
    // For public payment, we don't have req.merchant from auth middleware
    // We must validate order exists and use its merchant
    await handlePaymentCreation(req, res, null);
};

const handlePaymentCreation = async (req, res, authenticatedMerchant) => {
    try {
        const { order_id, method, vpa, card } = req.body;

        // 1. Validate Order
        const order = await Order.findByPk(order_id);
        if (!order) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        // If authenticated, check ownership
        if (authenticatedMerchant && order.merchant_id !== authenticatedMerchant.id) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        // 2. Validate Method Specifics
        let paymentData = {
            order_id,
            merchant_id: order.merchant_id,
            amount: order.amount,
            currency: order.currency,
            method,
            status: 'processing'
        };

        if (method === 'upi') {
            if (!vpa || !validateVPA(vpa)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_VPA',
                        description: 'VPA format invalid'
                    }
                });
            }
            paymentData.vpa = vpa;
        } else if (method === 'card') {
            if (!card || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv || !card.holder_name) {
                return res.status(400).json({
                    error: {
                        code: 'BAD_REQUEST_ERROR',
                        description: 'Incomplete card details'
                    }
                });
            }

            if (!validateCardNumber(card.number)) {
                return res.status(400).json({
                    error: {
                        code: 'INVALID_CARD',
                        description: 'Card validation failed'
                    }
                });
            }

            if (!validateCardExpiry(card.expiry_month, card.expiry_year)) {
                return res.status(400).json({
                    error: {
                        code: 'EXPIRED_CARD',
                        description: 'Card expiry date invalid'
                    }
                });
            }

            paymentData.card_network = getCardNetwork(card.number);
            paymentData.card_last4 = card.number.slice(-4);
        } else {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'Invalid payment method'
                }
            });
        }

        // 3. Generate ID & Create Payment
        let paymentId;
        let isUnique = false;
        while (!isUnique) {
            paymentId = generateId('pay_');
            const existing = await Payment.findByPk(paymentId);
            if (!existing) isUnique = true;
        }
        paymentData.id = paymentId;

        const payment = await Payment.create(paymentData);

        // 4. Process Payment (Synchronous Delay as requested)
        // Spec: "Process payment synchronously... Return response... JSON body containing payment details including id... status..."
        // WAIT. If we process synchronously (sleep 5-10s) and THEN return, the status returned will be success/failed.
        // BUT the spec says: "Create payment record... Set status to processing immediately... Process payment synchronously... Update payment status... Return response"
        // This implies the response should contain the FINAL status?
        // Let's re-read: "Process payment synchronously... Update payment status... Return response"
        // YES, it implies we wait for the result.

        await processPaymentInternal(payment.id);

        // Reload to get updated status
        await payment.reload();

        // 5. Response
        const response = {
            id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            created_at: payment.createdAt
        };

        if (method === 'upi') response.vpa = payment.vpa;
        if (method === 'card') {
            response.card_network = payment.card_network;
            response.card_last4 = payment.card_last4;
        }

        res.status(201).json(response);

    } catch (error) {
        console.error('Create Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/payments/:payment_id
const getPayment = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const payment = await Payment.findByPk(payment_id);

        if (!payment) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Payment not found'
                }
            });
        }

        // Ensure belongs to merchant
        if (payment.merchant_id !== req.merchant.id) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Payment not found'
                }
            });
        }

        const response = {
            id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
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

        res.json(response);

    } catch (error) {
        console.error('Get Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/transactions (For Dashboard)
const getTransactions = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { merchant_id: req.merchant.id },
            order: [['createdAt', 'DESC']],
            include: [{ model: Order }] // Optional: Include order details if needed
        });

        // Format for dashboard (keeping it simple or matching UI needs)
        // Dashboard spec transaction row: id, order_id, amount, method, status, created_at
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
    } catch (error) {
        console.error('Get Transactions Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/payments/:payment_id/public
const getPaymentPublic = async (req, res) => {
    try {
        const { payment_id } = req.params;
        const payment = await Payment.findByPk(payment_id);

        if (!payment) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Payment not found'
                }
            });
        }

        const response = {
            id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
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

        res.json(response);

    } catch (error) {
        console.error('Get Public Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { createPayment, getPayment, createPaymentPublic, getTransactions, getPaymentPublic };

