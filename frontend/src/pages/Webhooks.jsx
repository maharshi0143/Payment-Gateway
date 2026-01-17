import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Webhooks = () => {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const limit = 10;

    useEffect(() => {
        fetchData();
    }, [page]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const apiKey = 'key_test_abc123';
            const apiSecret = 'secret_test_xyz789'; // Added secret
            const headers = {
                'X-Api-Key': apiKey,
                'X-Api-Secret': apiSecret
            };

            // Fetch Merchant Details (for URL and Secret)
            // We need an endpoint for this or just rely on what we can get
            // The spec provided `GET /api/v1/me` in my plan or test endpoint
            const meRes = await axios.get('http://localhost:8000/api/v1/test/merchant', { headers }); // Using test endpoint for now as it exposes secret

            // In a real app we would use /api/v1/me and it should return masked secret or similar
            // But let's stick to what works for the project flow
            setWebhookUrl(meRes.data.webhook_url || '');
            setWebhookSecret(meRes.data.webhook_secret || 'Not configured');

            // Fetch Logs
            const logsRes = await axios.get(`http://localhost:8000/api/v1/webhooks?limit=${limit}&offset=${page * limit}`, { headers });
            setLogs(logsRes.data.data || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveUrl = async (e) => {
        e.preventDefault();
        try {
            const apiKey = 'key_test_abc123';
            const apiSecret = 'secret_test_xyz789';
            await axios.put('http://localhost:8000/api/v1/merchants/webhook-url', { webhook_url: webhookUrl }, {
                headers: {
                    'X-Api-Key': apiKey,
                    'X-Api-Secret': apiSecret,
                    'Content-Type': 'application/json'
                }
            });
            alert('Webhook URL saved successfully');
        } catch (error) {
            alert('Error saving URL');
        }
    };

    const handleRegenerateSecret = async () => {
        if (!confirm('Are you sure? This will invalidate the old secret.')) return;
        try {
            const apiKey = 'key_test_abc123';
            const res = await axios.post('http://localhost:8000/api/v1/merchants/webhook-secret', {}, {
                headers: { 'X-Api-Key': apiKey }
            });
            setWebhookSecret(res.data.webhook_secret);
        } catch (error) {
            alert('Error regenerating secret');
        }
    };

    const [retryingId, setRetryingId] = useState(null);

    const handleRetry = async (logId) => {
        if (!logId) {
            console.error('No log ID provided for retry');
            return;
        }

        try {
            setRetryingId(logId);

            // Optimistic Update: Set status to pending immediately
            setLogs(prevLogs => prevLogs.map(log =>
                log.id === logId ? { ...log, status: 'pending' } : log
            ));

            const apiKey = 'key_test_abc123';
            const apiSecret = 'secret_test_xyz789';
            await axios.post(`http://localhost:8000/api/v1/webhooks/${logId}/retry`, {}, {
                headers: {
                    'X-Api-Key': apiKey,
                    'X-Api-Secret': apiSecret
                }
            });

            // Re-fetch to confirm (optional, could just leave optimistic)
            setTimeout(fetchData, 1000); // Small delay to let DB update
            console.log('Retry scheduled for log:', logId);

        } catch (error) {
            console.error('Error creating retry:', error);
            alert('Error creating retry. Check console for details.');
            fetchData(); // Revert on error
        } finally {
            setRetryingId(null);
        }
    };

    const handleTestWebhook = async () => {
        // Implementation for "Send Test Webhook" - optional but good
        // Usually triggers a mock event. 
        // We can just alert for now or trigger a real event if we have an endpoint.
        alert('To test, please create a new payment or refund.');
    };

    return (
        <div data-test-id="webhook-config" className="animate-fade-in">
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1F2937' }}>
                Webhook Configuration
            </h1>

            {/* Configuration Form */}
            <div className="card hover-card" style={{ marginBottom: '2rem' }}>
                <form data-test-id="webhook-config-form" onSubmit={handleSaveUrl}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                            Webhook URL
                        </label>
                        <input
                            data-test-id="webhook-url-input"
                            type="url"
                            className="input-field"
                            placeholder="https://yoursite.com/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '-0.5rem' }}>
                            We'll send POST requests to this URL for payment events.
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                            Webhook Secret
                        </label>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#F9FAFB',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #E5E7EB'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>SIGNING SECRET</span>
                                <span data-test-id="webhook-secret" style={{ fontFamily: 'monospace', color: '#1F2937', fontWeight: '600', fontSize: '1rem' }}>
                                    {webhookSecret}
                                </span>
                            </div>
                            <button
                                data-test-id="regenerate-secret-button"
                                type="button"
                                onClick={handleRegenerateSecret}
                                className="btn-danger-outline"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
                        <button data-test-id="save-webhook-button" type="submit" className="btn-primary">
                            Save Configuration
                        </button>
                        <button
                            data-test-id="test-webhook-button"
                            type="button"
                            className="btn-outline"
                            onClick={handleTestWebhook}
                        >
                            Send Test Webhook
                        </button>
                    </div>
                </form>
            </div>

            {/* Logs Table */}
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1F2937' }}>
                Webhook Logs
            </h2>
            <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                <table data-test-id="webhook-logs-table">
                    <thead style={{ background: '#F9FAFB' }}>
                        <tr>
                            <th>Event</th>
                            <th>Status</th>
                            <th>Attempts</th>
                            <th>Last Attempt</th>
                            <th>Response</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
                                    No webhook logs found
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} data-test-id="webhook-log-item" data-webhook-id={log.id} className="hover-row">
                                    <td data-test-id="webhook-event" style={{ fontWeight: '500' }}>{log.event}</td>
                                    <td data-test-id="webhook-status">
                                        <span className={`badge ${log.status === 'success' ? 'badge-success' :
                                            log.status === 'failed' ? 'badge-failed' : 'badge-pending'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td data-test-id="webhook-attempts">{log.attempts}</td>
                                    <td data-test-id="webhook-last-attempt" style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                                        {log.last_attempt_at ? new Date(log.last_attempt_at).toLocaleString() : '-'}
                                    </td>
                                    <td data-test-id="webhook-response-code">
                                        {log.response_code ? (
                                            <span style={{
                                                fontFamily: 'monospace',
                                                background: '#F3F4F6',
                                                padding: '0.2rem 0.4rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.875rem'
                                            }}>
                                                {log.response_code}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <button
                                            data-test-id="retry-webhook-button"
                                            onClick={() => handleRetry(log.id)}
                                            className="btn-outline btn-sm"
                                            disabled={log.status === 'pending' || log.status === 'success' || retryingId === log.id}
                                            style={{
                                                opacity: (log.status === 'pending' || log.status === 'success' || retryingId === log.id) ? 0.5 : 1,
                                                cursor: (log.status === 'pending' || log.status === 'success' || retryingId === log.id) ? 'not-allowed' : 'pointer',
                                                minWidth: '60px'
                                            }}
                                        >
                                            {retryingId === log.id ? '...' : 'Retry'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Webhooks;
