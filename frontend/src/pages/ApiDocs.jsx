import React from 'react';

const ApiDocs = () => {
    return (
        <div data-test-id="api-docs" className="animate-fade-in">
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1F2937' }}>
                Integration Guide
            </h1>

            <div className="card hover-card" style={{ marginBottom: '2rem' }}>
                <section data-test-id="section-create-order" style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.875rem' }}>STEP 1</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Create Order</h3>
                    </div>
                    <p style={{ color: '#4B5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Create an order from your backend to initiate a payment. This returns an <code>order_id</code> which is required for the checkout flow.
                    </p>
                    <div style={{ position: 'relative' }}>
                        <pre data-test-id="code-snippet-create-order" style={{
                            background: '#1F2937',
                            color: '#F9FAFB',
                            padding: '1.5rem',
                            borderRadius: '0.5rem',
                            overflowX: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            border: '1px solid #374151',
                            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                        }}>
                            <code>{`curl -X POST http://localhost:8000/api/v1/orders \\
  -H "X-Api-Key: key_test_abc123" \\
  -H "X-Api-Secret: secret_test_xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123"
  }'`}</code>
                        </pre>
                    </div>
                </section>

                <section data-test-id="section-sdk-integration" style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.875rem' }}>STEP 2</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>SDK Integration</h3>
                    </div>
                    <p style={{ color: '#4B5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Add our JS SDK to your checkout page. Use the <code>PaymentGateway</code> class to open the checkout modal.
                    </p>
                    <pre data-test-id="code-snippet-sdk" style={{
                        background: '#1F2937',
                        color: '#F9FAFB',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        border: '1px solid #374151',
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                    }}>
                        <code>{`<script src="http://localhost:3001/checkout.js"></script>
<script>
const checkout = new PaymentGateway({
  key: 'key_test_abc123',
  orderId: 'order_xyz', // Obtained from Step 1
  onSuccess: (response) => {
    console.log('Payment ID:', response.id);
    // Redirect or show success message
  },
  onFailure: (error) => {
    console.error('Payment failed:', error);
  }
});

// Bind to your pay button
document.getElementById('pay-btn').onclick = () => {
    checkout.open();
};
</script>`}</code>
                    </pre>
                </section>

                <section data-test-id="section-webhook-verification">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
                        <span className="badge badge-pending" style={{ fontSize: '0.875rem' }}>STEP 3</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Verify Webhook Signature</h3>
                    </div>
                    <p style={{ color: '#4B5563', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Verify the webhook signature to ensure the request is coming from us. The signature is in the <code>X-Webhook-Signature</code> header.
                    </p>
                    <pre data-test-id="code-snippet-webhook" style={{
                        background: '#1F2937',
                        color: '#F9FAFB',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        border: '1px solid #374151',
                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                    }}>
                        <code>{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}`}</code>
                    </pre>
                </section>
            </div>
        </div>
    );
};

export default ApiDocs;
