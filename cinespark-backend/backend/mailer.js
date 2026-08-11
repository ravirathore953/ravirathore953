const nodemailer = require("nodemailer");

const smtpConfigured = Boolean(process.env.SMTP_HOST);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    })
  : null;

/**
 * Sends a "new lead" notification email. Never throws — logs and resolves
 * false on failure so a broken mail server never breaks lead submission.
 */
async function sendLeadNotification(lead) {
  if (!transporter) {
    console.log("[mailer] SMTP not configured — skipping email, lead was still saved.");
    return false;
  }

  const to = process.env.NOTIFY_EMAIL_TO;
  if (!to) {
    console.log("[mailer] NOTIFY_EMAIL_TO not set — skipping email.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"CineSpark Leads" <${process.env.SMTP_USER}>`,
      to,
      replyTo: lead.email,
      subject: `New lead: ${lead.organization} (${lead.service})`,
      text: [
        `Name: ${lead.name}`,
        `Organization: ${lead.organization}`,
        `Email: ${lead.email}`,
        `Service needed: ${lead.service}`,
        `Message: ${lead.message || "(none)"}`,
      ].join("\n"),
      html: `
        <h2 style="font-family:sans-serif">New CineSpark lead</h2>
        <table style="font-family:sans-serif;font-size:14px">
          <tr><td><b>Name</b></td><td>${escapeHtml(lead.name)}</td></tr>
          <tr><td><b>Organization</b></td><td>${escapeHtml(lead.organization)}</td></tr>
          <tr><td><b>Email</b></td><td>${escapeHtml(lead.email)}</td></tr>
          <tr><td><b>Service</b></td><td>${escapeHtml(lead.service)}</td></tr>
          <tr><td><b>Message</b></td><td>${escapeHtml(lead.message || "(none)")}</td></tr>
        </table>
      `,
    });
    return true;
  } catch (err) {
    console.error("[mailer] Failed to send notification email:", err.message);
    return false;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { sendLeadNotification };
