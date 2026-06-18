// ============================================================
//  services/emailService.js — Nodemailer Gmail SMTP Service
//  Handles quote PDF emails and contact form notifications
// ============================================================
const nodemailer = require('nodemailer');

// ── Transporter (Gmail SMTP) ──────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup (non-fatal)
transporter.verify((err) => {
  if (err) {
    console.warn('⚠️  Email transporter not ready:', err.message);
    console.warn('   → Check EMAIL_USER and EMAIL_PASS in your .env file.');
  } else {
    console.log('✅  Email transporter ready — Gmail SMTP connected.');
  }
});

// ── Shared constants ──────────────────────────────────────────
const RECIPIENTS = process.env.RECIPIENT_EMAIL || 'inyathimz@gmail.com';
const COMPANY    = process.env.COMPANY_NAME    || 'Inyathi-Mz Medical Supplies';
const PHONE      = process.env.COMPANY_PHONE   || '+258 84 394 1017';
const ADDRESS    = process.env.COMPANY_ADDRESS || 'Av. Emilia Dausse, nº.48, Maputo, Mozambique';
const RECIPIENT_LIST = RECIPIENTS.split(',').map((email) => email.trim()).filter(Boolean);
const RECIPIENT_FOOTER = RECIPIENT_LIST.map((email) => `<a href="mailto:${email}">${email}</a>`).join(' &nbsp;|&nbsp; ');

// ── Category label map ────────────────────────────────────────
function formatCategory(slug) {
  const map = {
    medicines: 'Prescription Medicines',
    otc:       'OTC Medications',
    vaccines:  'Vaccines & Biologics',
    equipment: 'Medical Equipment',
    surgical:  'Surgical Supplies',
    ppe:       'PPE & Safety',
    hygiene:   'Hygiene Products',
    other:     'Other',
  };
  return map[slug] || slug || '—';
}

