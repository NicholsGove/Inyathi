// ============================================================
// INYATHI-MZ — Main JavaScript
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ── API BASE URL RESOLVER ───────────────────────────────
  // - If served by backend (http://localhost:3000), use same-origin
  // - If opened as static file (file://) or different port, fallback to backend default
  const API_BASE = (() => {
    const { protocol, hostname, port, origin } = window.location;
    const isLocalFile = protocol === 'file:';
    const isBackendOrigin = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000';
    if (isLocalFile) return 'http://localhost:3000';
    if (isBackendOrigin) return origin;
    return origin; // keep same-origin for deployed environments
  })();

  const apiUrl = (path) => `${API_BASE}${path}`;

  // ── CART STATE + HELPERS ────────────────────────────────
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
    updateCartCountBadges();
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

  function updateCartCountBadges() {
    const total = getCartTotalCount();
    const desktopBadge = document.getElementById('cartCountBadge');
    const mobileBadge = document.getElementById('cartCountBadgeMobile');
    if (desktopBadge) desktopBadge.textContent = String(total);
    if (mobileBadge) mobileBadge.textContent = String(total);
  }

  function removeFromCart(id) {
    let items = getCartItems();
    items = items.filter(item => item.id !== id);
    saveCartItems(items);
    updateCartCountBadges();
    renderCheckoutCart(); // refresh the UI
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

  // ── 1. LANGUAGE TOGGLE ──────────────────────────────────
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyTranslations(lang);
      document.dispatchEvent(new CustomEvent('inyathi:languageChanged', { detail: { lang } }));
    });
  });

  // Apply saved language on load
  applyTranslations(currentLang);

  // ── 2. STICKY HEADER ────────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ── 3. MOBILE HAMBURGER MENU ────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });

    // Close mobile nav when a link is clicked
    mobileNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      }
    });
  }

  // ── 4. ACTIVE NAV LINK ──────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── 5. SCROLL REVEAL ANIMATIONS ─────────────────────────
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // ── 6. BACK TO TOP BUTTON ───────────────────────────────
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── 7. COUNTER ANIMATION ────────────────────────────────
  function animateCounter(el, target, duration = 1800) {
    const isPercent = target.includes('%');
    const isPlus    = target.includes('+');
    const num       = parseInt(target.replace(/[^0-9]/g, ''));
    let start = 0;
    const step = Math.ceil(num / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) {
        start = num;
        clearInterval(timer);
      }
      el.textContent = start + (isPlus ? '+' : '') + (isPercent ? '%' : '');
    }, 16);
  }

  const statNums = document.querySelectorAll('.stat-num[data-target]');
  if (statNums.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = el.getAttribute('data-target');
          animateCounter(el, target);
          statsObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statNums.forEach(el => statsObserver.observe(el));
  }

  // ── 8. PRODUCT FILTER TABS ──────────────────────────────
  const filterTabs = document.querySelectorAll('.filter-tab');
  // Works with both old .product-card and new .product-cat-card-new elements
  const productCards = document.querySelectorAll('.product-card[data-category], .product-cat-card-new[data-category]');

  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const category = tab.getAttribute('data-filter');
        productCards.forEach(card => {
          if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = '';
            card.style.animation = 'fadeIn 0.3s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ── 14. PRODUCT CATALOGUE MODAL ─────────────────────────

  // ── Product Data ──────────────────────────────────────
  // Each product has: code, name, range, image (file path)
  // 📷 IMAGE INSTRUCTIONS:
  //   - Create a folder: images/products/
  //   - Place each product image in that folder using the filename shown in the `image` field
  //   - The image will automatically appear once the file exists at that path
  const productCatalogueData = {

    'soap': {
      title: 'Hand Soap Dispensers',
      icon: 'fa-pump-soap',
      products: [
        // ── Pearl Range ──────────────────────────────────
        {
          code: 'SD/03',
          name: 'Pearl Manual Soap Dispenser (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/SD-03.jpg
          image: 'images/products/SD-03.png'
        },
        {
          code: 'SD/03PL',
          name: 'Pearl Manual Soap Dispenser (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/SD-03PL.jpg
          image: 'images/products/SD-03PL.jpg'
        },
        {
          code: 'SD/86PRL',
          name: 'Pearl Sensor Soap Dispenser (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/SD-86PRL.jpg
          image: 'images/products/SD-86PRL.jpg'
        },
        {
          code: 'SD/86PRLPL',
          name: 'Pearl Sensor Soap Dispenser (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/SD-86PRLPL.jpg
          image: 'images/products/SD-86PRLPL.png'
        },
        // ── Excel Range ──────────────────────────────────
        {
          code: 'SD/84SS-MII',
          name: 'Excel Manual Soap Dispenser',
          range: 'Excel Range',
          // 📷 Place image at: images/products/SD-84SS-MII.jpg
          image: 'images/products/SD-84SS-MII.jpg'
        },
        {
          code: 'SD/86SS-MII',
          name: 'Excel Sensor Soap Dispenser',
          range: 'Excel Range',
          // 📷 Place image at: images/products/SD-86SS-MII.jpg
          image: 'images/products/SD-86SS-MII.jpg'
        },
        // ── Betasan ──────────────────────────────────────
        {
          code: 'SD/84SB',
          name: 'Betasan Manual Soap Dispenser',
          range: 'Betasan',
          // 📷 Place image at: images/products/SD-84SB.jpg
          image: 'images/products/SD-84SB.png'
        },
        {
          code: 'SD/86SB',
          name: 'Betasan Sensor Soap Dispenser',
          range: 'Betasan',
          // 📷 Place image at: images/products/SD-86SB.jpg
          image: 'images/products/SD-86SB.png'
        },
        // ── Top Up ───────────────────────────────────────
        {
          code: 'SD/95',
          name: 'Top Up Soap Dispenser',
          range: 'Top Up',
          // 📷 Place image at: images/products/SD-95.jpg
          image: 'images/products/SD-95.jpg'
        },
      ]
    },

    'sanitisers': {
      title: 'Hand Sanitisers',
      icon: 'fa-hand-sparkles',
      products: [
        {
          code: 'SD/72',
          name: 'Betasan Countertop Sanitiser Dispenser',
          range: 'Betasan',
          // 📷 Place image at: images/products/SD-72.jpg
          image: 'images/products/SD-72.png'
        },
        {
          code: 'SD/73',
          name: 'Free Standing Tower',
          range: '',
          // 📷 Place image at: images/products/SD-73.jpg
          image: 'images/products/SD-73.jpg'
        },
        {
          code: 'SD/86SP',
          name: 'Betasan Sensor Sanitiser',
          range: 'Betasan',
          // 📷 Place image at: images/products/SD-86SP.jpg
          image: 'images/products/SD-86SP.png'
        },
        {
          code: 'SD/84SP',
          name: 'Betasan Manual Sanitiser',
          range: 'Betasan',
          // 📷 Place image at: images/products/SD-84SP.jpg
          image: 'images/products/SD-84SPx.png'  
        },
      ]
    },

    'roll-towel': {
      title: 'Roll Towel Dispensers',
      icon: 'fa-scroll',
      products: [
        {
          code: 'HD/09',
          name: 'Pearl Minitowel Sensor (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/HD-09.jpg
          image: 'images/products/HD-09.jpg'
        },
        {
          code: 'HD/09PL',
          name: 'Pearl Minitowel Sensor (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/HD-09PL.jpg
          image: 'images/products/HD-09PL.jpg'
        },
        {
          code: 'HD/01',
          name: 'Pearl Minitowel Manual (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/HD-01.jpg
          image: 'images/products/HD-01.png'
        },
        {
          code: 'HD/01PL',
          name: 'Pearl Minitowel Manual (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/HD-01PL.jpg
          image: 'images/products/HD-01PL.jpg'
        },
        {
          code: 'HD/08-MII',
          name: 'Excel Autotowel Manual',
          range: 'Excel Range',
          // 📷 Place image at: images/products/HD-08-MII.jpg
          image: 'images/products/HD-08-MII.jpeg'
        },
        {
          code: 'HD/13-MII',
          name: 'Excel Autotowel Sensor',
          range: 'Excel Range',
          // 📷 Place image at: images/products/HD-13-MII.jpg
          image: 'images/products/HD-13-MII.png'
        },
        {
          code: 'HD/07',
          name: 'Centrepull Dispenser',
          range: '',
          // 📷 Place image at: images/products/HD-07.jpg
          image: 'images/products/HD-07.jpg'
        },
      ]
    },

    'folded-towel': {
      title: 'Folded Towel Dispensers',
      icon: 'fa-layer-group',
      products: [
        {
          code: 'HD/05',
          name: 'Pearl Compact (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/HD-05.jpg
          image: 'images/products/HD-05.jpg'
        },
        {
          code: 'HD/05PL',
          name: 'Pearl Compact (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/HD-05PL.jpg
          image: 'images/products/HD-05PL.jpg'
        },
        {
          code: 'HD/54-MII',
          name: 'Excel Slimline',
          range: 'Excel Range',
          // 📷 Place image at: images/products/HD-54-MII.jpg
          image: 'images/products/HD-54-MII.jpg'
        },
      ]
    },

    'tissue': {
      title: 'Toilet Tissue Dispensers',
      icon: 'fa-toilet-paper',
      products: [
        {
          code: 'TR/02, TR/03, TR/05',
          name: 'TR Units (2, 3, 5 roll)',
          range: '',
          // 📷 Place image at: images/products/TR-02-03-05.jpg
          image: 'images/products/TR-02-03-05.jpg'
        },
        {
          code: 'TR/12',
          name: 'SFX JTR 500',
          range: '',
          // 📷 Place image at: images/products/TR-12.jpg
          image: 'images/products/TR-12.jpg'
        },
        {
          code: 'TR/01',
          name: 'Pearl JTR Twin (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/TR-01.jpg
          image: 'images/products/TR-01.jpg'
        },
        {
          code: 'TR/01PL',
          name: 'Pearl JTR Twin (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/TR-01PL.jpg
          image: 'images/products/TR-01PL.jpg'
        },
        {
          code: 'TR/18SS-MII',
          name: 'Excel JTR Twin',
          range: 'Excel Range',
          // 📷 Place image at: images/products/TR-18SS-MII.jpg
          image: 'images/products/TR-18SS-MII.jpg'
        },
      ]
    },

    'dryers': {
      title: 'Hot Air Dryers',
      icon: 'fa-wind',
      products: [
        {
          code: 'Quartz Fastdry',
          name: 'Quartz Fastdry',
          range: '',
          // 📷 Place image at: images/products/quartz-fastdry.jpg
          image: 'images/products/quartz-fastdry.jpg'
        },
        {
          code: 'HD/04',
          name: 'Excel E-Dry',
          range: 'Excel Range',
          // 📷 Place image at: images/products/HD-04.jpg
          image: 'images/products/HD-04.jpg'
        },
        {
          code: 'Excel R8',
          name: 'Excel R8',
          range: 'Excel Range',
          // 📷 Place image at: images/products/excel-r8.jpg
          image: 'images/products/excel-r8.jpg'
        },
        {
          code: 'HD/22',
          name: 'Excel V-Dry',
          range: 'Excel Range',
          // 📷 Place image at: images/products/HD-22.jpg
          image: 'images/products/HD-22.jpg'
        },
      ]
    },

    'fragrance': {
      title: 'Fragrance Systems',
      icon: 'fa-spray-can',
      products: [
        // ── Dispensers ───────────────────────────────────
        {
          code: 'AF/04',
          name: 'Pearl Airmist (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/AF-04.jpg
          image: 'images/products/AF-04.jpg'
        },
        {
          code: 'AF/04PL',
          name: 'Pearl Airmist (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/AF-04PL.jpg
          image: 'images/products/AF-04PL.jpg'
        },
        {
          code: 'AF/06-MII',
          name: 'Excel Airmist MKII',
          range: 'Excel Range',
          // 📷 Place image at: images/products/AF-06-MII.jpg
          image: 'images/products/AF-06-MII.jpg'
        },
        // ── Fragrance Refills ─────────────────────────────
        {
          code: 'Refill',
          name: 'Citrus Rush',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-citrus-rush.jpg
          image: 'images/products/refill-citrus-rush.jpg'
        },
        {
          code: 'Refill',
          name: 'Baby Breeze',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-baby-breeze.jpg
          image: 'images/products/refill-baby-breeze.jpg'
        },
        {
          code: 'Refill',
          name: 'Berry Mint',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-berry-mint.jpg
          image: 'images/products/refill-berry-mint.jpg'
        },
        {
          code: 'Refill',
          name: 'Candy Blast',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-candy-blast.jpg
          image: 'images/products/refill-candy-blast.jpg'
        },
        {
          code: 'Refill',
          name: 'Edge',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-edge.jpg
          image: 'images/products/refill-edge.jpg'
        },
        {
          code: 'Refill',
          name: 'Vanilla',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-vanilla.jpg
          image: 'images/products/refill-vanilla.jpg'
        },
        {
          code: 'Refill',
          name: 'Citronella Lemongrass',
          range: 'Fragrance Refills',
          // 📷 Place image at: images/products/refill-citronella.jpg
          image: 'images/products/refill-citronella.jpg'
        },
      ]
    },

    'urinal': {
      title: 'Urinal Hygiene',
      icon: 'fa-restroom',
      products: [
        {
          code: 'US/08-MII',
          name: 'Excel Autosan',
          range: 'Excel Range',
          // 📷 Place image at: images/products/US-08-MII.jpg
          image: 'images/products/US-08-MII.jpg'
        },
        {
          code: 'US/22',
          name: 'SFX Autosan',
          range: '',
          // 📷 Place image at: images/products/US-22.jpg
          image: 'images/products/US-22.jpg'
        },
        {
          code: 'UR/06 / UR/07',
          name: 'V-Screen Urinal Screens',
          range: '',
          // 📷 Place image at: images/products/UR-06-07.jpg
          image: 'images/products/UR-06-07.jpg'
        },
        {
          code: 'UR/27B–33B',
          name: 'Wave 3D Screens',
          range: '',
          // 📷 Place image at: images/products/UR-27B-33B.jpg
          image: 'images/products/UR-27B-33B.jpg'
        },
      ]
    },

    'seat': {
      title: 'Seat Sanitisers',
      icon: 'fa-toilet',
      products: [
        {
          code: 'WD/03',
          name: 'Pearl Seatsan (White)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/WD-03.jpg
          image: 'images/products/WD-03.jpg'
        },
        {
          code: 'WD/03PL',
          name: 'Pearl Seatsan (Platinum)',
          range: 'Pearl Range',
          // 📷 Place image at: images/products/WD-03PL.jpg
          image: 'images/products/WD-03PL.jpg'
        },
        {
          code: 'WD/06-MII',
          name: 'Excel Seatsan',
          range: 'Excel Range',
          // 📷 Place image at: images/products/WD-06-MII.jpg
          image: 'images/products/WD-06-MII.jpg'
        },
      ]
    },

    'sanitary': {
      title: 'Sanitary Disposal',
      icon: 'fa-trash-can',
      products: [
        {
          code: 'SW/26-MII',
          name: 'Excel Femcare Bin',
          range: 'Excel Range',
          // 📷 Place image at: images/products/SW-26-MII.jpg
          image: 'images/products/SW-26-MII.jpg'
        },
        {
          code: 'SW/01X / SW/03X',
          name: 'Femcare Bins (White)',
          range: '',
          // 📷 Place image at: images/products/SW-01X-03X.jpg
          image: 'images/products/SW-01X-03X.jpg'
        },
        {
          code: 'SW/01XPL / SW/03XPL',
          name: 'Femcare Bins (Platinum)',
          range: '',
          // 📷 Place image at: images/products/SW-01XPL-03XPL.jpg
          image: 'images/products/SW-01XPL-03XPL.jpg'
        },
        {
          code: 'SW/50',
          name: 'Femcare Pedal Bin',
          range: '',
          // 📷 Place image at: images/products/SW-50.jpg
          image: 'images/products/SW-50.jpg'
        },
      ]
    },

    'waste': {
      title: 'Waste Bins',
      icon: 'fa-dumpster',
      products: [
        {
          code: 'SW/13-MII',
          name: 'Excel Wastecare',
          range: 'Excel Range',
          // 📷 Place image at: images/products/SW-13-MII.jpg
          image: 'images/products/SW-13-MII.jpg'
        },
        {
          code: 'SW/76',
          name: 'Eco Wall Bin 6L',
          range: '',
          // 📷 Place image at: images/products/SW-76.jpg
          image: 'images/products/SW-76.jpg'
        },
        {
          code: 'SW/77',
          name: 'Eco Wall Bin 25L',
          range: '',
          // 📷 Place image at: images/products/SW-77.jpg
          image: 'images/products/SW-77.jpg'
        },
        
      ]
    },

    'ppe': {
      title: 'PPE & Other Products',
      icon: 'fa-shield-halved',
      products: [
        {
          code: 'Nitrile Gloves',
          name: 'Luvas de nitrilo (100 pack)',
          range: 'PPE',
          // 📷 Place image at: images/products/nitrile-gloves.jpg
          image: 'images/products/nitrile-gloves.jpg'
        },
        {
          code: 'CAPS009',
          name: 'Mop Caps',
          range: 'PPE',
          // 📷 Place image at: images/products/CAPS009.jpg
          image: 'images/products/CAPS009.jpg'
        },
        {
          code: 'Betasan Wipes',
          name: 'Betasan All Purpose Sanitiser Wipes',
          range: 'PPE',
          // 📷 Place image at: images/products/Betasan-Allpurpose.jpg
          image: 'images/products/Betasan-All-Purpose-Wipes.jpg'
        },
        {
          code: 'Aerosoal Fogger',
          name: 'Betasan Aerosol fogger Range',
          range: 'PPE',
          // 📷 Place image at: images/products/Aerosoal-Fooger.jpg.jpg
          image: 'images/products/Aerosoal-Fogger.jpg'
        },
      ]
    },

  }; // end productCatalogueData

  // ── Modal Elements ────────────────────────────────────
  const catalogueModal      = document.getElementById('catalogueModal');
  const catalogueModalClose = document.getElementById('catalogueModalClose');
  const catalogueBackdrop   = document.getElementById('catalogueModalBackdrop');
  const catalogueTitle      = document.getElementById('catalogueModalTitle');
  const catalogueIcon       = document.getElementById('catalogueModalIcon');
  const catalogueGrid       = document.getElementById('catalogueProductsGrid');

  // Only wire up modal logic on the products page
  if (catalogueModal) {

  // ── Render a single product card ─────────────────────
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
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          >
          <div class="catalogue-product-placeholder" style="display:none;">
            <i class="fas fa-image"></i>
            <span>${safeCode}</span>
          </div>
        </div>
        <div class="catalogue-product-info">
          ${rangeHtml}
          <h4 class="catalogue-product-name">${productName}</h4>
          <p class="catalogue-product-code">${t('products_code_label')}: ${product.code}</p>
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

  // ── Open Modal ────────────────────────────────────────
  let activeCatalogueKey = null;

  function openCatalogueModal(catalogueKey) {
    const data = productCatalogueData[catalogueKey];
    if (!data) return;

    activeCatalogueKey = catalogueKey;

    // Update header
    const translatedTitle = data.titleKey ? t(data.titleKey) : data.title;
    catalogueTitle.textContent = translatedTitle;
    catalogueIcon.className    = `fas ${data.icon}`;

    // Render products
    catalogueGrid.innerHTML = data.products
      .map(p => renderProductCard(p))
      .join('');

    // Open modal
    catalogueModal.classList.add('open');
    document.body.classList.add('modal-open');
    catalogueGrid.scrollTop = 0;

    catalogueGrid.querySelectorAll('[data-add-to-cart="true"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-product-code');
        const selectedProduct = data.products.find(p => p.code === code);
        if (!selectedProduct) return;

        const safeCodeForQty = code.replace(/[^a-zA-Z0-9]/g, '-');
        const qtyInput = catalogueGrid.querySelector(`#qty-${safeCodeForQty}`);
        const qty = Math.max(1, Number(qtyInput?.value) || 1);

        addToCart(selectedProduct, qty);

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

  // ── Close Modal ───────────────────────────────────────
  function closeCatalogueModal() {
    catalogueModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    activeCatalogueKey = null;
  }

  // ── Category Card Click ───────────────────────────────
  document.querySelectorAll('.product-cat-card-new[data-catalogue]').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-catalogue');
      openCatalogueModal(key);
    });
  });

  // ── Close Triggers ────────────────────────────────────
  catalogueModalClose.addEventListener('click', closeCatalogueModal);
  catalogueBackdrop.addEventListener('click', closeCatalogueModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && catalogueModal.classList.contains('open')) {
      closeCatalogueModal();
    }
  });

    document.addEventListener('inyathi:languageChanged', () => {
      if (catalogueModal.classList.contains('open') && activeCatalogueKey) {
        openCatalogueModal(activeCatalogueKey);
      }
    });

  } // end if (catalogueModal)

  // ── CHECKOUT PAGE FLOW ──────────────────────────────────
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
        ${item.code}${item.range ? ` • ${item.range}` : ''}
      </p>
    </div>

    <div class="checkout-item-actions">
      <strong>x${item.quantity}</strong>
      <button class="remove-cart-btn" data-id="${item.id}">
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

    if (removeBtn) {
      const id = removeBtn.getAttribute('data-id');
      removeFromCart(id);
    }

  });
}

  function transferCartToQuoteAndGo(paymentMethodLabel) {
    const items = getCartItems();
    localStorage.setItem(QUOTE_CART_TRANSFER_KEY, JSON.stringify({
      paymentMethod: paymentMethodLabel,
      items
    }));
    window.location.href = 'pricing.html';
  }

  if (checkoutCartList) {
    renderCheckoutCart();

    if (payCardBtn) {
      payCardBtn.addEventListener('click', () => {
        if (bankDetailsBox) bankDetailsBox.style.display = 'block';
      });
    }

    if (proceedToQuoteBtn) {
      proceedToQuoteBtn.addEventListener('click', () => {
        transferCartToQuoteAndGo('Card / Bank Transfer');
      });
    }

    if (payCashBtn) {
      payCashBtn.addEventListener('click', () => {
        transferCartToQuoteAndGo('Cash');
      });
    }
  }
  document.querySelectorAll('.remove-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      removeFromCart(id);
    });
  });

  // ── PRICING PAGE CART TRANSFER PREFILL ──────────────────
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

  // ── 9. CONTACT FORM ─────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) return;

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

  // ── 10. QUOTE FORM ──────────────────────────────────────
  const quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(quoteForm)) return;

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
          // Show quote reference in success message if available
          const successEl = document.getElementById('quoteSuccess');
          if (successEl && data.quote_reference) {
            const refEl = document.createElement('p');
            refEl.style.cssText = 'font-size:0.85rem;color:var(--mid-gray);margin-top:0.5rem;';
            refEl.innerHTML = `Your reference: <strong>${data.quote_reference}</strong>`;
            successEl.appendChild(refEl);
          }
          showFormSuccess(quoteForm, 'quoteSuccess');
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

  // ── 11. FORM VALIDATION ─────────────────────────────────
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const group = field.closest('.form-group');
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#e53935';
        if (group) group.querySelector('label').style.color = '#e53935';
      } else {
        field.style.borderColor = '';
        if (group) group.querySelector('label').style.color = '';
      }

      // Email validation
      if (field.type === 'email' && field.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value.trim())) {
          valid = false;
          field.style.borderColor = '#e53935';
        }
      }
    });
    return valid;
  }

  function showFormSuccess(form, successId) {
    const successEl = document.getElementById(successId);
    if (successEl) {
      form.style.display = 'none';
      successEl.style.display = 'block';
    }
  }

  function showFormError(form, message) {
    // Remove any existing error banner
    const existing = form.querySelector('.form-api-error');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'form-api-error';
    banner.style.cssText = [
      'background:#fdecea',
      'color:#c62828',
      'border:1px solid #ef9a9a',
      'border-radius:8px',
      'padding:0.85rem 1rem',
      'margin-bottom:1rem',
      'font-size:0.88rem',
      'display:flex',
      'align-items:center',
      'gap:0.5rem',
    ].join(';');
    banner.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${message}`;
    form.prepend(banner);

    // Auto-remove after 6 seconds
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

  // Clear validation styles on input
  document.querySelectorAll('.form-control').forEach(field => {
    field.addEventListener('input', () => {
      field.style.borderColor = '';
      const group = field.closest('.form-group');
      if (group && group.querySelector('label')) {
        group.querySelector('label').style.color = '';
      }
    });
  });

  // ── 12. SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── 13. HERO CARD FLOAT ANIMATION ───────────────────────
  const heroCards = document.querySelectorAll('.hero-card');
  heroCards.forEach((card, i) => {
    card.style.animation = `float ${2.5 + i * 2.5}s ease-in-out infinite alternate`;
  });

});

// ── CSS KEYFRAME INJECTION ───────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    from { transform: translateY(0px); }
    to   { transform: translateY(-10px); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hero-card-main {
    animation: float 3s ease-in-out infinite alternate !important;
  }
`;
document.head.appendChild(style);
