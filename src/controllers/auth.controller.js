const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");

const { User, RefreshToken, ResetOtp } = db;
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
  verifyOTPCode
} = require("../services/otpService");
const { sendPasswordResetEmail } = require("../services/mailService");

/* =========================
   LOGIN
========================= */
let login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm user
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // 3. Tạo token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Lưu refresh token vào DB
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false
    });

    // 5. Set cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 phút
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Login success",
      token: accessToken
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   REFRESH TOKEN (ROTATION)
========================= */
let refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.sendStatus(401);
    }

    // 1. Kiểm tra token trong DB
    const storedToken = await RefreshToken.findOne({
      where: { token, revoked: false }
    });

    if (!storedToken) {
      return res.sendStatus(403);
    }

    // 2. Verify JWT
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.sendStatus(403);

      const userId = decoded.id;

      // 3. Revoke token cũ
      await RefreshToken.update(
        { revoked: true },
        { where: { token } }
      );

      // 4. Tạo token mới
      const newAccessToken = jwt.sign(
        { id: userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      const newRefreshToken = jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // 5. Lưu refresh token mới
      await RefreshToken.create({
        token: newRefreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false
      });

      // 6. Set cookie mới
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({ message: "Token refreshed" });
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LOGOUT
========================= */
let logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await RefreshToken.update(
        { revoked: true },
        { where: { token } }
      );
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({ message: "Logged out" });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD - SEND OTP
========================= */
let forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await ResetOtp.destroy({ where: { email } });
    await ResetOtp.create({ email, otp, expiresAt });

    await sendPasswordResetEmail(email, otp, user.firstName || "User");

    const tempTokenSecret = process.env.TEMP_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
    const tempToken = jwt.sign(
      { email, purpose: "password-reset" },
      tempTokenSecret,
      { expiresIn: "10m" }
    );

    return res.json({ message: "OTP sent", tempToken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD - VERIFY OTP
========================= */
let resetPassword = async (req, res) => {
  try {
    const { email, otp, tempToken, newPassword } = req.body;

    const tempTokenSecret = process.env.TEMP_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(tempToken, tempTokenSecret);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired temp token" });
    }

    if (decoded.email !== email || decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid temp token" });
    }

    const storedOtp = await ResetOtp.findOne({ where: { email } });
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (isOTPExpired(storedOtp.expiresAt)) {
      await ResetOtp.destroy({ where: { email } });
      return res.status(400).json({ message: "OTP expired" });
    }

    if (!verifyOTPCode(otp, storedOtp.otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashed }, { where: { email } });
    await ResetOtp.destroy({ where: { email } });

    const accessToken = generateAccessToken(user);
    return res.status(201).json({ message: "Password reset success", accessToken });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESEND OTP
========================= */
let resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    await ResetOtp.destroy({ where: { email } });
    await ResetOtp.create({ email, otp, expiresAt });

    await sendPasswordResetEmail(email, otp, user.firstName || "User");

    return res.json({ message: "OTP resent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  resendOtp
};
