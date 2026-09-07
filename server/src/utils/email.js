const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
  }
  return transporter;
}

function normalizeAttachments(attachments = []) {
  return attachments
    .filter((attachment) => attachment && attachment.filename && attachment.content)
    .map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    }));
}

function brevoAttachments(attachments = []) {
  return normalizeAttachments(attachments).map((attachment) => ({
    name: attachment.filename,
    content: Buffer.isBuffer(attachment.content)
      ? attachment.content.toString('base64')
      : Buffer.from(String(attachment.content)).toString('base64'),
  }));
}

async function sendViaBrevo({ to, subject, html, attachments }) {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), env.EMAIL_SEND_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: env.EMAIL_FROM_NAME, email: env.EMAIL_FROM || env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        attachment: brevoAttachments(attachments),
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message || `Brevo API returned HTTP ${response.status}`);
    }
    return { success: true, messageId: data.messageId };
  } finally {
    clearTimeout(abortTimer);
  }
}

async function sendViaGmailSmtp({ to, subject, html, attachments }) {
  const info = await getTransporter().sendMail({
    from: env.EMAIL_FROM || env.EMAIL_USER,
    to,
    subject,
    html,
    attachments: normalizeAttachments(attachments),
  });
  return { success: true, messageId: info.messageId };
}

function logDevEmail({ to, subject, html, attachments }) {
  console.log('--- [DEV EMAIL — not sent, no email transport configured] ---');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Attachments:', normalizeAttachments(attachments).map((attachment) => attachment.filename).join(', ') || 'none');
  console.log(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log('---------------------------------------------------------');
  return { dev: true, success: true };
}

/**
 * Returns a structured result in all cases and never lets a mail transport
 * delay a user-facing request indefinitely. SMTP has 5-second connection,
 * greeting and socket limits; a final application-level deadline is retained
 * for every provider.
 */
function settleWithTimeout(attempt, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ success: false, error: 'timeout' }), timeoutMs);
    Promise.resolve(attempt)
      .then((result) => finish(result))
      .catch((error) => {
        console.error('Email transport failed:', error.message);
        finish({ success: false, error: error.message });
      });
  });
}

async function sendEmail({ to, subject, html, attachments = [] }) {
  if (!env.BREVO_API_KEY && !(env.EMAIL_USER && env.EMAIL_PASS)) {
    return logDevEmail({ to, subject, html, attachments });
  }

  const attempt = env.BREVO_API_KEY
    ? sendViaBrevo({ to, subject, html, attachments })
    : sendViaGmailSmtp({ to, subject, html, attachments });

  return settleWithTimeout(attempt, env.EMAIL_SEND_TIMEOUT_MS);
}

module.exports = { sendEmail };
