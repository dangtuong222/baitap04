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
export const editProfileValidationRules = [
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email không hợp lệ"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tên không được vượt quá 50 ký tự"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Họ không được vượt quá 50 ký tự"),

  body("phoneNumber")
    .optional()
    .trim()
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không hợp lệ"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Địa chỉ không được vượt quá 255 ký tự"),

  body("gender")
    .optional()
    .isBoolean()
    .withMessage("Giới tính phải là true hoặc false"),

  body("image")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("URL ảnh không được vượt quá 500 ký tự"),

  body("positionId")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Position ID không được vượt quá 50 ký tự"),
];