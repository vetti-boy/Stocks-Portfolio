import nodemailer from 'nodemailer';

const SENDER_EMAIL = process.env.SMTP_EMAIL || 'mailfortempusage@gmail.com';
const SENDER_PASS = process.env.SMTP_PASSWORD || 'givd wfuk qibf zckn';

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
      from: `"StockPulse System" <${SENDER_EMAIL}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ' '),
      html,
    });
    console.log(`[Mail Dispatcher] Email delivered successfully. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Mail Dispatcher] Failed to deliver email via Gmail SMTP:`, err.message || err);
    return { success: true };
  }
}
