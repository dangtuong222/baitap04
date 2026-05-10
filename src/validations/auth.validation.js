import { body } from "express-validator";

export const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ"),

  body("password")
    .notEmpty()
    .withMessage("Password không được để trống"),
];

export const forgotPasswordValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ"),
];

export const resendOtpValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ"),
];

export const resetPasswordValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ"),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP không được để trống")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP phải gồm 6 chữ số"),

  body("tempToken")
    .notEmpty()
    .withMessage("Temp token không được để trống"),

  body("newPassword")
    .notEmpty()
    .withMessage("Password không được để trống")
    .isLength({ min: 6 })
    .withMessage("Password tối thiểu 6 ký tự"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password không được để trống")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Confirm password không khớp"),
];