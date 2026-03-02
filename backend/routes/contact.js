// ============================================================
//  routes/contact.js — Contact form submissions (contact.html)
// ============================================================
const express  = require('express');
const { body, validationResult } = require('express-validator');
const db       = require('../db');

const router = express.Router();

// ── Validation rules ─────────────────────────────────────────
const contactValidation = [
  body('full_name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 150 }).withMessage('Full name must be 150 characters or fewer'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ max: 255 }).withMessage('Subject must be 255 characters or fewer'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required'),

  // Optional fields
  body('institution')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 }),
];

// ── POST /api/contact ─────────────────────────────────────────
router.post('/', contactValidation, async (req, res) => {
  // 1. Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array(),
    });
  }

  const { full_name, institution, email, phone, subject, message } = req.body;

  // Capture request metadata
  const ip_address = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                  || req.socket?.remoteAddress
                  || null;
  const user_agent = req.headers['user-agent'] || null;

  try {
    const [result] = await db.execute(
      `INSERT INTO contact_messages
         (full_name, institution, email, phone, subject, message, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        institution || null,
        email,
        phone       || null,
        subject,
        message,
        ip_address,
        user_agent,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Your message has been received. We will respond within 24 business hours.',
      id:      result.insertId,
    });

  } catch (err) {
    console.error('Contact insert error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
});

// ── GET /api/contact — list messages (admin use) ──────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, full_name, institution, email, phone, subject,
              LEFT(message, 100) AS message_preview,
              status, created_at
       FROM contact_messages
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Contact fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
