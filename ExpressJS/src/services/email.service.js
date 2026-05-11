import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    }
});

export const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: `"Xác thực tài khoản" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Mã OTP xác thực đăng ký tài khoản',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4A90E2;">Xác thực tài khoản</h2>
                <p>Xin chào,</p>
                <p>Mã OTP của bạn là:</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333; text-align: center; padding: 16px; background: #f5f5f5; border-radius: 6px;">
                    ${otp}
                </div>
                <p style="color: #888; margin-top: 16px;">Mã có hiệu lực trong <b>${process.env.OTP_EXPIRY / 60 || 5} phút</b>.</p>
                <p style="color: #888;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};