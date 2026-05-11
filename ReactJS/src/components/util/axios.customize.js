import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true,
});

// Add a request interceptor
instance.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
        if (error?.response?.data) return error?.response?.data;
        return Promise.reject(error);
    }
);

export default instance;