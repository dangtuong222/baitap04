import axios from './axios.customize';

const createUserApi = (name, email, password) => {
    const URL_API = "/api/auth/register";
    const data = {
        name,
        email,
        password
    };

    return axios.post(URL_API, data);
};

const loginApi = (email, password) => {
    const URL_API = "/api/auth/login";
    const data = {
        email,
        password
    };

    return axios.post(URL_API, data);
};

const getUserApi = () => {
    const URL_API = "/api/auth/profile";
    return axios.get(URL_API);
};

const getProfileApi = () => getUserApi();

const updateProfileApi = (data) => {
    const URL_API = "/api/auth/profile";
    return axios.put(URL_API, data);
};

const logoutApi = () => {
    const URL_API = "/api/auth/logout";
    return axios.post(URL_API);
};

const registerApi = (email, password, firstName, lastName, phoneNumber) => {
    const URL_API = "/api/auth/register";
    const data = {
        email,
        password,
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined
    };

    return axios.post(URL_API, data);
};

const verifyRegisterOtpApi = (email, otp) => {
    const URL_API = "/api/auth/verify-otp";
    const data = {
        email,
        otp
    };

    return axios.post(URL_API, data);
};

const resendRegisterOtpApi = (email) => {
    const URL_API = "/api/auth/resend-otp";
    const data = {
        email
    };

    return axios.post(URL_API, data);
};

const forgotPasswordApi = (email) => {
    const URL_API = "/api/auth/forgot-password";
    const data = {
        email
    };

    return axios.post(URL_API, data);
};

const resetPasswordApi = (email, otp, tempToken, newPassword, confirmPassword) => {
    const URL_API = "/api/auth/reset-password";
    const data = {
        email,
        otp,
        tempToken,
        newPassword,
        confirmPassword
    };

    return axios.post(URL_API, data);
};

const resendForgotPasswordOtpApi = (email) => {
    const URL_API = "/api/auth/resend-otp";
    const data = {
        email
    };

    return axios.post(URL_API, data);
};

export {
    createUserApi,
    loginApi,
    getUserApi,
    logoutApi,
    registerApi,
    verifyRegisterOtpApi,
    resendRegisterOtpApi,
    forgotPasswordApi,
    resetPasswordApi,
    resendForgotPasswordOtpApi,
    getProfileApi,
    updateProfileApi,
};