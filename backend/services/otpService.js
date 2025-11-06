const crypto = require('crypto');
const { sendEmail } = require('./emailService');

let otpStorage = {}; // In-memory storage; consider Redis for production

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

/**
 * Sends an OTP email to the user
 * @param {string} email - User's email address
 * @param {string} otp - The OTP to send
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
const sendOtpEmail = async (email, otp) => {
  try {
    const subject = 'Your OTP Code';
    const text = `Your OTP code is ${otp}. It is valid for 5 minutes.`;

    const result = await sendEmail(email, subject, text);

    if (!result.success) {
      // If sendEmail failed, return the error message
      return { success: false, error: result.error || 'Unknown email sending error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generates and sends an OTP to the user's email
 * @param {string} email - User's email address
 * @returns {Object} - { success: boolean, message: string, error?: string }
 */
const generateAndSendOtp = async (email) => {
  try {
    const otp = generateOTP();
    const sent = await sendOtpEmail(email, otp);

    if (sent.success) {
      otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
      return { success: true, message: 'OTP sent successfully!' };
    }

    // Return the actual error from sendEmail
    return { success: false, message: 'Failed to send OTP.', error: sent.error };
  } catch (error) {
    console.error('OTP generation/sending error:', error);
    return { success: false, message: 'Server error while sending OTP.', error: error.message };
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
