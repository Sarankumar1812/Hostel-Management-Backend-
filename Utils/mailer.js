import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transport = nodemailer.createTransport({
  service: "Gmail",
    auth: {
      user: process.env.PASS_MAIL,
      pass: process.env.PASS_KEY
  }
 
});

const sendEmail = async (to, subject, html="", text="", attachments = []) => {
  const mailOptions = {
      from: process.env.PASS_MAIL,
      to,
      subject,
      html,
      text,
      attachments
  };
  return transport.sendMail(mailOptions)
};

export default sendEmail;