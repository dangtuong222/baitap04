const dotenv = require("dotenv");

dotenv.config();

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;

const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
	return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

const isOTPExpired = (expiryDate) => {
	return new Date() > new Date(expiryDate);
};

const verifyOTPCode = (inputCode, storedCode) => {
	return inputCode === storedCode;
};

module.exports = {
	generateOTP,
	getOTPExpiry,
	isOTPExpired,
	verifyOTPCode
};
