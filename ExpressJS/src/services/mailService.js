const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const isMockEmail = String(process.env.EMAIL_MOCK || "").toLowerCase() === "true";

const transporter = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: Number(process.env.EMAIL_PORT || 587),
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD
	}
});

const sendPasswordResetEmail = async (email, otp, firstName = "User") => {
	if (isMockEmail) {
		console.log(`[MOCK EMAIL] To: ${email} | OTP: ${otp} | Name: ${firstName}`);
		return;
	}

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h2 style="color: #333;">Dat lai mat khau</h2>
			<p>Xin chao ${firstName},</p>
			<p>Su dung ma OTP duoi day de dat lai mat khau cua ban:</p>

			<div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
				<h1 style="color: #28a745; letter-spacing: 5px; margin: 0;">${otp}</h1>
			</div>

			<p><strong>Luu y:</strong> Ma OTP het han sau 5 phut.</p>
			<p style="color: #666; font-size: 12px;">Neu ban khong yeu cau, hay bo qua email nay.</p>
		</div>
	`;

	await transporter.sendMail({
		from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
		to: email,
		subject: "[OTP] Dat lai mat khau",
		html: htmlContent
	});
};

const testEmailConnection = async () => {
	if (isMockEmail) {
		return true;
	}

	try {
		await transporter.verify();
		return true;
	} catch (error) {
		console.error("Email service error:", error);
		return false;
	}
};

module.exports = {
	sendPasswordResetEmail,
	testEmailConnection,
	transporter
};
