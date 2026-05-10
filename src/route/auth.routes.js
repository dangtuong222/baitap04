import express from "express";
import authController from "../controllers/auth.controller.js";
import { validate, authorize, verifyToken } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
const {
  loginValidationRules,
  forgotPasswordValidationRules,
  resendOtpValidationRules,
  resetPasswordValidationRules
} = require("../validations/auth.validation");
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // 5 lần thử
  message: "Too many login attempts"
});

router.post(
  "/login",
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

router.get(
  "/user/profile",
  verifyToken,
  authorize("user", "admin"),
  (req, res) => {
    res.json({ user: req.user });
  }
);

router.get(
  "/admin/profile",
  verifyToken,
  authorize("admin"),
  (req, res) => {
    res.json({ message: "Admin only" });
  }
);

// protected route
router.get("/profile", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;