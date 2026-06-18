// ============================================================
//  server.js — Inyathi-Mz Express API Server
// ============================================================
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// ── Route modules ─────────────────────────────────────────────
const contactRoutes  = require('./routes/contact');
const quoteRoutes    = require('./routes/quote');
const productRoutes  = require('./routes/products');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:  process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve static frontend files ───────────────────────────────
// Serves index.html, about.html, products.html, etc. from the
// project root (one level up from /backend)
app.use(express.static(path.join(__dirname, '..')));

// Root route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/contact',  contactRoutes);
app.use('/api/quote',    quoteRoutes);
app.use('/api/products', productRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:  'ok',
    service: 'Inyathi-Mz API',
    time:    new Date().toISOString(),
  });
});

// ── 404 handler for unknown API routes ───────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Inyathi-Mz Backend Server                  ║');
  console.log(`║   Running at: http://localhost:${PORT}          ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║   API Endpoints:                             ║');
  console.log('║   GET  /api/health                           ║');
  console.log('║   POST /api/contact                          ║');
  console.log('║   POST /api/quote                            ║');
  console.log('║   GET  /api/products                         ║');
  console.log('║   GET  /api/products/categories              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
