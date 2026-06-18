// ============================================================
// INYATHI-MZ — Main JavaScript (v2 — full redesign)
// Adds toast notifications, real-time form validation, search,
// cart-bump animation, smarter mobile nav, smoother reveals.
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ── API BASE URL RESOLVER ──────────────────────────────── */
  const API_BASE = (() => {
    const { protocol, hostname, port, origin } = window.location;
    const isLocalFile = protocol === 'file:';
    const isBackendOrigin = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000';
    if (isLocalFile) return 'http://localhost:3000';
    if (isBackendOrigin) return origin;
    return origin;
  })();
  const apiUrl = (path) => `${API_BASE}${path}`;

  /* ── TOAST NOTIFICATIONS ────────────────────────────────── */
  const toastContainer = (() => {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  })();

  function toast(message, type = 'info', duration = 3500) {
    const iconMap = {
      success: 'fa-circle-check',
      error:   'fa-circle-exclamation',
      info:    'fa-circle-info',
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <i class="toast-icon fas ${iconMap[type] || iconMap.info}"></i>
      <span>${message}</span>
      <button type="button" class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>
    `;
    toastContainer.appendChild(el);
    const remove = () => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 240);
    };
    el.querySelector('.toast-close').addEventListener('click', remove);
    if (duration > 0) setTimeout(remove, duration);
  }

  /* ── CART STATE + HELPERS ───────────────────────────────── */
  const CART_STORAGE_KEY = 'inyathi_cart_items';
  const QUOTE_CART_TRANSFER_KEY = 'inyathi_quote_cart_transfer';

  function normalizeProductForCart(product) {
    return {
      id: `${product.code}__${product.name}`.replace(/\s+/g, '_'),
      code: product.code,
      name: product.name,
      range: product.range || '',
      image: product.image || '',
      unitPrice: Number(product.unitPrice || 0),
    };
  }

  function getCartItems() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCartItems(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }

  function addToCart(product, quantity = 1) {
    const qty = Math.max(1, Number(quantity) || 1);
    const cartProduct = normalizeProductForCart(product);
    const items = getCartItems();
    const idx = items.findIndex(item => item.id === cartProduct.id);

    if (idx >= 0) {
      items[idx].quantity += qty;
    } else {
      items.push({ ...cartProduct, quantity: qty });
    }

    saveCartItems(items);
    updateCartCountBadges(true);
  }

  function getCartTotalCount() {
    return getCartItems().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  function getCartTotalAmount() {
    return getCartItems().reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  }

  function formatCurrency(amount) {
    return `MZN ${Number(amount || 0).toFixed(2)}`;
  }

  function updateCartCountBadges(bump = false) {
    const total = getCartTotalCount();
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
      badge.textContent = String(total);
      if (bump) {
        badge.classList.remove('bump');
        // restart animation
        // eslint-disable-next-line no-unused-expressions
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
    });
  }

  function removeFromCart(id) {
    let items = getCartItems();
    items = items.filter(item => item.id !== id);
    saveCartItems(items);
    updateCartCountBadges();
    renderCheckoutCart();
    toast('Item removed from cart.', 'info', 2200);
  }

  function buildQuoteCartSummary(items, paymentMethodLabel) {
    if (!items.length) return '';
    const lines = items.map((item, i) => `${i + 1}. ${item.name} (${item.code}) - Qty: ${item.quantity}`);
    return [
      '',
      '--- Cart Items from Checkout ---',
      `Payment Method: ${paymentMethodLabel}`,
      ...lines
    ].join('\n');
  }

  /* ── 1. LANGUAGE TOGGLE ─────────────────────────────────── */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyTranslations(lang);
      document.dispatchEvent(new CustomEvent('inyathi:languageChanged', { detail: { lang } }));
    });
  });
  applyTranslations(currentLang);

  /* ── 2. STICKY HEADER ───────────────────────────────────── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3. MOBILE HAMBURGER MENU ───────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  function closeMobileNav() {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  if (hamburger && mobileNav) {
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'primary-mobile-nav');
    mobileNav.id = mobileNav.id || 'primary-mobile-nav';

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !mobileNav.classList.contains('open');
      hamburger.classList.toggle('open', willOpen);
      mobileNav.classList.toggle('open', willOpen);
      hamburger.setAttribute('aria-expanded', String(willOpen));
      document.body.classList.toggle('menu-open', willOpen);
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && mobileNav.classList.contains('open')) {
        closeMobileNav();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMobileNav();
    });

    // close menu when viewport widens past breakpoint
    const mql = window.matchMedia('(min-width: 921px)');
    mql.addEventListener?.('change', e => { if (e.matches) closeMobileNav(); });
  }

  /* ── 4. ACTIVE NAV LINK ─────────────────────────────────── */
  const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── 5. SCROLL REVEAL ANIMATIONS ────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length > 0 && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => obs.observe(el));
  } else {
    // fallback: just show everything
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ── 6. BACK TO TOP ─────────────────────────────────────── */
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const onScrollBtt = () => backToTop.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', onScrollBtt, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ── 7. ANIMATED COUNTERS ───────────────────────────────── */
  function animateCounter(el, target, duration = 1800) {
    const isPercent = target.includes('%');
    const isPlus    = target.includes('+');
    const num       = parseInt(target.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(num)) return;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(num * eased);
      el.textContent = value + (isPlus ? '+' : '') + (isPercent ? '%' : '');
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = num + (isPlus ? '+' : '') + (isPercent ? '%' : '');
    }
    requestAnimationFrame(tick);
  }
  const statNums = document.querySelectorAll('.stat-num[data-target]');
  if (statNums.length > 0 && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target, entry.target.getAttribute('data-target'));
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statNums.forEach(el => statsObserver.observe(el));
  }

  /* ── 8. PRODUCT FILTER + SEARCH ─────────────────────────── */
  const filterTabs = document.querySelectorAll('.filter-tab');
  const productCards = document.querySelectorAll('.product-card[data-category], .product-cat-card-new[data-category]');
  const searchInput = document.querySelector('#productSearchInput');
  const filterEmpty = document.querySelector('.products-filter-empty');

  let activeFilter = 'all';
  let activeQuery = '';

  function applyProductFilter() {
    let visible = 0;
    productCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      const text = (card.textContent || '').toLowerCase();
      const matchesCat = activeFilter === 'all' || cat === activeFilter;
      const matchesQuery = !activeQuery || text.includes(activeQuery);
      const show = matchesCat && matchesQuery;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (filterEmpty) filterEmpty.classList.toggle('visible', visible === 0);
  }

  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.getAttribute('data-filter') || 'all';
        applyProductFilter();
      });
    });
  }

  if (searchInput) {
    let to;
    searchInput.addEventListener('input', () => {
      clearTimeout(to);
      to = setTimeout(() => {
        activeQuery = searchInput.value.trim().toLowerCase();
        applyProductFilter();
      }, 120);
    });
  }

  /* ── PRODUCT CATALOGUE DATA ─────────────────────────────── */
  const productCatalogueData = {
    'soap': {
      title: 'Hand Soap Dispensers',
      icon: 'fa-pump-soap',
      products: [
        { code: 'SD/03', name: 'Pearl Manual Soap Dispenser (White)', range: 'Pearl Range', image: 'images/products/SD-03.png' },
        { code: 'SD/03PL', name: 'Pearl Manual Soap Dispenser (Platinum)', range: 'Pearl Range', image: 'images/products/SD-03PL.jpg' },
        { code: 'SD/86PRL', name: 'Pearl Sensor Soap Dispenser (White)', range: 'Pearl Range', image: 'images/products/SD-86PRL.jpg' },
        { code: 'SD/86PRLPL', name: 'Pearl Sensor Soap Dispenser (Platinum)', range: 'Pearl Range', image: 'images/products/SD-86PRLPL.png' },
        { code: 'SD/84SS-MII', name: 'Excel Manual Soap Dispenser', range: 'Excel Range', image: 'images/products/SD-84SS-MII.jpg' },
        { code: 'SD/86SS-MII', name: 'Excel Sensor Soap Dispenser', range: 'Excel Range', image: 'images/products/SD-86SS-MII.jpg' },
        { code: 'SD/84SB', name: 'Betasan Manual Soap Dispenser', range: 'Betasan', image: 'images/products/SD-84SB.png' },
        { code: 'SD/86SB', name: 'Betasan Sensor Soap Dispenser', range: 'Betasan', image: 'images/products/SD-86SB.png' },
        { code: 'SD/95', name: 'Top Up Soap Dispenser', range: 'Top Up', image: 'images/products/SD-95.jpg' },
      ]
    },
    'sanitisers': {
      title: 'Hand Sanitisers',
      icon: 'fa-hand-sparkles',
      products: [
        { code: 'SD/72', name: 'Betasan Countertop Sanitiser Dispenser', range: 'Betasan', image: 'images/products/SD-72.png' },
        { code: 'SD/73', name: 'Free Standing Tower', range: '', image: 'images/products/SD-73.jpg' },
        { code: 'SD/86SP', name: 'Betasan Sensor Sanitiser', range: 'Betasan', image: 'images/products/SD-86SP.png' },
        { code: 'SD/84SP', name: 'Betasan Manual Sanitiser', range: 'Betasan', image: 'images/products/SD-84SPx.png' },
      ]
    },
    'roll-towel': {
      title: 'Roll Towel Dispensers',
      icon: 'fa-scroll',
      products: [
        { code: 'HD/09', name: 'Pearl Minitowel Sensor (White)', range: 'Pearl Range', image: 'images/products/HD-09.jpg' },
        { code: 'HD/09PL', name: 'Pearl Minitowel Sensor (Platinum)', range: 'Pearl Range', image: 'images/products/HD-09PL.jpg' },
        { code: 'HD/01', name: 'Pearl Minitowel Manual (White)', range: 'Pearl Range', image: 'images/products/HD-01.png' },
        { code: 'HD/01PL', name: 'Pearl Minitowel Manual (Platinum)', range: 'Pearl Range', image: 'images/products/HD-01PL.jpg' },
        { code: 'HD/08-MII', name: 'Excel Autotowel Manual', range: 'Excel Range', image: 'images/products/HD-08-MII.jpeg' },
        { code: 'HD/13-MII', name: 'Excel Autotowel Sensor', range: 'Excel Range', image: 'images/products/HD-13-MII.png' },
        { code: 'HD/07', name: 'Centrepull Dispenser', range: '', image: 'images/products/HD-07.jpg' },
      ]
    },
    'folded-towel': {
      title: 'Folded Towel Dispensers',
      icon: 'fa-layer-group',
      products: [
        { code: 'HD/05', name: 'Pearl Compact (White)', range: 'Pearl Range', image: 'images/products/HD-05.jpg' },
        { code: 'HD/05PL', name: 'Pearl Compact (Platinum)', range: 'Pearl Range', image: 'images/products/HD-05PL.jpg' },
        { code: 'HD/54-MII', name: 'Excel Slimline', range: 'Excel Range', image: 'images/products/HD-54-MII.jpg' },
      ]
    },
    'tissue': {
      title: 'Toilet Tissue Dispensers',
      icon: 'fa-toilet-paper',
      products: [
        { code: 'TR/02, TR/03, TR/05', name: 'TR Units (2, 3, 5 roll)', range: '', image: 'images/products/TR-02-03-05.jpg' },
        { code: 'TR/12', name: 'SFX JTR 500', range: '', image: 'images/products/TR-12.jpg' },
        { code: 'TR/01', name: 'Pearl JTR Twin (White)', range: 'Pearl Range', image: 'images/products/TR-01.jpg' },
        { code: 'TR/01PL', name: 'Pearl JTR Twin (Platinum)', range: 'Pearl Range', image: 'images/products/TR-01PL.jpg' },
        { code: 'TR/18SS-MII', name: 'Excel JTR Twin', range: 'Excel Range', image: 'images/products/TR-18SS-MII.jpg' },
      ]
    },
    'dryers': {
      title: 'Hot Air Dryers',
      icon: 'fa-wind',
      products: [
        { code: 'Quartz Fastdry', name: 'Quartz Fastdry', range: '', image: 'images/products/quartz-fastdry.jpg' },
        { code: 'HD/04', name: 'Excel E-Dry', range: 'Excel Range', image: 'images/products/HD-04.jpg' },
        { code: 'Excel R8', name: 'Excel R8', range: 'Excel Range', image: 'images/products/excel-r8.jpg' },
        { code: 'HD/22', name: 'Excel V-Dry', range: 'Excel Range', image: 'images/products/HD-22.jpg' },
      ]
    },
    'fragrance': {
      title: 'Fragrance Systems',
      icon: 'fa-spray-can',
      products: [
        { code: 'AF/04', name: 'Pearl Airmist (White)', range: 'Pearl Range', image: 'images/products/AF-04.jpg' },
        { code: 'AF/04PL', name: 'Pearl Airmist (Platinum)', range: 'Pearl Range', image: 'images/products/AF-04PL.jpg' },
        { code: 'AF/06-MII', name: 'Excel Airmist MKII', range: 'Excel Range', image: 'images/products/AF-06-MII.jpg' },
        { code: 'Refill', name: 'Citrus Rush', range: 'Fragrance Refills', image: 'images/products/refill-citrus-rush.jpg' },
        { code: 'Refill', name: 'Baby Breeze', range: 'Fragrance Refills', image: 'images/products/refill-baby-breeze.jpg' },
        { code: 'Refill', name: 'Berry Mint', range: 'Fragrance Refills', image: 'images/products/refill-berry-mint.jpg' },
        { code: 'Refill', name: 'Candy Blast', range: 'Fragrance Refills', image: 'images/products/refill-candy-blast.jpg' },
        { code: 'Refill', name: 'Edge', range: 'Fragrance Refills', image: 'images/products/refill-edge.jpg' },
        { code: 'Refill', name: 'Vanilla', range: 'Fragrance Refills', image: 'images/products/refill-vanilla.jpg' },
        { code: 'Refill', name: 'Citronella Lemongrass', range: 'Fragrance Refills', image: 'images/products/refill-citronella.jpg' },
      ]
    },
    'urinal': {
      title: 'Urinal Hygiene',
      icon: 'fa-restroom',
      products: [
        { code: 'US/08-MII', name: 'Excel Autosan', range: 'Excel Range', image: 'images/products/US-08-MII.jpg' },
        { code: 'US/22', name: 'SFX Autosan', range: '', image: 'images/products/US-22.jpg' },
        { code: 'UR/06 / UR/07', name: 'V-Screen Urinal Screens', range: '', image: 'images/products/UR-06-07.jpg' },
        { code: 'UR/27B–33B', name: 'Wave 3D Screens', range: '', image: 'images/products/UR-27B-33B.jpg' },
      ]
    },
    'seat': {
      title: 'Seat Sanitisers',
      icon: 'fa-toilet',
      products: [
        { code: 'WD/03', name: 'Pearl Seatsan (White)', range: 'Pearl Range', image: 'images/products/WD-03.jpg' },
        { code: 'WD/03PL', name: 'Pearl Seatsan (Platinum)', range: 'Pearl Range', image: 'images/products/WD-03PL.jpg' },
        { code: 'WD/06-MII', name: 'Excel Seatsan', range: 'Excel Range', image: 'images/products/WD-06-MII.jpg' },
      ]
    },
    'sanitary': {
      title: 'Sanitary Disposal',
      icon: 'fa-trash-can',
      products: [
        { code: 'SW/26-MII', name: 'Excel Femcare Bin', range: 'Excel Range', image: 'images/products/SW-26-MII.jpg' },
        { code: 'SW/01X / SW/03X', name: 'Femcare Bins (White)', range: '', image: 'images/products/SW-01X-03X.jpg' },
        { code: 'SW/01XPL / SW/03XPL', name: 'Femcare Bins (Platinum)', range: '', image: 'images/products/SW-01XPL-03XPL.jpg' },
        { code: 'SW/50', name: 'Femcare Pedal Bin', range: '', image: 'images/products/SW-50.jpg' },
      ]
    },
    'waste': {
      title: 'Waste Bins',
      icon: 'fa-dumpster',
      products: [
        { code: 'SW/13-MII', name: 'Excel Wastecare', range: 'Excel Range', image: 'images/products/SW-13-MII.jpg' },
        { code: 'SW/76', name: 'Eco Wall Bin 6L', range: '', image: 'images/products/SW-76.jpg' },
        { code: 'SW/77', name: 'Eco Wall Bin 25L', range: '', image: 'images/products/SW-77.jpg' },
      ]
    },
    'ppe': {
      title: 'PPE & Other Products',
      icon: 'fa-shield-halved',
      products: [
        { code: 'Nitrile Gloves', name: 'Luvas de nitrilo (100 pack)', range: 'PPE', image: 'images/products/nitrile-gloves.jpg' },
        { code: 'CAPS009', name: 'Mop Caps', range: 'PPE', image: 'images/products/CAPS009.jpg' },
        { code: 'Betasan Wipes', name: 'Betasan All Purpose Sanitiser Wipes', range: 'PPE', image: 'images/products/Betasan-All-Purpose-Wipes.jpg' },
        { code: 'Aerosoal Fogger', name: 'Betasan Aerosol fogger Range', range: 'PPE', image: 'images/products/Aerosoal-Fogger.jpg' },
      ]
    },
  };

  /* ── PRODUCT CATALOGUE MODAL ────────────────────────────── */
  const catalogueModal      = document.getElementById('catalogueModal');
  const catalogueModalClose = document.getElementById('catalogueModalClose');
  const catalogueBackdrop   = document.getElementById('catalogueModalBackdrop');
  const catalogueTitle      = document.getElementById('catalogueModalTitle');
  const catalogueIcon       = document.getElementById('catalogueModalIcon');
  const catalogueGrid       = document.getElementById('catalogueProductsGrid');
  let activeCatalogueKey = null;
  let lastFocusedTrigger = null;

  function renderProductCard(product) {
    const productName = product.nameKey ? t(product.nameKey) : product.name;
    const productRange = product.rangeKey ? t(product.rangeKey) : product.range;
    const safeCode = product.code.replace(/[^a-zA-Z0-9]/g, '-');
    const rangeHtml = productRange
      ? `<span class="catalogue-product-range">${productRange}</span>`
      : '';

    return `
      <div class="catalogue-product-card">
        <div class="catalogue-product-img-wrap">
          <img
            src="${product.image}"
            alt="${productName}"
            class="catalogue-product-img"
            loading="lazy"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="catalogue-product-placeholder">
            <i class="fas fa-image"></i>
            <span>${product.code}</span>
          </div>
        </div>
        <div class="catalogue-product-info">
          ${rangeHtml}
          <h4 class="catalogue-product-name">${productName}</h4>
          <p class="catalogue-product-code">${t('products_code_label') || 'Code'}: ${product.code}</p>
          <div class="catalogue-cart-controls">
            <label class="catalogue-qty-label" for="qty-${safeCode}">Qty</label>
            <input id="qty-${safeCode}" type="number" min="1" value="1" class="catalogue-qty-input" data-product-code="${product.code}">
            <button type="button" class="catalogue-enquire-btn catalogue-add-to-cart-btn"
              data-add-to-cart="true"
              data-product-code="${product.code}">
              <span>Add to Cart</span>
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function openCatalogueModal(catalogueKey, triggerEl) {
    if (!catalogueModal) return;
    const data = productCatalogueData[catalogueKey];
    if (!data) return;

    activeCatalogueKey = catalogueKey;
    lastFocusedTrigger = triggerEl || null;

    const translatedTitle = data.titleKey ? t(data.titleKey) : data.title;
    catalogueTitle.textContent = translatedTitle;
    catalogueIcon.className    = `fas ${data.icon}`;

    catalogueGrid.innerHTML = data.products.map(p => renderProductCard(p)).join('');

    catalogueModal.classList.add('open');
    document.body.classList.add('modal-open');
    catalogueGrid.scrollTop = 0;
    setTimeout(() => catalogueModalClose?.focus(), 120);

    catalogueGrid.querySelectorAll('[data-add-to-cart="true"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-product-code');
        const selectedProduct = data.products.find(p => p.code === code);
        if (!selectedProduct) return;

        const safeCodeForQty = code.replace(/[^a-zA-Z0-9]/g, '-');
        const qtyInput = catalogueGrid.querySelector(`#qty-${safeCodeForQty}`);
        const qty = Math.max(1, Number(qtyInput?.value) || 1);

        addToCart(selectedProduct, qty);
        toast(`Added ${qty} × ${selectedProduct.name}`, 'success');

        const original = btn.innerHTML;
        btn.innerHTML = '<span>Added</span><i class="fas fa-check"></i>';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled = false;
        }, 900);
      });
    });
  }

  function closeCatalogueModal() {
    if (!catalogueModal) return;
    catalogueModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    activeCatalogueKey = null;
    lastFocusedTrigger?.focus?.();
  }

  if (catalogueModal) {
    document.querySelectorAll('.product-cat-card-new[data-catalogue]').forEach(card => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      const trigger = (e) => {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e.type === 'keydown') e.preventDefault();
        const key = card.getAttribute('data-catalogue');
        openCatalogueModal(key, card);
      };
      card.addEventListener('click', trigger);
      card.addEventListener('keydown', trigger);
    });

    catalogueModalClose?.addEventListener('click', closeCatalogueModal);
    catalogueBackdrop?.addEventListener('click', closeCatalogueModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && catalogueModal.classList.contains('open')) {
        closeCatalogueModal();
      }
    });
    document.addEventListener('inyathi:languageChanged', () => {
      if (catalogueModal.classList.contains('open') && activeCatalogueKey) {
        openCatalogueModal(activeCatalogueKey, lastFocusedTrigger);
      }
    });
  }

  /* ── CHECKOUT PAGE FLOW ─────────────────────────────────── */
  const checkoutCartList = document.getElementById('checkoutCartList');
  const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');
  const payCardBtn = document.getElementById('payCardBtn');
  const payCashBtn = document.getElementById('payCashBtn');
  const bankDetailsBox = document.getElementById('bankDetailsBox');
  const proceedToQuoteBtn = document.getElementById('proceedToQuoteBtn');

  function renderCheckoutCart() {
    if (!checkoutCartList || !checkoutTotalAmount) return;
    const items = getCartItems();

    if (!items.length) {
      checkoutCartList.innerHTML = '<p class="checkout-empty">Your cart is empty. Add products from the products page.</p>';
      checkoutTotalAmount.textContent = formatCurrency(0);
      return;
    }

    checkoutCartList.innerHTML = items.map(item => `
      <div class="checkout-item-row">
        <div>
          <strong>${item.name}</strong>
          <p style="margin:0.25rem 0 0;color:var(--mid-gray);font-size:0.85rem;">
            ${item.code}${item.range ? ` &middot; ${item.range}` : ''}
          </p>
        </div>
        <div class="checkout-item-actions">
          <strong>x${item.quantity}</strong>
          <button class="remove-cart-btn" data-id="${item.id}" aria-label="Remove ${item.name}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    checkoutTotalAmount.textContent = formatCurrency(getCartTotalAmount());
  }

  if (checkoutCartList) {
    checkoutCartList.addEventListener('click', function (e) {
      const removeBtn = e.target.closest('.remove-cart-btn');
      if (removeBtn) removeFromCart(removeBtn.getAttribute('data-id'));
    });

    renderCheckoutCart();

    payCardBtn?.addEventListener('click', () => {
      if (bankDetailsBox) {
        bankDetailsBox.style.display = 'block';
        bankDetailsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    proceedToQuoteBtn?.addEventListener('click', () => transferCartToQuoteAndGo('Card / Bank Transfer'));
    payCashBtn?.addEventListener('click', () => transferCartToQuoteAndGo('Cash'));
  }

  function transferCartToQuoteAndGo(paymentMethodLabel) {
    const items = getCartItems();
    if (!items.length) {
      toast('Your cart is empty. Add products before checking out.', 'error');
      return;
    }
    localStorage.setItem(QUOTE_CART_TRANSFER_KEY, JSON.stringify({
      paymentMethod: paymentMethodLabel,
      items
    }));
    window.location.href = 'pricing.html';
  }

  /* ── PRICING PAGE PREFILL FROM CART ─────────────────────── */
  const pricingQuoteForm = document.getElementById('quoteForm');
  if (pricingQuoteForm) {
    try {
      const transferRaw = localStorage.getItem(QUOTE_CART_TRANSFER_KEY);
      if (transferRaw) {
        const transferData = JSON.parse(transferRaw);
        const items = Array.isArray(transferData?.items) ? transferData.items : [];
        const paymentMethod = transferData?.paymentMethod || 'Not specified';

        const detailsField = pricingQuoteForm.querySelector('textarea.form-control');
        if (detailsField && items.length) {
          const summary = buildQuoteCartSummary(items, paymentMethod);
          if (!detailsField.value.trim()) {
            detailsField.value = summary.trim();
          } else if (!detailsField.value.includes('--- Cart Items from Checkout ---')) {
            detailsField.value = `${detailsField.value.trim()}\n${summary}`;
          }
        }
      }
      localStorage.removeItem(QUOTE_CART_TRANSFER_KEY);
    } catch {
      localStorage.removeItem(QUOTE_CART_TRANSFER_KEY);
    }
  }

  updateCartCountBadges();

  /* ── 9. CONTACT FORM ────────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) {
        toast('Please fill in the highlighted fields.', 'error');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true);

      const contactInputs = contactForm.querySelectorAll('input.form-control');
      const payload = {
        full_name:   contactInputs[0]?.value.trim(),
        institution: contactInputs[1]?.value.trim(),
        email:       contactForm.querySelector('input[type="email"]')?.value.trim(),
        phone:       contactForm.querySelector('input[type="tel"]')?.value.trim(),
        subject:     contactInputs[4]?.value.trim(),
        message:     contactForm.querySelector('textarea.form-control')?.value.trim(),
      };

      try {
        const res  = await fetch(apiUrl('/api/contact'), {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
          showFormSuccess(contactForm, 'contactSuccess');
          toast('Message sent. We\'ll be in touch within 24 hours.', 'success', 4500);
        } else {
          showFormError(contactForm, data.message || 'Submission failed. Please try again.');
        }
      } catch (err) {
        showFormError(contactForm, 'Could not connect to server. Please try again later.');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  /* ── 10. QUOTE FORM ─────────────────────────────────────── */
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(quoteForm)) {
        toast('Please complete the required fields.', 'error');
        return;
      }

      const submitBtn = quoteForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true);

      const inputs = quoteForm.querySelectorAll('input.form-control');
      const payload  = {
        full_name:          inputs[0]?.value.trim(),
        institution:        inputs[1]?.value.trim(),
        email:              quoteForm.querySelector('input[type="email"]')?.value.trim(),
        phone:              quoteForm.querySelector('input[type="tel"]')?.value.trim(),
        product_category:   quoteForm.querySelector('select.form-control')?.value,
        estimated_quantity: inputs[4]?.value.trim(),
        product_details:    quoteForm.querySelector('textarea.form-control')?.value.trim(),
      };

      try {
        const res  = await fetch(apiUrl('/api/quote'), {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
          const successEl = document.getElementById('quoteSuccess');
          if (successEl && data.quote_reference) {
            const refEl = document.createElement('p');
            refEl.style.cssText = 'font-size:0.85rem;color:var(--mid-gray);margin-top:0.5rem;';
            refEl.innerHTML = `Your reference: <strong>${data.quote_reference}</strong>`;
            successEl.appendChild(refEl);
          }
          showFormSuccess(quoteForm, 'quoteSuccess');
          toast('Quote request received. Reply within 24 hours.', 'success', 5000);
        } else {
          showFormError(quoteForm, data.message || 'Submission failed. Please try again.');
        }
      } catch (err) {
        showFormError(quoteForm, 'Could not connect to server. Please try again later.');
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  /* ── 11. FORM VALIDATION ────────────────────────────────── */
  function setFieldInvalid(field, invalid) {
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    if (!invalid) field.removeAttribute('aria-invalid');
  }

  function validateField(field) {
    if (!field.hasAttribute('required') && !field.value.trim()) {
      setFieldInvalid(field, false);
      return true;
    }
    if (field.hasAttribute('required') && !field.value.trim()) {
      setFieldInvalid(field, true);
      return false;
    }
    if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const ok = emailRegex.test(field.value.trim());
      setFieldInvalid(field, !ok);
      return ok;
    }
    if (field.type === 'tel' && field.value.trim()) {
      const ok = /^[\d+\-\s()]{6,}$/.test(field.value.trim());
      setFieldInvalid(field, !ok);
      return ok;
    }
    setFieldInvalid(field, false);
    return true;
  }

  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required], input[type="email"]').forEach(field => {
      if (!validateField(field)) valid = false;
    });
    return valid;
  }

  // real-time validation on blur + clear on input
  document.querySelectorAll('.form-control').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  function showFormSuccess(form, successId) {
    const successEl = document.getElementById(successId);
    if (successEl) {
      form.style.display = 'none';
      successEl.style.display = 'block';
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showFormError(form, message) {
    const existing = form.querySelector('.form-api-error');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'form-api-error';
    banner.style.cssText = [
      'background:#fdecea',
      'color:#c62828',
      'border:1px solid #ef9a9a',
      'border-radius:10px',
      'padding:0.85rem 1rem',
      'margin-bottom:1rem',
      'font-size:0.88rem',
      'display:flex',
      'align-items:center',
      'gap:0.5rem',
    ].join(';');
    banner.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${message}`;
    form.prepend(banner);
    toast(message, 'error', 4500);
    setTimeout(() => banner.remove(), 6000);
  }

  function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    }
  }

  /* ── 12. SMOOTH SCROLL ──────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 90;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── 13. HERO TILT (subtle parallax on pointer) ─────────── */
  const heroVisual = document.querySelector('.hero-visual');
  if (heroVisual && window.matchMedia('(hover:hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cards = heroVisual.querySelectorAll('.hero-card');
    heroVisual.addEventListener('mousemove', (e) => {
      const r = heroVisual.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      cards.forEach((card, i) => {
        const depth = (i + 1) * 6;
        card.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        if (card.classList.contains('hero-card-main')) {
          card.style.transform = `translate(calc(-50% + ${x * depth}px), calc(-50% + ${y * depth}px))`;
        }
      });
    });
    heroVisual.addEventListener('mouseleave', () => {
      cards.forEach(card => {
        card.style.transform = card.classList.contains('hero-card-main') ? 'translate(-50%,-50%)' : '';
      });
    });
  }

  /* ── 14. LAZY-LOAD ANY IMG WITHOUT loading attr ─────────── */
  document.querySelectorAll('img:not([loading])').forEach(img => {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });

});
