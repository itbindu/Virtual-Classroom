const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ Email transporter error:', err);
    process.exit(1);
  } else {
    console.log('✅ Email transporter ready');
  }
});

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
    return { success: true, message: 'Email sent successfully', info };
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    return { success: false, message: 'Failed to send email', error: err.message };
  }
};

module.exports = { sendEmail };