import express from 'express';
import authController from '../controllers/auth.controller.js';

import {
    registerLimiter,
    otpLimiter
} from '../middleware/rateLimiter.js';

import {
    registerValidator,
    verifyOtpValidator
} from '../middleware/validator.js';

import authRoutes from './auth.routes.js';
import apiRoutes from './apiRoutes.js';

let router = express.Router();

let initWebRoutes = (app) => {

    router.post(
        '/api/auth/register',
        registerLimiter,
        registerValidator,
        authController.register
    );

    router.post(
        '/api/auth/verify-otp',
        otpLimiter,
        verifyOtpValidator,
        authController.verifyRegistrationOtp
    );

    router.post(
        '/api/auth/resend-otp',
        otpLimiter,
        authController.resendRegistrationOtp
    );

    // mount API routes from auth.routes
    app.use('/', authRoutes);

    // mount product/category/search API routes
    app.use('/api', apiRoutes);

    return app.use('/', router);
};

export default initWebRoutes;