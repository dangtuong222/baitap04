import rateLimit from 'express-rate-limit';

export const registerLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000, // 1 giờ
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu đăng ký từ IP này, vui lòng thử lại sau 1 giờ.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 3,
    message: {
        success: false,
        message: 'Quá nhiều lần gửi OTP, vui lòng thử lại sau 5 phút.'
    }
});