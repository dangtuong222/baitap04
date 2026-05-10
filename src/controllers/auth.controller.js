const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../models");

const { User, RefreshToken, ResetOtp } = db;
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
  verifyOTPCode,
} = require("../services/otpService");
const { sendPasswordResetEmail } = require("../services/mailService");

/* =========================
   LOGIN
========================= */
let login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Save refresh token to DB
    await RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    });

    // 5. Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 6. Determine redirect URI based on role
    const role = user.role;
    let redirectURI = "/";
    if (role === "admin") redirectURI = "/admin/dashboard";
    else if (role === "user") redirectURI = "/user/dashboard";
    // add more roles as needed

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

    // 1. Check token in DB (not revoked)
    const storedToken = await RefreshToken.findOne({
      where: { token, revoked: false },
    });
    if (!storedToken) {
      return res.sendStatus(403);
    }

    // 2. Verify JWT
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.sendStatus(403);

      const userId = decoded.id;

      // 3. Revoke old token
      await RefreshToken.update({ revoked: true }, { where: { token } });

      // 4. Generate new tokens
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

      // 5. Save new refresh token
      await RefreshToken.create({
        token: newRefreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      });

      // 6. Set new cookies
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
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

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    // Remove old OTP and create new one
    await ResetOtp.destroy({ where: { email } });
    await ResetOtp.create({ email, otp, expiresAt });

    // Send email
    await sendPasswordResetEmail(email, otp, user.firstName || "User");

    // Create temporary token for reset session
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

    // Verify temp token
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

    // Verify OTP
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

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    // Delete used OTP
    await ResetOtp.destroy({ where: { email } });

    // Optionally generate new access token (user may login automatically)
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
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   EDIT USER PROFILE (regular user)
========================= */
let editUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, firstName, lastName, phoneNumber, address, gender, image, positionId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Update allowed fields
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
   EDIT ADMIN PROFILE (admin edits any user, with restrictions)
========================= */
let editAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params; // ID of user to edit
    const { email, firstName, lastName, phoneNumber, address, gender, image, positionId, role } = req.body;

    const targetUserId = userId ? parseInt(userId) : adminId;
    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admins cannot edit other admin profiles (except themselves)
    if (targetUserId !== adminId && user.role === "admin") {
      return res.status(403).json({ message: "Cannot edit other admin profiles" });
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Prepare update data
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

    // Only allow role change when editing a non-admin user and not editing self
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

module.exports = {
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  resendOtp,
  editUserProfile,
  editAdminProfile,
};