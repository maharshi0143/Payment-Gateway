import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

// Simple Auth Context Logic (Simulated for simulate session)
export const AuthContext = React.createContext(null);

function Layout({ children }) {
    const location = useLocation();

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: '#ffffff',
                borderRight: '1px solid #e5e7eb',
                padding: '2rem'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '2rem',
                    background: 'linear-gradient(to right, #4F46E5, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Gateway
                </h2>
                <nav>
                    <Link to="/dashboard" style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.5rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        color: location.pathname === '/dashboard' ? '#4F46E5' : '#4B5563',
                        background: location.pathname === '/dashboard' ? '#EEF2FF' : 'transparent',
                        fontWeight: location.pathname === '/dashboard' ? '600' : '400'
                    }}>
                        Home
                    </Link>
                    <Link to="/dashboard/transactions" style={{
                        display: 'block',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.5rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        color: location.pathname === '/dashboard/transactions' ? '#4F46E5' : '#4B5563',
                        background: location.pathname === '/dashboard/transactions' ? '#EEF2FF' : 'transparent',
                        fontWeight: location.pathname === '/dashboard/transactions' ? '600' : '400'
                    }}>
                        Transactions
                    </Link>
                </nav>
            </aside>
            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}

function PrivateRoute({ children }) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    return isLoggedIn ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/dashboard/transactions" element={
                    <PrivateRoute>
                        <Transactions />
                    </PrivateRoute>
                } />
            </Routes>
        </Router>
    );
}

export default App;
