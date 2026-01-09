const { Order } = require('../models');
const { generateId } = require('../utils/idGenerator');

// POST /api/v1/orders
const createOrder = async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;

        // Validation: amount >= 100
        if (!Number.isInteger(amount) || amount < 100) {
            return res.status(400).json({
                error: {
                    code: 'BAD_REQUEST_ERROR',
                    description: 'amount must be at least 100'
                }
            });
        }

        // Generate ID
        let orderId;
        let isUnique = false;
        while (!isUnique) {
            orderId = generateId('order_');
            const existing = await Order.findByPk(orderId);
            if (!existing) isUnique = true;
        }

        const newOrder = await Order.create({
            id: orderId,
            merchant_id: req.merchant.id,
            amount,
            currency: currency || 'INR',
            receipt,
            notes,
            status: 'created'
        });

        res.status(201).json({
            id: newOrder.id,
            merchant_id: newOrder.merchant_id,
            amount: newOrder.amount,
            currency: newOrder.currency,
            receipt: newOrder.receipt,
            notes: newOrder.notes,
            status: newOrder.status,
            created_at: newOrder.createdAt // Sequelize converts this to ISO string in JSON
        });

    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/orders/:order_id
const getOrder = async (req, res) => {
    try {
        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);

        if (!order) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        // Ensure order belongs to authenticated merchant
        if (order.merchant_id !== req.merchant.id) {
            return res.status(404).json({ // Security: Don't reveal existence
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        res.json({
            id: order.id,
            merchant_id: order.merchant_id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes,
            status: order.status,
            created_at: order.createdAt,
            updated_at: order.updatedAt
        });

    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/orders/:order_id/public
const getOrderPublic = async (req, res) => {
    try {
        const { order_id } = req.params;
        const order = await Order.findByPk(order_id);

        if (!order) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Order not found'
                }
            });
        }

        // For public endpoint, return minimal info needed for checkout
        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            status: order.status,
            // Don't expose merchant_id or secret notes if sensitive
        });

    } catch (error) {
        console.error('Get Public Order Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { createOrder, getOrder, getOrderPublic };
