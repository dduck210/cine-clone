import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';

const TestAuth = () => {
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('test123456');
    const [name, setName] = useState('Test User');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const handleRegister = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.post('/auth/register', {
                name,
                email,
                password,
            });
            console.log('Register response:', response.data);
            setMessage(`✅ Register success! Token: ${response.data.token.slice(0, 20)}...`);
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
        } catch (error) {
            console.error('Register error:', error.response?.data);
            setMessage(`❌ Register failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.post('/auth/login', {
                email,
                password,
            });
            console.log('Login response:', response.data);
            setMessage(`✅ Login success! Token: ${response.data.token.slice(0, 20)}...`);
            localStorage.setItem('token', response.data.token);
            setToken(response.data.token);
        } catch (error) {
            console.error('Login error:', error.response?.data);
            setMessage(`❌ Login failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setMessage('✅ Logged out');
    };

    return (
        <div className="p-8 max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6">Test Authentication</h1>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.includes('✅') ? 'bg-green-100' : 'bg-red-100'}`}>
                    {message}
                </div>
            )}

            {!token ? (
                <>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                        <button
                            onClick={handleRegister}
                            disabled={loading}
                            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Register'}
                        </button>
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Login'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="bg-green-100 p-4 rounded">
                        <p className="font-bold">✅ Logged In</p>
                        <p className="text-sm break-all">Token: {token.slice(0, 50)}...</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default TestAuth;