import React, { useState, useEffect } from 'react';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function CheckoutContent() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const isEmbedded = searchParams.get('embedded') === 'true';

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [method, setMethod] = useState(null); // 'upi' or 'card'
    const [paymentState, setPaymentState] = useState('initial'); // initial, processing, success, failed
    const [paymentResult, setPaymentResult] = useState(null);

    // Form States
    const [vpa, setVpa] = useState('');
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '', // MM/YY
        cvv: '',
        holder_name: ''
    });

    useEffect(() => {
        if (!orderId) {
            setError('Order ID is missing');
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                // Fetch from Public Endpoint
                const res = await axios.get(`http://localhost:8000/api/v1/orders/${orderId}/public`);
                setOrder(res.data);
            } catch (err) {
                console.error(err);
                setError('Invalid Order ID or Order not found');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    // Send messages to parent if embedded
    const sendMessage = (type, data) => {
        if (isEmbedded) {
            window.parent.postMessage({ type, data }, '*');
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setPaymentState('processing');

        try {
            const payload = {
                order_id: orderId,
                method: method
            };

            if (method === 'upi') {
                payload.vpa = vpa;
            } else {
                const [month, year] = cardData.expiry.split('/');
                payload.card = {
                    number: cardData.number,
                    expiry_month: month,
                    expiry_year: year,
                    cvv: cardData.cvv,
                    holder_name: cardData.holder_name
                };
            }

            // Create Payment
            const res = await axios.post('http://localhost:8000/api/v1/payments/public', payload);
            const paymentId = res.data.id;

            // Start Polling
            pollStatus(paymentId);

        } catch (err) {
            console.error(err);
            setPaymentState('failed');
            const errorDesc = err.response?.data?.error?.description || 'Payment creation failed';
            setPaymentResult({
                error_description: errorDesc
            });
            sendMessage('payment_failed', { error: errorDesc });
        }
    };

    const pollStatus = async (paymentId) => {
        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/v1/payments/${paymentId}/public`);
                const status = res.data.status;

                if (status === 'success') {
                    clearInterval(interval);
                    setPaymentState('success');
                    setPaymentResult(res.data);
                    sendMessage('payment_success', res.data);
                } else if (status === 'failed') {
                    clearInterval(interval);
                    setPaymentState('failed');
                    setPaymentResult(res.data);
                    sendMessage('payment_failed', res.data);
                }
                // If 'processing', continue polling
                // Note: pending -> processing -> success/failed
                // In Deliverable 2, status starts as 'pending'.
                // Polling pending is fine.
            } catch (err) {
                console.error("Polling error", err);
                clearInterval(interval);
                setPaymentState('failed');
            }
        }, 2000);
    };

    if (loading) return <div className="spinner" style={{ marginTop: '2rem' }}></div>;
    if (error) return <div className="checkout-container"><div className="card" style={{ textAlign: 'center', color: 'red' }}>{error}</div></div>;

    // Render Success
    if (paymentState === 'success') {
        return (
            <div className="checkout-container" data-test-id="success-state">
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="success-icon">✓</div>
                    <h2 style={{ marginBottom: '1rem', color: '#059669' }}>Payment Successful!</h2>

                    <div style={{ marginBottom: '0.5rem', color: '#64748b' }}>Payment ID</div>
                    <div data-test-id="payment-id" style={{ fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                        {paymentResult?.id}
                    </div>

                    <p data-test-id="success-message" style={{ color: '#475569', marginBottom: '2rem' }}>
                        Your payment has been processed successfully.
                    </p>

                    <a href="http://localhost:3000/dashboard" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Return to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Render Failed
    if (paymentState === 'failed') {
        return (
            <div className="checkout-container" data-test-id="error-state">
                <div className="card" style={{ textAlign: 'center' }}>
                    <div className="error-icon">✕</div>
                    <h2 style={{ marginBottom: '1rem', color: '#dc2626' }}>Payment Failed</h2>

                    <p data-test-id="error-message" style={{ color: '#ef4444', marginBottom: '2rem' }}>
                        {paymentResult?.error_description || 'Payment could not be processed'}
                    </p>

                    <button
                        data-test-id="retry-button"
                        className="btn-primary"
                        onClick={() => setPaymentState('initial')}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Render Processing
    if (paymentState === 'processing') {
        return (
            <div className="checkout-container" data-test-id="processing-state">
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div className="spinner"></div>
                    <div data-test-id="processing-message" style={{ fontSize: '1.125rem', color: '#475569' }}>
                        Processing payment...
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '1rem' }}>
                        Please do not close this window
                    </p>
                </div>
            </div>
        );
    }

    // Render Initial Form
    return (
        <div className="checkout-container" data-test-id="checkout-container">
            <div className="card">
                {/* Order Summary */}
                <div data-test-id="order-summary" style={{ marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>Complete Payment</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#64748b' }}>Order ID:</span>
                        <span data-test-id="order-id" style={{ fontFamily: 'monospace' }}>{order.id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Amount:</span>
                        <span data-test-id="order-amount" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency }).format(order.amount / 100)}
                        </span>
                    </div>
                </div>

                {/* Method Selection */}
                <div data-test-id="payment-methods" style={{ marginBottom: '2rem' }}>
                    <button
                        data-test-id="method-upi"
                        data-method="upi"
                        className={`btn-outline ${method === 'upi' ? 'selected' : ''}`}
                        onClick={() => setMethod('upi')}
                    >
                        UPI
                    </button>
                    <button
                        data-test-id="method-card"
                        data-method="card"
                        className={`btn-outline ${method === 'card' ? 'selected' : ''}`}
                        onClick={() => setMethod('card')}
                    >
                        Credit / Debit Card
                    </button>
                </div>

                {/* UPI Form */}
                {method === 'upi' && (
                    <form data-test-id="upi-form" onSubmit={handlePayment}>
                        <div className="input-group">
                            <input
                                data-test-id="vpa-input"
                                type="text"
                                className="input-field"
                                placeholder="username@bank"
                                value={vpa}
                                onChange={e => setVpa(e.target.value)}
                                required
                            />
                        </div>
                        <button data-test-id="pay-button" type="submit" className="btn-primary">
                            Pay {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency }).format(order.amount / 100)}
                        </button>
                    </form>
                )}

                {/* Card Form */}
                {method === 'card' && (
                    <form data-test-id="card-form" onSubmit={handlePayment}>
                        <div className="input-group">
                            <input
                                data-test-id="card-number-input"
                                type="text"
                                className="input-field"
                                placeholder="Card Number"
                                value={cardData.number}
                                onChange={e => setCardData({ ...cardData, number: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="input-group">
                            <input
                                data-test-id="expiry-input"
                                type="text"
                                className="input-field"
                                placeholder="MM/YY"
                                value={cardData.expiry}
                                onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                required
                            />
                            <input
                                data-test-id="cvv-input"
                                type="text"
                                className="input-field"
                                placeholder="CVV"
                                value={cardData.cvv}
                                onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                data-test-id="cardholder-name-input"
                                type="text"
                                className="input-field"
                                placeholder="Name on Card"
                                value={cardData.holder_name}
                                onChange={e => setCardData({ ...cardData, holder_name: e.target.value })}
                                required
                            />
                        </div>
                        <button data-test-id="pay-button" type="submit" className="btn-primary">
                            Pay {new Intl.NumberFormat('en-IN', { style: 'currency', currency: order.currency }).format(order.amount / 100)}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <CheckoutContent />
        </BrowserRouter>
    )
}

export default App
