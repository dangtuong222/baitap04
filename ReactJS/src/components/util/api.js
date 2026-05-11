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

const logoutApi = () => {
    const URL_API = "/api/auth/logout";
    return axios.post(URL_API);
};

export {
    createUserApi,
    loginApi,
    getUserApi,
    logoutApi,
};