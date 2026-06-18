// ============================================================
//  routes/products.js — Product catalogue API
// ============================================================
const express = require('express');
const db      = require('../db');

const router = express.Router();

// ── GET /api/products — all active products ──────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;

    let sql = `
      SELECT
        pr.id,
        pc.slug           AS category_slug,
        pc.name_en        AS category_en,
        pr.name_en,
        pr.name_pt,
        pr.description_en,
        pr.description_pt,
        pr.icon_class,
        pr.stock_status,
        pr.is_featured
      FROM products pr
      JOIN product_categories pc ON pc.id = pr.category_id
      WHERE pr.is_active = 1 AND pc.is_active = 1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND pc.slug = ?';
      params.push(category);
    }

    sql += ' ORDER BY pc.sort_order, pr.sort_order';

    const [rows] = await db.execute(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Products fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/products/categories — all active categories ─────
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, slug, name_en, name_pt, icon_class
       FROM product_categories
       WHERE is_active = 1
       ORDER BY sort_order`
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Categories fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/products/:id — single product ───────────────────
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid product ID.' });
  }
  try {
    const [rows] = await db.execute(
      `SELECT pr.*, pc.slug AS category_slug, pc.name_en AS category_en
       FROM products pr
       JOIN product_categories pc ON pc.id = pr.category_id
       WHERE pr.id = ? AND pr.is_active = 1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Product fetch error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
