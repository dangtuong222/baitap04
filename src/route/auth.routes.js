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
  max: 10, // 10 lần thử
  message: "Too many login attempts"
});

const editProfileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // 10 lần edit
  message: "Too many profile updates"
});

router.post(
  "/api/auth/login",
  loginLimiter,
  loginValidationRules,
  validate,
  authController.login
);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post(
  "/forgot-password",
  forgotPasswordValidationRules,
  validate,
  authController.forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordValidationRules,
  validate,
  authController.resetPassword
);

router.post(
  "/resend-otp",
  resendOtpValidationRules,
  validate,
  authController.resendOtp
);

);router.post("/api/auth/refresh", authController.refresh);
router.post("/api/auth/logout", authController.logout);

// User profile routes
router.get(
  "/user/profile",
  verifyToken,
  authorize("user", "admin"),
  (req, res) => {
    res.json({ user: req.user });
  }
);

router.patch(
  "/user/profile",
  verifyToken,
  authorize("user", "admin"),
  editProfileLimiter,
  editProfileValidationRules,
  validate,
  authController.editUserProfile
);

// Admin profile routes
router.get(
  "/admin/profile",
  verifyToken,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Admin only" });
  }
);

router.patch(
  "/admin/profile/:userId?",
  verifyToken,
  authorize("admin"),
  editProfileLimiter,
  editProfileValidationRules,
  validate,
  authController.editAdminProfile
);

// protected route
router.get("/profile", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;