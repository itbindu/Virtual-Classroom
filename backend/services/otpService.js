const crypto = require('crypto');
const { sendEmail } = require('./emailService');

let otpStorage = {}; // In-memory storage; consider Redis in production

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

/**
 * Sends an OTP email to the user
 * @param {string} email - User's email address
 * @param {string} otp - The OTP to send
 * @returns {Promise<boolean>} - Success status of email sending
 */
const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
    };
    const result = await sendEmail(email, mailOptions.subject, mailOptions.text);
    return result.success;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

/**
 * Generates and sends an OTP to the user's email
 * @param {string} email - User's email address
 * @returns {Object} - { success: boolean, message: string }
 */
const generateAndSendOtp = async (email) => {
  try {
    const otp = generateOTP();
    const sent = await sendOtpEmail(email, otp);
    if (sent) {
      otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
      return { success: true, message: 'OTP sent successfully!' };
    }
    return { success: false, message: 'Failed to send OTP. Please try again.' };
  } catch (error) {
    console.error('OTP generation/sending error:', error);
    return { success: false, message: 'Server error while sending OTP.' };
  }
};

/**
 * Verifies the provided OTP against the stored one
 * @param {string} email - User's email address
 * @param {string} userOtp - OTP provided by the user
 * @returns {Object} - { success: boolean, message: string }
 */
const verifyOtp = (email, userOtp) => {
  const storedOtpDetails = otpStorage[email];
  if (!storedOtpDetails) return { success: false, message: 'OTP not found or expired.' };
  
  const { otp, expiresAt } = storedOtpDetails;
  if (Date.now() > expiresAt) {
    delete otpStorage[email];
    return { success: false, message: 'OTP has expired.' };
  }
  
  if (userOtp === otp) {
    delete otpStorage[email];
    return { success: true, message: 'OTP verified successfully!' };
  }
  return { success: false, message: 'Invalid OTP.' };
};

module.exports = { generateAndSendOtp, verifyOtp };