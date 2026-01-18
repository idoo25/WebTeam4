import nodemailer from "nodemailer";

let transporter = null;

/**
 * Gets or creates a reusable nodemailer transporter instance
 * Uses connection pooling to avoid recreating transporter on each email
 */
function getMailTransporter() {
  if (transporter) {
    return transporter;
  }

  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASS;

  if (!mailUser || !mailPass) {
    console.error("Missing MAIL_USER or MAIL_PASS environment variables");
    throw new Error(
      "Email configuration is incomplete. Please set MAIL_USER and MAIL_PASS environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPass,
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
  });

  return transporter;
}

/**
 * Sends an email using the configured transporter
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 * @returns {Promise<void>}
 */
export async function sendMail(to, subject, text) {
  try {
    const transporter = getMailTransporter();

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
    });

    console.log(`Email sent successfully to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
    throw err;
  }
}
