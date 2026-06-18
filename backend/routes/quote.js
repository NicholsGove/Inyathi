// ============================================================
//  routes/quote.js — Quote request submissions (pricing.html)
// ============================================================
const express  = require('express');
const { body, validationResult } = require('express-validator');
const db             = require('../db');
const { generateQuotePDF } = require('../services/pdfService');
const { sendQuoteEmail }   = require('../services/emailService');

const router = express.Router();

// ── Validation rules ─────────────────────────────────────────
const quoteValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 150 }),

  body('institution')
    .trim()
    .notEmpty().withMessage('Institution / Organization is required')
    .isLength({ max: 200 }),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ max: 30 }),

  body('product_category')
    .trim()
    .notEmpty().withMessage('Product category is required'),

  body('product_details')
    .trim()
    .notEmpty().withMessage('Product details / requirements are required'),

  // Optional
  body('estimated_quantity')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),
];

// ── Valid category slugs (matches product_categories table) ──
const VALID_CATEGORIES = ['medicines', 'otc', 'vaccines', 'equipment', 'surgical', 'ppe', 'hygiene', 'other'];

// ── POST /api/quote ───────────────────────────────────────────
router.post('/', quoteValidation, async (req, res) => {
  // 1. Validation check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array(),
    });
  }

  const {
    full_name,
    institution,
    email,
    phone,
    product_category,
    estimated_quantity,
    product_details,
  } = req.body;

  const ip_address = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                  || req.socket?.remoteAddress
                  || null;
  const user_agent = req.headers['user-agent'] || null;

  // 2. Resolve product_category_id from the product_categories table
  let product_category_id   = null;
  let product_category_other = null;

  if (product_category === 'other') {
    product_category_other = product_details.substring(0, 100);
  } else {
    // Map form values to DB slugs
    const slugMap = {
      medicines: 'medicines',
      otc:       'medicines',   // OTC falls under medicines category
      vaccines:  'medicines',   // Vaccines fall under medicines category
      equipment: 'equipment',
      surgical:  'consumables', // Surgical supplies → consumables
      ppe:       'ppe',
      hygiene:   'hygiene',
    };
    const dbSlug = slugMap[product_category] || null;
    if (dbSlug) {
      try {
        const [rows] = await db.execute(
          'SELECT id FROM product_categories WHERE slug = ? LIMIT 1',
          [dbSlug]
        );
        if (rows.length > 0) product_category_id = rows[0].id;
      } catch (_) { /* non-critical — proceed without category id */ }
    }
  }

  // 3. Generate a quote reference number: QR-YYYYMMDD-XXXXX
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.floor(10000 + Math.random() * 90000);
  const quote_reference = `QR-${datePart}-${randPart}`;

  try {
    const [result] = await db.execute(
      `INSERT INTO quote_requests
         (full_name, institution, email, phone,
          product_category_id, product_category_other,
          estimated_quantity, product_details,
          ip_address, user_agent, quote_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        institution,
        email,
        phone,
        product_category_id,
        product_category_other,
        estimated_quantity || null,
        product_details,
        ip_address,
        user_agent,
        quote_reference,
      ]
    );

    // 4. Build the full quote data object for PDF & email
    const quoteData = {
      full_name,
      institution,
      email,
      phone,
      product_category,
      estimated_quantity: estimated_quantity || null,
      product_details,
      quote_reference,
      created_at: now,
    };

    // 5. Generate PDF & send email (non-blocking — don't fail the request if email fails)
    setImmediate(async () => {
      try {
        const pdfBuffer = await generateQuotePDF(quoteData);
        await sendQuoteEmail(quoteData, pdfBuffer);
      } catch (emailErr) {
        console.error('⚠️  Quote email/PDF error (non-fatal):', emailErr.message);
      }
    });

    return res.status(201).json({
      success:         true,
      message:         'Quote request received. Our team will respond within 24 business hours.',
      id:              result.insertId,
      quote_reference: quote_reference,
    });

  } catch (err) {
    console.error('Quote insert error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// ── GET /api/quote — list quote requests (admin use) ─────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT qr.id, qr.quote_reference, qr.full_name, qr.institution,
              qr.email, qr.phone,
              pc.name_en AS product_category,
              qr.estimated_quantity,
              LEFT(qr.product_details, 120) AS details_preview,
              qr.status, qr.created_at
       FROM quote_requests qr
       LEFT JOIN product_categories pc ON pc.id = qr.product_category_id
       ORDER BY qr.created_at DESC
       LIMIT 100`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Quote fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
