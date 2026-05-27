import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { sendOtpEmail } from '../services/email.service.js';
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
  verifyOTPCode,
} from "../services/otpService.js";
import { sendPasswordResetEmail } from "../services/mailService.js";

const { User, RefreshToken, ResetOtp } = db;

// Lưu OTP tạm thời trong memory (cho đăng ký)
const otpStore = new Map();

/* =========================
   LOGIN
========================= */
let login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const role = user.role;
    let redirectURI = "/";
    if (role === "admin") redirectURI = "/admin/dashboard";
    else if (role === "user") redirectURI = "/user/dashboard";

    return res.json({
      message: "Login success",
      token: accessToken,
      role,
      redirectURI,
    });
  } catch (error) {
    console.error(error);
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

    const storedToken = await RefreshToken.findOne({
      where: { token, revoked: false },
    });
    if (!storedToken) {
      return res.sendStatus(403);
    }

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.sendStatus(403);

      const userId = decoded.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.sendStatus(401);
      }

      await RefreshToken.update({ revoked: true }, { where: { token } });

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await RefreshToken.create({
        token: newRefreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      });

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ message: "Token refreshed" });
    });
  } catch (error) {
    console.error(error);
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
      await RefreshToken.update({ revoked: true }, { where: { token } });
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out" });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD - VERIFY OTP & UPDATE
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    await ResetOtp.destroy({ where: { email } });

    const user = await User.findOne({ where: { email } });
    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      message: "Password reset successful",
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESEND OTP (FORGOT PASSWORD)
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
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   REGISTER - GỬI OTP
========================= */
let register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, address, gender } = req.body;
    const isMockEmail = String(process.env.EMAIL_MOCK || "").toLowerCase() === "true";

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được đăng ký.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + (parseInt(process.env.OTP_EXPIRY) || 300) * 1000;

    otpStore.set(email, {
      otp,
      otpExpiry,
      userData: { email, password: hashedPassword, firstName, lastName, phoneNumber, address, gender }
    });

    console.log(`\n=============================`);
    console.log(`📧 OTP cho ${email}: ${otp}`);
    console.log(`=============================\n`);

    // Trong môi trường test/dev, nếu gửi email lỗi thì vẫn cho phép tiếp tục verify OTP.
    if (!isMockEmail && typeof sendOtpEmail === 'function') {
      try {
        await sendOtpEmail(email, otp);
      } catch (mailError) {
        console.warn('Send OTP email failed, fallback to console OTP only:', mailError.message || mailError);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Mã OTP đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư.`
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau.'
    });
  }
};

/* =========================
   VERIFY REGISTRATION OTP
========================= */
let verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đăng ký cho email này.'
      });
    }

    if (Date.now() > record.otpExpiry) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.'
      });
    }

    if (record.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác.'
      });
    }

    // Tạo user vào database
    const newUser = await User.create({
      ...record.userData,
      roleId: 'R3',      // tuỳ theo model của bạn
      role: 'user'       // nếu dùng role string
    });

    otpStore.delete(email);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau.'
    });
  }
};

/* =========================
   RESEND REGISTRATION OTP
========================= */
let resendRegistrationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + (parseInt(process.env.OTP_EXPIRY) || 300) * 1000;

    otpStore.set(email, { ...record, otp, otpExpiry });

    if (typeof sendOtpEmail === 'function') {
      await sendOtpEmail(email, otp);
    }
    console.log(`📧 Resend OTP cho ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra hộp thư.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau.'
    });
  }
};

/* =========================
   EDIT USER PROFILE
========================= */
let editUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, firstName, lastName, phoneNumber, address, gender, image, positionId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    await user.update({
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phoneNumber: phoneNumber || user.phoneNumber,
      address: address || user.address,
      gender: gender !== undefined ? gender : user.gender,
      image: image || user.image,
      positionId: positionId || user.positionId,
    });

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        gender: user.gender,
        image: user.image,
        positionId: user.positionId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   EDIT ADMIN PROFILE
========================= */
let editAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { email, firstName, lastName, phoneNumber, address, gender, image, positionId, role } = req.body;

    const targetUserId = userId ? parseInt(userId) : adminId;
    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUserId !== adminId && user.role === "admin") {
      return res.status(403).json({ message: "Cannot edit other admin profiles" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    const updateData = {
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phoneNumber: phoneNumber || user.phoneNumber,
      address: address || user.address,
      gender: gender !== undefined ? gender : user.gender,
      image: image || user.image,
      positionId: positionId || user.positionId,
    };

    if (role && targetUserId !== adminId) {
      updateData.role = role;
    }

    await user.update(updateData);

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        gender: user.gender,
        image: user.image,
        positionId: user.positionId,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export default {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  resendOtp,                  // Gửi lại OTP cho quên mật khẩu
  register,                  // Đăng ký - gửi OTP
  verifyRegistrationOtp,     // Xác thực OTP đăng ký
  resendRegistrationOtp,     // Gửi lại OTP đăng ký
  editUserProfile,
  editAdminProfile,
};
