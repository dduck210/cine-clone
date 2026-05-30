import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    timeout: 10000, // 10s timeout
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// Production-grade retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // base delay in ms

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle responses and implement retry logic
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response, message } = error;

        // 1. Logging specific error types for better diagnostics
        if (!response) {
            console.error(' [Network Error] API is unreachable. Possible causes: Ngrok offline, No internet, or Backend crashed.');
            console.warn('  -> Tip: Check if your Ngrok tunnel is still active and the Backend is running on port 5000.');
        } else if (response.status >= 500) {
            console.error(` [Server Error] Status ${response.status}: ${response.data?.message || 'Internal Server Error'}`);
        } else if (response.status === 401) {
            const url = config?.url || '';
            const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

            // Try refresh token before redirecting to login
            if (!isAuthEndpoint && !config.__isRetryAfterRefresh) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    try {
                        const refreshRes = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                        const newToken = refreshRes.data.token;
                        localStorage.setItem('token', newToken);
                        config.headers.Authorization = `Bearer ${newToken}`;
                        config.__isRetryAfterRefresh = true;
                        return axiosInstance(config);
                    } catch {
                        // Refresh failed — clear storage and redirect
                    }
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('currentUser');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        // 2. Retry Logic for Network Errors or 503/504 (Gateway issues like Ngrok)
        const isNetworkError = !response && message !== 'Canceled';
        // 502 included because ngrok returns 502 during brief tunnel reconnections
        const isRetryableError = isNetworkError || (response && [502, 503, 504].includes(response.status));

        if (isRetryableError && (!config.__retryCount || config.__retryCount < MAX_RETRIES)) {
            config.__retryCount = (config.__retryCount || 0) + 1;

            const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1); // Exponential backoff
            console.log(` [Retry] Attempt ${config.__retryCount} failed. Retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return axiosInstance(config);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;