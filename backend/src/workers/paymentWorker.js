const { Payment, Order } = require('../models');
const { webhookQueue } = require('../queues');

const processPayment = async (job) => {
    const { paymentId } = job.data;
    console.log(`Processing payment ${paymentId}`);

    try {
        const payment = await Payment.findByPk(paymentId, { include: [Order] });
        if (!payment) {
            throw new Error('Payment not found');
        }

        // Simulate processing delay
        let delay = Math.floor(Math.random() * 5000) + 5000; // 5-10s
        if (process.env.TEST_MODE === 'true') {
            delay = parseInt(process.env.TEST_PROCESSING_DELAY || '1000');
        }
        await new Promise(resolve => setTimeout(resolve, delay));

        // Determine outcome
        let success = true;
        if (process.env.TEST_MODE === 'true') {
            success = process.env.TEST_PAYMENT_SUCCESS === 'true';
        } else {
            const random = Math.random();
            if (payment.method === 'upi') {
                success = random < 0.90;
            } else {
                success = random < 0.95;
            }
        }

        // Update status
        if (success) {
            payment.status = 'success';
        } else {
            payment.status = 'failed';
            payment.error_code = 'PAYMENT_FAILED';
            payment.error_description = 'Payment processing failed';
        }
        await payment.save();

        // Enqueue Webhook
        const event = success ? 'payment.success' : 'payment.failed';
        await webhookQueue.add({
            merchantId: payment.merchant_id,
            event,
            payload: {
                event,
                timestamp: Math.floor(Date.now() / 1000),
                data: {
                    payment: payment.toJSON()
                }
            }
        });

        console.log(`Payment ${paymentId} processed: ${payment.status}`);
        return { status: payment.status };
    } catch (error) {
        console.error(`Error processing payment ${paymentId}:`, error);
        throw error;
    }
};

module.exports = processPayment;
