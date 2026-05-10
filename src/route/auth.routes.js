import express from "express";
import authController from "../controllers/auth.controller.js";
import { validate, authorize, verifyToken } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const {
  loginValidationRules,
  forgotPasswordValidationRules,
  resendOtpValidationRules,
  resetPasswordValidationRules,
  editProfileValidationRules
} = require("../validations/auth.validation");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  message: "Too many login attempts"
});

const editProfileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10,
  message: "Too many profile updates"
});

// ==================== AUTH PUBLIC ROUTES ====================
router.post(
  "/api/auth/login",
  loginLimiter,
  loginValidationRules,
  validate,
  authController.login
);

router.post(
  "/api/auth/refresh",
  authController.refresh
);

router.post(
  "/api/auth/logout",
  authController.logout
);

router.post(
  "/api/auth/forgot-password",
  forgotPasswordValidationRules,
  validate,
  authController.forgotPassword
);

router.post(
  "/api/auth/reset-password",
  resetPasswordValidationRules,
  validate,
  authController.resetPassword
);

router.post(
  "/api/auth/resend-otp",
  resendOtpValidationRules,
  validate,
  authController.resendOtp
);

// ==================== USER PROFILE (authenticated) ====================
router.get(
  "/api/user/profile",
  verifyToken,
  authorize("user", "admin"),
  (req, res) => {
    res.json({ user: req.user });
  }
);

router.patch(
  "/api/user/profile",
  verifyToken,
  authorize("user", "admin"),
  editProfileLimiter,
  editProfileValidationRules,
  validate,
  authController.editUserProfile
);

// ==================== ADMIN PROFILE ROUTES ====================
// Admin xem thông tin riêng (không cần userId)
router.get(
  "/api/admin/profile",
  verifyToken,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Admin only", user: req.user });
  }
);

// Admin chỉnh sửa profile của chính mình
router.patch(
  "/api/admin/profile",
  verifyToken,
  authorize("admin"),
  editProfileLimiter,
  editProfileValidationRules,
  validate,
  authController.editAdminProfile
);

// Admin chỉnh sửa profile của user khác (bắt buộc userId)
router.patch(
  "/api/admin/profile/:userId",
  verifyToken,
  authorize("admin"),
  editProfileLimiter,
  editProfileValidationRules,
  validate,
  authController.editAdminProfile
);

// (Tuỳ chọn) Route protected cơ bản lấy thông tin user từ token
router.get("/api/auth/profile", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;