// ── Shared HTML email wrapper ─────────────────────────────────
function htmlWrapper(title, bodyContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7f6; color: #2d3748; }
    .wrapper { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a6b3c 0%, #2e9e5e 100%); padding: 36px 40px 28px; }
    .header-logo { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 2px; }
    .header-tagline { font-size: 11px; color: rgba(255,255,255,0.75); margin-top: 4px; letter-spacing: 0.5px; }
    .header-title { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 20px; }
    .body { padding: 36px 40px; }
    .section-label { font-size: 10px; font-weight: 700; color: #1a6b3c; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .info-table td { padding: 10px 14px; font-size: 13.5px; border-bottom: 1px solid #e8f5ee; vertical-align: top; }
    .info-table td:first-child { font-weight: 600; color: #1a6b3c; width: 38%; background: #f0faf4; white-space: nowrap; }
    .info-table td:last-child { color: #2d3748; }
    .details-box { background: #f7fafc; border-left: 4px solid #1a6b3c; border-radius: 0 6px 6px 0; padding: 16px 20px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.7; color: #2d3748; white-space: pre-wrap; }
    .ref-badge { display: inline-block; background: #1a6b3c; color: #ffffff; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; margin-bottom: 20px; }
    .divider { border: none; border-top: 1px solid #e8f5ee; margin: 24px 0; }
    .note-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 14px 18px; font-size: 12.5px; color: #92400e; margin-bottom: 24px; }
    .footer { background: #1a6b3c; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 11.5px; color: rgba(255,255,255,0.7); line-height: 1.8; }
    .footer a { color: rgba(255,255,255,0.9); text-decoration: none; }
    .action-btn { display: inline-block; background: #2e9e5e; color: #ffffff !important; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none; margin-top: 8px; }
  </style>
</head>
<body>
  <div style="padding: 24px 16px; background: #f4f7f6;">
    <div class="wrapper">
      ${bodyContent}
    </div>
    <p style="text-align:center; font-size:11px; color:#a0aec0; margin-top:16px;">
      This is an automated notification from ${COMPANY}
    </p>
  </div>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════
//  sendQuoteEmail — sends PDF quote to Inyathi inbox
// ════════════════════════════════════════════════════════════
/**
 * @param {Object} quoteData  — all quote fields + quote_reference
 * @param {Buffer} pdfBuffer  — generated PDF buffer from pdfService
 */
async function sendQuoteEmail(quoteData, pdfBuffer) {
  const {
    full_name, institution, email, phone,
    product_category, estimated_quantity,
    product_details, quote_reference,
  } = quoteData;

  const subject = `[Quote Request] ${quote_reference} — ${institution || full_name}`;

  const htmlBody = htmlWrapper('New Quote Request — Inyathi-Mz', `
    <div class="header">
      <div class="header-logo">INYATHI-MZ</div>
      <div class="header-tagline">Medical Supplies &amp; Pharmaceutical Distribution</div>
      <div class="header-title">📋 New Quote Request Received</div>
    </div>

    <div class="body">
      <span class="ref-badge">${quote_reference}</span>

      <p class="section-label">Client Information</p>
      <table class="info-table">
        <tr><td>Full Name</td><td>${full_name}</td></tr>
        <tr><td>Institution</td><td>${institution || '—'}</td></tr>
        <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td>Phone</td><td>${phone || '—'}</td></tr>
      </table>

      <p class="section-label">Product Requirements</p>
      <table class="info-table">
        <tr><td>Category</td><td>${formatCategory(product_category)}</td></tr>
        <tr><td>Est. Quantity</td><td>${estimated_quantity || 'Not specified'}</td></tr>
      </table>

      <p class="section-label">Product Details &amp; Special Requirements</p>
      <div class="details-box">${product_details || 'No details provided.'}</div>

      <hr class="divider" />

      <div class="note-box">
        📎 <strong>A professional PDF quote document is attached</strong> to this email for your records and to share with the client.
      </div>

      <p style="font-size:13px; color:#718096; line-height:1.7;">
        Please respond to this quote request within <strong>24 business hours</strong>.
        You can reply directly to the client at <a href="mailto:${email}" style="color:#1a6b3c;">${email}</a>.
      </p>
    </div>

    <div class="footer">
      <p>
        <strong style="color:#fff;">${COMPANY}</strong><br />
        ${ADDRESS}<br />
        <a href="tel:${PHONE}">${PHONE}</a> &nbsp;|&nbsp;
        ${RECIPIENT_FOOTER}
      </p>
    </div>
  `);

  const mailOptions = {
    from:        `"${COMPANY}" <${process.env.EMAIL_USER}>`,
    to:          RECIPIENT_LIST,
    replyTo:     email,
    subject,
    html:        htmlBody,
    attachments: [
      {
        filename:    `Quote-${quote_reference}.pdf`,
        content:     pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧  Quote email sent → ${RECIPIENT_LIST.join(', ')} | Ref: ${quote_reference}`);
}

// ════════════════════════════════════════════════════════════
//  sendContactEmail — sends contact form message to Inyathi inbox
// ════════════════════════════════════════════════════════════
/**
 * @param {Object} contactData — full_name, institution, email, phone, subject, message
 */
async function sendContactEmail(contactData) {
  const {
    full_name, institution, email, phone, subject, message,
  } = contactData;

  const emailSubject = `[Contact Form] ${subject} — ${full_name}`;

  const htmlBody = htmlWrapper('New Contact Message — Inyathi-Mz', `
    <div class="header">
      <div class="header-logo">INYATHI-MZ</div>
      <div class="header-tagline">Medical Supplies &amp; Pharmaceutical Distribution</div>
      <div class="header-title">✉️ New Contact Form Message</div>
    </div>

    <div class="body">
      <p class="section-label">Sender Information</p>
      <table class="info-table">
        <tr><td>Full Name</td><td>${full_name}</td></tr>
        <tr><td>Institution</td><td>${institution || '—'}</td></tr>
        <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td>Phone</td><td>${phone || '—'}</td></tr>
        <tr><td>Subject</td><td><strong>${subject}</strong></td></tr>
      </table>

      <p class="section-label">Message</p>
      <div class="details-box">${message || 'No message content.'}</div>

      <hr class="divider" />

      <p style="font-size:13px; color:#718096; line-height:1.7; margin-bottom:16px;">
        Reply directly to this enquiry by clicking the button below or emailing
        <a href="mailto:${email}" style="color:#1a6b3c;">${email}</a>.
      </p>

      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" class="action-btn">
        ↩ Reply to ${full_name}
      </a>
    </div>

    <div class="footer">
      <p>
        <strong style="color:#fff;">${COMPANY}</strong><br />
        ${ADDRESS}<br />
        <a href="tel:${PHONE}">${PHONE}</a> &nbsp;|&nbsp;
        ${RECIPIENT_FOOTER}
      </p>
    </div>
  `);

  const mailOptions = {
    from:    `"${COMPANY}" <${process.env.EMAIL_USER}>`,
    to:      RECIPIENT_LIST,
    replyTo: email,
    subject: emailSubject,
    html:    htmlBody,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧  Contact email sent → ${RECIPIENT_LIST.join(', ')} | From: ${full_name} <${email}>`);
}

module.exports = { sendQuoteEmail, sendContactEmail };
