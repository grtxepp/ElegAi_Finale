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

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));

/**
 * Send a one-time 6-digit password reset code. We deliberately email a code
 * (not a link) so the flow works even when the public app URL changes.
 * Returns { sent:false } when no SMTP credentials are configured.
 */
export const sendPasswordResetCodeEmail = async ({ to, name, code, expiresMinutes = 15 }) => {
  const tx = getTransporter();
  if (!tx) return { sent: false, reason: 'smtp-not-configured' };

  const greeting = name ? `Hi ${name},` : 'Hello,';

  await tx.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Your ElegAI password reset code',
    text: [
      greeting,
      '',
      'We received a request to reset your ElegAI password.',
      `Your reset code is: ${code}`,
      '',
      `It expires in ${expiresMinutes} minutes.`,
      'Open the app, choose "Reset password", and enter this code with your new password.',
      '',
      "If you didn't request this, you can safely ignore this email.",
      '',
      'ElegAI',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2b2b2b">
        <h2 style="font-family:Georgia,serif;color:#1f1f1f">Reset your ElegAI password</h2>
        <p>${escapeHtml(greeting)}</p>
        <p>We received a request to reset your ElegAI password. Enter this code in the app:</p>
        <p style="margin:26px 0;font-size:34px;font-weight:bold;letter-spacing:10px;color:#1f1f1f;background:#faf6ec;border:1px solid #eadfc2;border-radius:12px;padding:18px 22px;text-align:center">
          ${code}
        </p>
        <p>This code expires in <strong>${expiresMinutes} minutes</strong> and can be used only once.</p>
        <p style="font-size:13px;color:#666">If you didn't request this, you can safely ignore this email.</p>
        <p style="font-size:13px;color:#999">ElegAI</p>
      </div>
    `,
  });

  return { sent: true };
};
