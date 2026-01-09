import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Since API doesn't have login, we simulate plain check
        if (email === 'test@example.com') { // Password check skipped as per spec "Any password"
            localStorage.setItem('isLoggedIn', 'true');
            // We'll fetch api keys in dashboard using the test/merchant endpoint
            navigate('/dashboard');
        } else {
            alert('Invalid credentials. Use test@example.com');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
        }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Merchant Login</h2>
                <form data-test-id="login-form" onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <input
                            data-test-id="email-input"
                            type="email"
                            placeholder="Email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <input
                            data-test-id="password-input"
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        data-test-id="login-button"
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        Login
                    </button>
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666', textAlign: 'center' }}>
                        Use: test@example.com / any
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
