const nodemailer = require('nodemailer');
require('dotenv').config();

(async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to yourself
      subject: 'Test Email from Node.js',
      text: 'If you see this, Gmail is working fine!',
    });
    console.log('✅ Email sent successfully:', info.response);
  } catch (err) {
    console.error('❌ Email send error:', err);
  }
})();
