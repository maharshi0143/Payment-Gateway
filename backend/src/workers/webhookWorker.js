const axios = require('axios');
const crypto = require('crypto');
const { Merchant, WebhookLog } = require('../models');
const { webhookQueue } = require('../queues');

const RETRY_INTERVALS = [0, 60, 300, 1800, 7200]; // Seconds: 0, 1m, 5m, 30m, 2h
const TEST_RETRY_INTERVALS = [0, 5, 10, 15, 20]; // Seconds

const processWebhook = async (job) => {
    const { merchantId, event, payload, logId } = job.data;
    console.log(`Processing webhook for merchant ${merchantId}, event ${event}`);

    try {
        const merchant = await Merchant.findByPk(merchantId);
        if (!merchant || !merchant.webhook_url) {
            console.log(`No webhook URL for merchant ${merchantId}, skipping`);
            return;
        }

        // Create or fetch log
        let webhookLog;
        if (logId) {
            webhookLog = await WebhookLog.findByPk(logId);
        } else {
            webhookLog = await WebhookLog.create({
                merchant_id: merchantId,
                event,
                payload,
                status: 'pending',
                attempts: 0
            });
        }

        const currentAttempt = webhookLog.attempts + 1;

        const payloadString = JSON.stringify(payload);

        // Generate Signature
        const signature = crypto
            .createHmac('sha256', merchant.webhook_secret || '')
            .update(payloadString)
            .digest('hex');

        // Send Request
        let responseCode, responseBody;
        let success = false;

        try {
            const response = await axios.post(merchant.webhook_url, payloadString, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature
                },
                timeout: 5000
            });
            responseCode = response.status;
            responseBody = JSON.stringify(response.data);
            success = responseCode >= 200 && responseCode < 300;
        } catch (error) {
            if (error.response) {
                responseCode = error.response.status;
                responseBody = JSON.stringify(error.response.data);
            } else {
                responseCode = 0;
                responseBody = error.message;
            }
        }

        // Update Log
        webhookLog.attempts = currentAttempt;
        webhookLog.last_attempt_at = new Date();
        webhookLog.response_code = responseCode;
        webhookLog.response_body = responseBody;

        if (success) {
            webhookLog.status = 'success';
            webhookLog.next_retry_at = null;
            await webhookLog.save();
            console.log(`Webhook delivered successfully to ${merchant.webhook_url}`);
        } else {
            const intervals = process.env.WEBHOOK_RETRY_INTERVALS_TEST === 'true'
                ? TEST_RETRY_INTERVALS
                : RETRY_INTERVALS;

            if (currentAttempt < 5) {
                // Schedule Retry
                const delaySeconds = intervals[currentAttempt]; // Current attempt index is 1-based effectively next index
                // Wait, intervals are [0, 60, ...]. Attempt 1 (index 0 used 0 delay). Next is attempt 2.
                // If currentAttempt is 1, next is 2. We want delay for 2nd attempt.
                // Logic: 
                // Attempt 1: delay 0 (handled by queue immediately usually, or logic above is running it)
                // If Attempt 1 fails, schedule Attempt 2. Delay should be intervals[1] = 60s.
                // So delaySeconds = intervals[currentAttempt].

                const delayMs = delaySeconds * 1000;

                webhookLog.status = 'pending';
                webhookLog.next_retry_at = new Date(Date.now() + delayMs);
                await webhookLog.save();

                await webhookQueue.add({
                    merchantId,
                    event,
                    payload,
                    logId: webhookLog.id
                }, { delay: delayMs });

                console.log(`Webhook scheduled for retry ${currentAttempt + 1} in ${delaySeconds}s`);
            } else {
                webhookLog.status = 'failed';
                webhookLog.next_retry_at = null;
                await webhookLog.save();
                console.log(`Webhook failed permanently after ${currentAttempt} attempts`);
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        throw error;
    }
};

module.exports = processWebhook;
