const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 2525,
  auth: {
    user: process.env.Email_USER,
    pass: process.env.Email_PASSWORD,
  },
});

module.exports = transporter;
