'use strict';

import bcrypt from 'bcryptjs';
import db from '../models';
import { sendOtpEmail } from '../services/email.service';

// Lưu OTP tạm thời trong memory
const otpStore = new Map();

// ============================================================
// POST /api/auth/register
// ============================================================
export const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber, address, gender } = req.body;

        // 1. Kiểm tra email đã tồn tại chưa
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email này đã được đăng ký.'
            });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Tạo OTP 6 chữ số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + (parseInt(process.env.OTP_EXPIRY) || 300) * 1000;

        // 4. Lưu tạm vào otpStore
        otpStore.set(email, {
            otp,
            otpExpiry,
            userData: { email, password: hashedPassword, firstName, lastName, phoneNumber, address, gender }
        });

        // 5. Gửi OTP qua email
        console.log(`\n=============================`);
        console.log(`📧 OTP cho ${email}: ${otp}`);
        console.log(`=============================\n`);

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

// ============================================================
// POST /api/auth/verify-otp
// ============================================================
export const verifyOtp = async (req, res) => {
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
        const newUser = await db.User.create({
            ...record.userData,
            roleId: 'R3',
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

// ============================================================
// POST /api/auth/resend-otp
// ============================================================
export const resendOtp = async (req, res) => {
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
        await sendOtpEmail(email, otp);

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