import nodemailer from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  MAIL_CONFIGURED,
} from '../config/env.js';

let transporter = null;

const getTransporter = () => {
  if (!MAIL_CONFIGURED) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
};

export const isMailConfigured = () => MAIL_CONFIGURED;

/**
 * Send the one-time password reset link. Returns { sent:false } when no SMTP
 * credentials are configured so the caller can fall back gracefully.
 */
export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const tx = getTransporter();
  if (!tx) return { sent: false, reason: 'smtp-not-configured' };

  const greeting = name ? `Hi ${name},` : 'Hello,';

  await tx.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Reset your ElegAI password',
    text: [
      greeting,
      '',
      'We received a request to reset your ElegAI password.',
      'Open the link below within 1 hour to choose a new password:',
      '',
      resetUrl,
      '',
      "If you didn't request this, you can safely ignore this email.",
      '',
      '— ElegAI',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2b2b2b">
        <h2 style="font-family:Georgia,serif;color:#1f1f1f">Reset your ElegAI password</h2>
        <p>${greeting}</p>
        <p>We received a request to reset your ElegAI password. This link expires in 1 hour.</p>
        <p style="margin:28px 0">
          <a href="${resetUrl}"
             style="background:#c9a227;color:#1f1f1f;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block">
            Choose a new password
          </a>
        </p>
        <p style="font-size:13px;color:#666">Or paste this link into your browser:<br>
          <span style="word-break:break-all">${resetUrl}</span>
        </p>
        <p style="font-size:13px;color:#666">If you didn't request this, you can safely ignore this email.</p>
        <p style="font-size:13px;color:#999">— ElegAI</p>
      </div>
    `,
  });

  return { sent: true };
};
