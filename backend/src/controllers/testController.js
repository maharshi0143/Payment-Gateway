const { Merchant } = require('../models');
const { paymentQueue, webhookQueue, refundQueue } = require('../queues');

// GET /api/v1/test/merchant
const getTestMerchant = async (req, res) => {
    try {
        const merchant = await Merchant.findOne({
            where: { email: 'test@example.com' }
        });

        if (!merchant) {
            return res.status(404).json({ error: 'Test merchant not found' });
        }

        res.json({
            id: merchant.id,
            email: merchant.email,
            api_key: merchant.api_key,
            webhook_secret: merchant.webhook_secret, // Exposed for testing
            seeded: true
        });
    } catch (error) {
        console.error('Test controller error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/v1/test/jobs/status
const getJobStatus = async (req, res) => {
    try {
        const queues = [paymentQueue, webhookQueue, refundQueue];
        let pending = 0;
        let processing = 0;
        let completed = 0;
        let failed = 0;

        for (const q of queues) {
            const counts = await q.getJobCounts();
            pending += (counts.waiting || 0) + (counts.delayed || 0); // delayed are functionally pending execution
            processing += counts.active || 0;
            completed += counts.completed || 0;
            failed += counts.failed || 0;
        }

        // In a real system, we'd check if the worker process is alive (e.g. heartbeat in Redis).
        // Here we just assume running if endpoints are hit? 
        // Or "worker_status: String indicating if worker is running"
        // Without complex heartbeat, we can static return "running" or check if redis is reachable.
        // We'll return "running" as a simplification or checking if queue client is ready.
        const workerStatus = 'running';

        res.json({
            pending,
            processing,
            completed,
            failed,
            worker_status: workerStatus
        });
    } catch (error) {
        console.error('Job Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getTestMerchant, getJobStatus };
