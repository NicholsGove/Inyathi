// ============================================================
//  services/pdfService.js — Professional PDF Quote Generator
//  Uses PDFKit to produce a branded Inyathi-Mz quote PDF
// ============================================================
const PDFDocument = require('pdfkit');
const path        = require('path');
const fs          = require('fs');

// ── Brand colours ─────────────────────────────────────────────
const BRAND = {
  primary:    '#1a6b3c',   // deep green
  secondary:  '#2e9e5e',   // mid green
  accent:     '#f0faf4',   // light green tint
  dark:       '#0d1f14',   // near-black
  text:       '#2d3748',   // body text
  muted:      '#718096',   // muted text
  border:     '#c6e6d4',   // light green border
  white:      '#ffffff',
  lightGray:  '#f7fafc',
  tableHead:  '#1a6b3c',
  tableAlt:   '#f0faf4',
};

// ── Helpers ───────────────────────────────────────────────────
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  });
}

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
  return map[slug] || slug;
}

// ── Main export ───────────────────────────────────────────────
/**
 * generateQuotePDF(quoteData) → Promise<Buffer>
 *
 * @param {Object} quoteData
 *   full_name, institution, email, phone,
 *   product_category, estimated_quantity, product_details,
 *   quote_reference, created_at
 */
function generateQuotePDF(quoteData) {
  return new Promise((resolve, reject) => {
    try {
      const doc    = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
      const chunks = [];

      doc.on('data',  chunk => chunks.push(chunk));
      doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
      doc.on('error', err   => reject(err));

      const W  = doc.page.width;   // 595.28
      const H  = doc.page.height;  // 841.89
      const M  = 50;               // side margin
      const CW = W - M * 2;       // content width

      const now      = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + 30);

      // ══════════════════════════════════════════════════════
      //  1. HEADER BAND
      // ══════════════════════════════════════════════════════
      // Green header background
      doc.rect(0, 0, W, 130).fill(BRAND.primary);

      // Decorative accent strip
      doc.rect(0, 125, W, 8).fill(BRAND.secondary);

      // Company name
      doc.font('Helvetica-Bold')
         .fontSize(26)
         .fillColor(BRAND.white)
         .text('INYATHI-MZ', M, 30, { characterSpacing: 2 });

      // Tagline
      doc.font('Helvetica')
         .fontSize(10)
         .fillColor('rgba(255,255,255,0.8)')
         .text('Medical Supplies & Pharmaceutical Distribution', M, 62);

      // Address line
      doc.font('Helvetica')
         .fontSize(8.5)
         .fillColor('rgba(255,255,255,0.65)')
         .text(
           `${process.env.COMPANY_ADDRESS || 'Av. Emilia Dausse, nº.48, Maputo, Mozambique'}   |   ${process.env.COMPANY_PHONE || '+258 84 394 1017'}   |   ${process.env.EMAIL_USER || 'inyathimz@gmail.com'}`,
           M, 80
         );

      // "QUOTATION REQUEST" label — right side
      doc.font('Helvetica-Bold')
         .fontSize(18)
         .fillColor(BRAND.white)
         .text('QUOTATION REQUEST', 0, 38, { align: 'right', width: W - M });

      // ══════════════════════════════════════════════════════
      //  2. REFERENCE BANNER
      // ══════════════════════════════════════════════════════
      const bannerY = 148;
      doc.rect(M, bannerY, CW, 52).fill(BRAND.accent).stroke(BRAND.border);

      // Reference number
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor(BRAND.primary)
         .text('QUOTE REFERENCE', M + 16, bannerY + 10);

      doc.font('Helvetica-Bold')
         .fontSize(16)
         .fillColor(BRAND.dark)
         .text(quoteData.quote_reference || 'QR-N/A', M + 16, bannerY + 24);

      // Date info — right side
      const dateX = M + CW / 2;
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(BRAND.muted)
         .text('Date Submitted', dateX, bannerY + 10);

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(BRAND.text)
         .text(formatDate(now), dateX, bannerY + 23);

      // Valid until
      const validX = M + (CW * 3) / 4;
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(BRAND.muted)
         .text('Valid Until', validX, bannerY + 10);

      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor(BRAND.text)
         .text(formatDate(validUntil), validX, bannerY + 23);

      // ══════════════════════════════════════════════════════
      //  3. CLIENT INFORMATION SECTION
      // ══════════════════════════════════════════════════════
      let y = bannerY + 72;

      // Section header
      _sectionHeader(doc, 'CLIENT INFORMATION', M, y, CW, BRAND);
      y += 28;

      // Two-column client info grid
      const col1X = M + 12;
      const col2X = M + CW / 2 + 12;
      const colW  = CW / 2 - 24;

      const clientFields = [
        { label: 'Full Name',              value: quoteData.full_name    || '—' },
        { label: 'Institution / Organization', value: quoteData.institution || '—' },
        { label: 'Email Address',          value: quoteData.email        || '—' },
        { label: 'Phone Number',           value: quoteData.phone        || '—' },
      ];

      // Draw 2-column grid background
      doc.rect(M, y, CW, 80).fill(BRAND.lightGray);
      doc.rect(M, y, CW, 80).stroke(BRAND.border);
      // Vertical divider
      doc.moveTo(M + CW / 2, y).lineTo(M + CW / 2, y + 80).stroke(BRAND.border);
      // Horizontal divider
      doc.moveTo(M, y + 40).lineTo(M + CW, y + 40).stroke(BRAND.border);

      clientFields.forEach((field, i) => {
        const cx = i % 2 === 0 ? col1X : col2X;
        const cy = y + (i < 2 ? 8 : 48);

        doc.font('Helvetica')
           .fontSize(8)
           .fillColor(BRAND.muted)
           .text(field.label.toUpperCase(), cx, cy);

        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(BRAND.text)
           .text(field.value, cx, cy + 12, { width: colW, ellipsis: true });
      });

      y += 100;

      // ══════════════════════════════════════════════════════
      //  4. PRODUCT REQUIREMENTS SECTION
      // ══════════════════════════════════════════════════════
      _sectionHeader(doc, 'PRODUCT REQUIREMENTS', M, y, CW, BRAND);
      y += 28;

      // Product details table
      const tableRows = [
        { label: 'Product Category',       value: formatCategory(quoteData.product_category) },
        { label: 'Estimated Quantity',      value: quoteData.estimated_quantity || 'Not specified' },
      ];

      tableRows.forEach((row, i) => {
        const rowY  = y + i * 36;
        const bgCol = i % 2 === 0 ? BRAND.white : BRAND.tableAlt;

        doc.rect(M, rowY, CW, 36).fill(bgCol).stroke(BRAND.border);

        // Label column (30% width)
        doc.rect(M, rowY, CW * 0.32, 36).fill(BRAND.tableHead);

        doc.font('Helvetica-Bold')
           .fontSize(9)
           .fillColor(BRAND.white)
           .text(row.label.toUpperCase(), M + 10, rowY + 12, { width: CW * 0.32 - 20 });

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(BRAND.text)
           .text(row.value, M + CW * 0.32 + 12, rowY + 12, { width: CW * 0.68 - 24 });
      });

      y += tableRows.length * 36 + 16;

      // Product Details / Special Requirements (multi-line)
      _sectionHeader(doc, 'PRODUCT DETAILS & SPECIAL REQUIREMENTS', M, y, CW, BRAND);
      y += 28;

      const detailsText = quoteData.product_details || 'No additional details provided.';
      const detailsHeight = Math.max(80, Math.min(200, _estimateTextHeight(detailsText, 10, CW - 32)));

      doc.rect(M, y, CW, detailsHeight + 24).fill(BRAND.white).stroke(BRAND.border);

      doc.font('Helvetica')
         .fontSize(10)
         .fillColor(BRAND.text)
         .text(detailsText, M + 16, y + 12, {
           width:    CW - 32,
           align:    'left',
           lineGap:  3,
         });

      y += detailsHeight + 40;

      /* // ══════════════════════════════════════════════════════
      //  5. NEXT STEPS / INFO BOX
      // ══════════════════════════════════════════════════════
      if (y + 120 > H - 100) {
        doc.addPage();
        y = M;
      }

      doc.rect(M, y, CW, 110).fill(BRAND.accent).stroke(BRAND.border);

      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor(BRAND.primary)
         .text('WHAT HAPPENS NEXT?', M + 16, y + 14);

      const steps = [
        '1.  Our team will review your quote request within 24 business hours.',
        '2.  A dedicated sales representative will contact you with pricing and availability.',
        '3.  We will prepare a formal quotation tailored to your specific requirements.',
        '4.  Upon approval, we will arrange delivery to your location.',
      ];

      doc.font('Helvetica')
         .fontSize(9.5)
         .fillColor(BRAND.text);

      steps.forEach((step, i) => {
        doc.text(step, M + 16, y + 34 + i * 17, { width: CW - 32 });
      });

      y += 130; */

      // ══════════════════════════════════════════════════════
      //  6. FOOTER
      // ══════════════════════════════════════════════════════
      const footerY = H - 70;

      // Footer divider
      doc.rect(0, footerY - 8, W, 1).fill(BRAND.border);

      // Footer green band
      doc.rect(0, H - 50, W, 50).fill(BRAND.primary);

      // Footer text
      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('rgba(255,255,255,0.75)')
         .text(
           `Inyathi-Mz Medical Supplies  |  ${process.env.COMPANY_ADDRESS || 'Av. Emilia Dausse, nº.48, Maputo, Mozambique'}`,
           M, H - 38, { align: 'center', width: CW }
         );

      doc.font('Helvetica')
         .fontSize(8)
         .fillColor('rgba(255,255,255,0.55)')
         .text(
           `Tel: ${process.env.COMPANY_PHONE || '+258 84 394 1017'}  |  Email: ${process.env.EMAIL_USER || 'inyathimz@gmail.com'}  |  This document is auto-generated and for reference purposes only.`,
           M, H - 24, { align: 'center', width: CW }
         );

      // Page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('rgba(255,255,255,0.55)')
           .text(`Page ${i + 1} of ${pageCount}`, W - M - 60, H - 24, { width: 60, align: 'right' });
      }

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

// ── Internal helpers ──────────────────────────────────────────

function _sectionHeader(doc, title, x, y, width, BRAND) {
  doc.rect(x, y, width, 22).fill(BRAND.primary);
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor(BRAND.white)
     .text(title, x + 12, y + 7, { characterSpacing: 1 });
}

function _estimateTextHeight(text, fontSize, width) {
  // Rough estimate: ~0.6 chars per point width, ~1.4 line height multiplier
  const charsPerLine = Math.floor(width / (fontSize * 0.52));
  const lines        = Math.ceil(text.length / charsPerLine);
  return lines * fontSize * 1.6;
}

module.exports = { generateQuotePDF };
