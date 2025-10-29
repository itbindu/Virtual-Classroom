const nodemailer = require('nodemailer');
require('dotenv').config();  // Use environment variables for sensitive info

const sendEmail = async (to, subject, text) => {
  // Create a transporter object using Gmail service and authentication
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Gmail service
    auth: {
      user: process.env.EMAIL_USER, // Use an environment variable for email user
      pass: process.env.EMAIL_PASS, // Use an environment variable for email password
    },
  });

  // Set up the mail options
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email address
    to, // Receiver's email address
    subject, // Subject of the email
    text, // Body of the email (plain text)
  };

  try {
    // Send the email using the transporter
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response); // Log the response to check if email is sent
  } catch (error) {
    console.error('Error sending email:', error); // Log any errors that occur
  }
};

module.exports = { sendEmail };