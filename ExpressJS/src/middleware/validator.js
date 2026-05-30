import { body, validationResult } from 'express-validator';

export const registerValidator = [
    body('email')
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mật khẩu phải có chữ hoa, chữ thường và số'),

    body('firstName')
        .notEmpty().withMessage('Họ không được để trống')
        .isLength({ min: 2 }).withMessage('Họ tối thiểu 2 ký tự'),

    body('lastName')
        .notEmpty().withMessage('Tên không được để trống')
        .isLength({ min: 2 }).withMessage('Tên tối thiểu 2 ký tự'),

    body('phoneNumber')
        .optional({ checkFalsy: true })
        .matches(/^(?:\+84|0)\d{9,10}$/).withMessage('Số điện thoại không hợp lệ'),

    // Middleware kiểm tra kết quả validation
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array().map(e => ({
                    field: e.path,
                    message: e.msg
                }))
            });
        }
        next();
    }
];

export const verifyOtpValidator = [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('otp')
        .notEmpty().withMessage('OTP không được để trống')
        .isLength({ min: 6, max: 6 }).withMessage('OTP phải đúng 6 ký tự'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array().map(e => ({
                    field: e.path,
                    message: e.msg
                }))
            });
        }
        next();
    }
];