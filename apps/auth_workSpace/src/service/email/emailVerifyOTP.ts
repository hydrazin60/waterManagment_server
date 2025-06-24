import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  [key: string]: any;
}

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL,
    pass: process.env.SMTP_PASSWORD || process.env.PASSWORD,
  },
});

export const sendEmail = async (mailOptions: MailOptions): Promise<boolean> => {
  try {
    console.log("📧 Preparing to send email...");
    console.log("➡️ To:", mailOptions.to);
    console.log("📝 Subject:", mailOptions.subject);

    await transporter.sendMail({
      from:
        mailOptions.from ||
        `"Ad Water supply " <${process.env.SMTP_USER || process.env.EMAIL}>`,
      ...mailOptions,
    });

    console.log("✅ Email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
};

export const otpVerificationEmail = async (
  email: string,
  otp: string,
  name: string = "User" // Made name optional with default value
): Promise<boolean> => {
  const subject = "Verify your Email";
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color:rgb(68, 174, 71); margin-bottom: 10px;">Email Verification</h1>
        <p style="color: #555;">Dear ${name}, please use the following OTP to verify your email address</p>
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h2 style="margin: 0; color: #333; letter-spacing: 3px;">${otp}</h2>
      </div>
      
      <p style="color: #777; text-align: center;">This OTP will expire in 10 minutes. Do not share it with anyone.</p>
      
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 14px;">
        <p>If you didn't request this, please ignore this email.</p>
        <p>© ${new Date().getFullYear()} AD Water supply . All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
};
