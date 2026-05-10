import express from "express";
import authController from "../controllers/auth.controller.js";
import { validate, authorize, verifyToken } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";
const {
  loginValidationRules
} = require("../validations/auth.validation");
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // 10 lần thử
  message: "Too many login attempts"
});

router.post(
  "/api/auth/login",
  loginLimiter,
  loginValidationRules,
  validate,
  authController.login
);router.post("/api/auth/refresh", authController.refresh);
router.post("/api/auth/logout", authController.logout);

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