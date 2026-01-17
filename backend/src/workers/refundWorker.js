const { Refund, Payment } = require('../models');
const { webhookQueue } = require('../queues');
const { Op } = require('sequelize');

const processRefund = async (job) => {
    const { refundId } = job.data;
    console.log(`Processing refund ${refundId}`);

    try {
        const refund = await Refund.findByPk(refundId);
        if (!refund) {
            throw new Error('Refund not found');
        }

        const payment = await Payment.findByPk(refund.payment_id);
        if (!payment) {
            throw new Error('Payment not found');
        }

        // 1. Verify payment is in refundable state
        if (payment.status !== 'success') {
            console.error(`Refund ${refundId} failed: Payment ${payment.id} is not in success state (${payment.status})`);
            refund.status = 'failed';
            refund.reason = (refund.reason ? refund.reason + ' | ' : '') + 'Payment not successful';
            await refund.save();
            return { status: 'failed', error: 'Payment not successful' };
        }

        // 2. Verify total refunded amount
        const allRefunds = await Refund.findAll({
            where: {
                payment_id: payment.id,
                status: {
                    [Op.in]: ['pending', 'processed']
                }
            }
        });

        const totalRefunded = allRefunds.reduce((sum, r) => sum + r.amount, 0);

        if (totalRefunded > payment.amount) {
            console.error(`Refund ${refundId} failed: Total refunded ${totalRefunded} exceeds payment amount ${payment.amount}`);
            refund.status = 'failed';
            refund.reason = (refund.reason ? refund.reason + ' | ' : '') + 'Refund amount exceeds allowed limit';
            await refund.save();
            return { status: 'failed', error: 'Refund limit exceeded' };
        }

        // Simulate processing delay
        let delay = Math.floor(Math.random() * 2000) + 3000; // 3-5s
        // Note: Prompt didn't strictly require test_mode for refund delay, but good to keep standard if needed. 
        // Instructions only mentioned test mode for PaymentWorker delay and webhooks.

        await new Promise(resolve => setTimeout(resolve, delay));

        // Update status
        refund.status = 'processed';
        refund.processed_at = new Date();
        await refund.save();

        // Enqueue Webhook
        const event = 'refund.processed';
        await webhookQueue.add({
            merchantId: refund.merchant_id,
            event,
            payload: {
                event,
                timestamp: Math.floor(Date.now() / 1000),
                data: {
                    refund: refund.toJSON(),
                    payment: payment.toJSON()
                }
            }
        });

        console.log(`Refund ${refundId} processed`);
        return { status: 'processed' };
    } catch (error) {
        console.error(`Error processing refund ${refundId}:`, error);
        throw error;
    }
};

module.exports = processRefund;
