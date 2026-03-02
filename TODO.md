# Inyathi-Mz Database SQL File — TODO

## Tasks

- [x] Read and analyze all website pages (index, products, services, pricing, contact, about)
- [x] Identify all data entities from the website
- [x] Plan database schema (12 tables)
- [x] Confirm MySQL dialect with user
- [x] Create `database/inyathi_mz.sql` with:
  - [x] `provinces` table
  - [x] `product_categories` table
  - [x] `products` table
  - [x] `services` table
  - [x] `client_types` table
  - [x] `clients` table
  - [x] `contact_messages` table
  - [x] `quote_requests` table
  - [x] `quote_request_items` table
  - [x] `orders` table
  - [x] `order_items` table
  - [x] `admin_users` table
  - [x] Seed data for all lookup/reference tables
  - [x] Indexes and foreign key constraints
  - [x] 4 useful views (v_pending_quotes, v_unread_contacts, v_active_orders, v_product_catalogue)

## ✅ All tasks complete

---

## Backend Database Connection Tasks

- [x] Import `database/inyathi_mz.sql` into MySQL (inyathi_mz database created)
- [x] Create `backend/.env` with DB credentials
- [x] Create `backend/db.js` — MySQL connection pool (mysql2)
- [x] Create `backend/routes/contact.js` — POST /api/contact (saves to contact_messages)
- [x] Create `backend/routes/quote.js` — POST /api/quote (saves to quote_requests)
- [x] Create `backend/routes/products.js` — GET /api/products, /api/products/categories
- [x] Create `backend/server.js` — Express server serving static files + API
- [x] Install npm dependencies (express, mysql2, cors, dotenv, express-validator)
- [x] Update `js/main.js` forms to POST to backend API with loading state + error handling
- [x] Tested all endpoints:
  - [x] GET  /api/health → 200 OK
  - [x] GET  /api/products/categories → 5 categories returned
  - [x] POST /api/contact → saved to DB (id: 1)
  - [x] POST /api/quote → saved to DB with reference QR-20260225-40716
  - [x] POST /api/contact (empty) → 422 validation errors returned correctly

## ✅ Backend fully connected to MySQL database

---

## Frontend Reorganisation Tasks

- [x] Moved all frontend files (HTML pages, CSS, JS) into `frontend/` directory:
  - `frontend/index.html`, `frontend/about.html`, `frontend/contact.html`
  - `frontend/pricing.html`, `frontend/products.html`, `frontend/services.html`
  - `frontend/css/styles.css`
  - `frontend/js/main.js`, `frontend/js/translations.js`
- [x] Updated `backend/server.js` static file path from `'..'` → `'../frontend'`
  - Express now serves static files from `InyathiWebsite/frontend/`
- [x] Updated `frontend/js/main.js` API fetch URLs from absolute `http://localhost:3000/api/...` to relative `/api/...`
  - Contact form: `/api/contact`
  - Quote form: `/api/quote`

## ✅ Frontend and backend fully connected after reorganisation
