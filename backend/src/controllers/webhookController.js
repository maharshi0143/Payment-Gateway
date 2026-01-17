const { WebhookLog, Merchant } = require('../models');
const { webhookQueue } = require('../queues');

// GET /api/v1/webhooks
const getWebhookLogs = async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;

        const { count, rows } = await WebhookLog.findAndCountAll({
            where: { merchant_id: req.merchant.id },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            data: rows,
            total: count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Get Webhook Logs Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST /api/v1/webhooks/:webhook_id/retry
const retryWebhook = async (req, res) => {
    try {
        const { webhook_id } = req.params;
        const log = await WebhookLog.findByPk(webhook_id);

        if (!log || log.merchant_id !== req.merchant.id) {
            return res.status(404).json({ error: 'Webhook log not found' });
        }

        // Reset and Requeue
        log.status = 'pending';
        log.attempts = 0; // Reset attempts as per spec? "Reset attempts to 0" - YES.
        log.next_retry_at = null;
        await log.save();

        await webhookQueue.add({
            merchantId: log.merchant_id,
            event: log.event,
            payload: log.payload,
            logId: log.id
        });

        res.json({
            id: log.id,
            status: 'pending',
            message: 'Webhook retry scheduled'
        });

    } catch (error) {
        console.error('Retry Webhook Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getWebhookLogs,
    retryWebhook
};
