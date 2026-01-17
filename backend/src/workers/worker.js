const { sequelize } = require('../config/db');
const { paymentQueue, webhookQueue, refundQueue } = require('../queues');
const processPayment = require('./paymentWorker');
const processWebhook = require('./webhookWorker');
const processRefund = require('./refundWorker');

const startWorker = async () => {
    try {
        await sequelize.authenticate();
        console.log('Worker connected to database.');

        // Process jobs
        paymentQueue.process(processPayment);
        webhookQueue.process(processWebhook);
        refundQueue.process(processRefund);

        console.log('Worker started processing queues.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startWorker();
