import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
    timeout: 10000,
});

// Add a request interceptor
instance.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[Axios] Adding token to request:', token.substring(0, 50) + '...');
        } else {
            console.log('[Axios] No token found in localStorage');
        }
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(
    function (response) {
        if (response && response.data) return response.data;
        return response;
    },
    function (error) {
        const status = error?.response?.status;
        console.error('[Axios] Response error:', {
            status,
            data: error?.response?.data,
            message: error?.message
        });

        const originalRequest = error.config;
        const isRefreshRequest = originalRequest?.url?.includes('/api/auth/refresh');

        // Try refresh once on 401/403
        if (isRefreshRequest) {
            // Refresh endpoint failed -> force logout
            try { localStorage.removeItem('access_token'); localStorage.removeItem('user_info'); } catch (e) {}
            try { if (typeof window !== 'undefined') window.location = '/login'; } catch (e) {}
            return Promise.reject(error);
        }

        if ((status === 401 || status === 403) && !originalRequest?._retry) {
            originalRequest._retry = true;
            console.log('[Axios] Attempting token refresh...');
            return instance.post('/api/auth/refresh', null, { withCredentials: true })
                .then((res) => {
                    console.log('[Axios] Refresh response:', res);
                    // After refresh, retry original request (cookies will be sent via withCredentials)
                    return instance.request(originalRequest);
                })
                .catch((refreshErr) => {
                    console.error('[Axios] Refresh failed:', refreshErr);
                    try { localStorage.removeItem('access_token'); localStorage.removeItem('user_info'); } catch (e) {}
                    try { if (typeof window !== 'undefined') window.location = '/login'; } catch (e) {}
                    return Promise.reject(refreshErr);
                });
        }
        return Promise.reject(error);
    }
);

export default instance;