import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const [merchant, setMerchant] = useState(null);
    const [stats, setStats] = useState({ totalTransactions: 0, totalAmount: 0, successRate: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                
                const merchantRes = await axios.get('http://localhost:8000/api/v1/test/merchant');
                setMerchant(merchantRes.data);

                const apiKey = merchantRes.data.api_key;

                const response = await axios.get('http://localhost:8000/api/v1/transactions', {
                    headers: {
                        'X-Api-Key': merchantRes.data.api_key,
                        'X-Api-Secret': 'secret_test_xyz789' 
                    }
                });

                const transactions = response.data;

                // Calculate Stats
                const totalTx = transactions.length;
                const successfulTx = transactions.filter(t => t.status === 'success');
                const totalAmt = successfulTx.reduce((sum, t) => sum + t.amount, 0);
                const rate = totalTx > 0 ? ((successfulTx.length / totalTx) * 100).toFixed(0) : 0;

                setStats({
                    totalTransactions: totalTx,
                    totalAmount: totalAmt,
                    successRate: rate
                });

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            }
        };

        fetchData();
    }, []);

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/login');
    };

    if (!merchant) return <div className="spinner"></div>;



    // ... existing useEffect ...

    // (Kept handleLogout and navigate) 

    if (!merchant) return <div className="spinner"></div>;

    return (
        <div data-test-id="dashboard">
            {/* Header Section (Same as before) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Welcome back, <span style={{ color: '#4F46E5' }}>{merchant.email.split('@')[0]}</span></h1>
                {/* Logout Button (Same as before) */}
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '0.5rem 1.25rem',
                        backgroundColor: '#fee2e2',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#fecaca';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.transform = 'none';
                    }}
                >
                    <span>Log Out</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                </button>
            </div>

            {/* Payment Initiation Section */}
            <div className="card" style={{ marginBottom: '2rem', border: '1px solid #e5e7eb', transition: 'box-shadow 0.3s', boxShadow: focusedInput ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#EEF2FF', padding: '0.75rem', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>💸</span>
                    </div>
                    <div>
                        <h3 style={{ marginTop: 0, marginBottom: '0.25rem' }}>Initiate Payment</h3>
                        <p style={{ color: '#6B7280', margin: 0, fontSize: '0.875rem' }}>Create a new transaction order</p>
                    </div>
                </div>

                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (isSubmitting) return;

                        setIsSubmitting(true);
                        const form = e.target;
                        const amountVal = form.amount.value;
                        const noteVal = form.note.value;

                        try {
                            const res = await axios.post('http://localhost:8000/api/v1/orders', {
                                amount: amountVal * 100, // Convert to paise
                                currency: 'INR',
                                receipt: `receipt_${Date.now()}`,
                                notes: { description: noteVal }
                            }, {
                                headers: {
                                    'X-Api-Key': merchant.api_key,
                                    'X-Api-Secret': 'secret_test_xyz789'
                                }
                            });

                            // Slight delay to show off the loading state feels better
                            await new Promise(r => setTimeout(r, 500));

                            const checkoutUrl = `http://localhost:3001/checkout?order_id=${res.data.id}`;
                            window.open(checkoutUrl, '_blank').focus();
                        } catch (err) {
                            alert('Failed to initiate payment.');
                            console.error(err);
                        } finally {
                            setIsSubmitting(false);
                            form.reset();
                        }
                    }}
                    style={{ display: 'grid', gap: '1.5rem', maxWidth: '400px' }}
                >
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Amount</label>
                        <div style={{ position: 'relative', transition: 'all 0.2s', transform: focusedInput === 'amount' ? 'scale(1.01)' : 'none' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: focusedInput === 'amount' ? '#4F46E5' : '#9CA3AF', fontWeight: 'bold', transition: 'color 0.2s' }}>₹</span>
                            <input
                                name="amount"
                                type="number"
                                min="1"
                                defaultValue="500"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem', marginBottom: 0, borderColor: focusedInput === 'amount' ? '#4F46E5' : '#e5e7eb', boxShadow: focusedInput === 'amount' ? '0 0 0 4px rgba(79, 70, 229, 0.1)' : 'none' }}
                                required
                                onFocus={() => setFocusedInput('amount')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Description <span style={{ fontWeight: 'normal', color: '#9CA3AF' }}>(Optional)</span></label>
                        <div style={{ position: 'relative', transition: 'all 0.2s', transform: focusedInput === 'note' ? 'scale(1.01)' : 'none' }}>
                            <input
                                name="note"
                                type="text"
                                placeholder="e.g. Electricity Bill"
                                className="input-field"
                                style={{ marginBottom: 0, borderColor: focusedInput === 'note' ? '#4F46E5' : '#e5e7eb', boxShadow: focusedInput === 'note' ? '0 0 0 4px rgba(79, 70, 229, 0.1)' : 'none' }}
                                onFocus={() => setFocusedInput('note')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                        style={{
                            background: isSubmitting ? '#A5B4FC' : '#4F46E5',
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <span>Proceed to Pay</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0, color: '#6B7280' }}>API Credentials</h3>
                <div data-test-id="api-credentials" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'auto 1fr' }}>
                    <label style={{ fontWeight: '600' }}>API Key:</label>
                    <span data-test-id="api-key" style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>
                        {merchant.api_key}
                    </span>

                    <label style={{ fontWeight: '600' }}>API Secret:</label>
                    <span data-test-id="api-secret" style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>
                        secret_test_xyz789
                    </span>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Overview</h3>
            <div data-test-id="stats-container" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
            }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Transactions</div>
                    <div data-test-id="total-transactions" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4F46E5' }}>
                        {stats.totalTransactions}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Total Volume</div>
                    <div data-test-id="total-amount" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
                        ₹{(stats.totalAmount / 100).toLocaleString('en-IN')}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Success Rate</div>
                    <div data-test-id="success-rate" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>
                        {stats.successRate}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
