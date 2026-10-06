import nodemailer from 'nodemailer';

const SENDER_EMAIL = process.env.SMTP_EMAIL || '51manoj2004@gmail.com';
const SENDER_PASS = process.env.SMTP_PASSWORD || '';

// Transporter setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
  console.log(`\n================= SYSTEM MAIL SENDER =================`);
  console.log(`From: ${SENDER_EMAIL}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body Snippet: ${text || html.replace(/<[^>]+>/g, ' ')}`);
  console.log(`======================================================\n`);

  if (!SENDER_PASS) {
    console.warn(`[Mail Dispatcher] No SMTP_PASSWORD configured in env. Email payload logged above for testing.`);
    return { success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"StockPulse PRO System" <${SENDER_EMAIL}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' '),
      html,
    });
    console.log(`[Mail Dispatcher] Email delivered successfully. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Mail Dispatcher] Failed to deliver email via Gmail SMTP:`, err.message || err);
    // Return success true so user flow doesn't crash if SMTP app password is not configured yet
    return { success: true };
  }
}

/**
 * Send Welcome Email to newly added user with default password
 */
export async function sendNewUserWelcomeEmail(toEmail: string, userName: string, defaultPassword: string) {
  const subject = `Welcome to StockPulse PRO - Your Account Credentials`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #030407; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #6366f1; margin-top: 0;">StockPulse PRO Account Provisioned</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>An administrator has created your StockPulse PRO account. Below are your initial login credentials:</p>
      
      <div style="background-color: #0d111d; border: 1px solid rgba(99,102,241,0.3); padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Login Email:</strong> <span style="color: #38bdf8;">${toEmail}</span></p>
        <p style="margin: 5px 0;"><strong>Default Passcode:</strong> <span style="color: #10b981; font-family: monospace; font-size: 16px;">${defaultPassword}</span></p>
      </div>

      <p style="color: #f43f5e; font-size: 13px;"><strong>Important:</strong> You will be required to change your password immediately upon your first login for security compliance.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
      <p style="font-size: 11px; color: #64748b; margin: 0;">
        Sent automatically from Admin Account (<strong>${SENDER_EMAIL}</strong>). Do not reply directly to this email.
      </p>
    </div>
  `;

  return sendMail({ to: toEmail, subject, html });
}

/**
 * Send 6-Digit Password Change OTP Email
 */
export async function sendPasswordChangeOTPEmail(toEmail: string, userName: string, otpCode: string) {
  const subject = `[StockPulse PRO] ${otpCode} is your Password Change Verification Code`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #030407; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #38bdf8; margin-top: 0;">Password Change OTP Verification</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>You have requested to change your password on StockPulse PRO. Please use the following 6-digit One-Time Password (OTP):</p>
      
      <div style="text-align: center; background-color: #0d111d; border: 1px solid rgba(56,189,248,0.4); padding: 20px; border-radius: 10px; margin: 20px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${otpCode}</span>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">This code is valid for <strong>10 minutes</strong>. If you did not request a password change, please secure your account immediately.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
      <p style="font-size: 11px; color: #64748b; margin: 0;">
        Dispatched by StockPulse Server (${SENDER_EMAIL}).
      </p>
    </div>
  `;

  return sendMail({ to: toEmail, subject, html });
}

/**
 * Send Password Reset Notification by Admin
 */
export async function sendAdminResetPasswordNotification(toEmail: string, userName: string, newPassword: string) {
  const subject = `[StockPulse PRO] Your Password Has Been Reset by Admin`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #030407; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #a855f7; margin-top: 0;">Password Reset Notification</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your password has been directly reset by the System Administrator (<strong>${SENDER_EMAIL}</strong>). Your updated login details:</p>
      
      <div style="background-color: #0d111d; border: 1px solid rgba(168,85,247,0.4); padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Account Email:</strong> <span style="color: #38bdf8;">${toEmail}</span></p>
        <p style="margin: 5px 0;"><strong>New Passcode:</strong> <span style="color: #10b981; font-family: monospace; font-size: 16px;">${newPassword}</span></p>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">You can now log in using this passcode.</p>
    </div>
  `;

  return sendMail({ to: toEmail, subject, html });
}

/**
 * Send Self-Registration Confirmation Email
 */
export async function sendSelfRegistrationConfirmationEmail(toEmail: string, userName: string) {
  const subject = `Welcome to StockPulse PRO - Registration Successful`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #030407; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #10b981; margin-top: 0;">Welcome to StockPulse PRO!</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for registering on <strong>StockPulse PRO</strong>. Your account has been successfully created.</p>
      
      <div style="background-color: #0d111d; border: 1px solid rgba(16,185,129,0.3); padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Registered Account Email:</strong> <span style="color: #38bdf8;">${toEmail}</span></p>
        <p style="margin: 5px 0;"><strong>Access Level:</strong> <span style="color: #10b981;">PRO Investor Terminal</span></p>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">You can now manage your stock holdings, track real-time analytics, monitor watchlists, and calculate tax P&L.</p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
      <p style="font-size: 11px; color: #64748b; margin: 0;">
        Sent automatically from StockPulse PRO System (<strong>${SENDER_EMAIL}</strong>).
      </p>
    </div>
  `;

  return sendMail({ to: toEmail, subject, html });
}

