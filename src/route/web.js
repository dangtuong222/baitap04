import express from 'express';
import * as authController from '../controllers/auth.controller';
import { registerLimiter, otpLimiter } from '../middleware/rateLimiter';
import { registerValidator, verifyOtpValidator } from '../middleware/validator';

let router = express.Router();

let initWebRoutes = (app) => {
    // Auth Routes
    router.post('/api/auth/register', registerLimiter, registerValidator, authController.register);
    router.post('/api/auth/verify-otp', otpLimiter, verifyOtpValidator, authController.verifyOtp);
    router.post('/api/auth/resend-otp', otpLimiter, authController.resendOtp);

    return app.use('/', router);
};

module.exports = initWebRoutes;