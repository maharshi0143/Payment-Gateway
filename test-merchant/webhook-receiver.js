const express = require('express');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS for all routes so the frontend SDK can talk to it if needed
app.use(cors());

// Parse JSON bodies and capture raw body for signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf; // Store raw buffer
    }
}));

// Serve static files (index.html for the checkout page)
app.use(express.static(path.join(__dirname, 'public')));

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature'];

    // Use rawBody for verification
    const payloadToVerify = req.rawBody;

    console.log('--- Received Webhook ---');
    console.log('Event:', req.body.event);

    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', 'whsec_test_abc123')
        .update(payloadToVerify)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.log('❌ Invalid signature');
        console.log('Expected:', expectedSignature);
        console.log('Received:', signature);
        return res.status(401).send('Invalid signature');
    }

    console.log('✅ Webhook verified signature matches!');
    if (req.body.data && req.body.data.payment) {
        console.log('Payment ID:', req.body.data.payment.id);
        console.log('Status:', req.body.data.payment.status);
    }

    res.status(200).send('OK');
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Test merchant app running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/index.html`);
    console.log(`Webhook Endpoint: http://localhost:${PORT}/webhook`);
});
