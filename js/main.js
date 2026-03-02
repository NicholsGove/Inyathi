// ============================================================
// INYATHI-MZ — Main JavaScript
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ── 1. LANGUAGE TOGGLE ──────────────────────────────────
  const langBtns = document.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyTranslations(lang);
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
  const productCards = document.querySelectorAll('.product-card[data-category]');

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

  // ── 9. CONTACT FORM ─────────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm(contactForm)) return;

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      setButtonLoading(submitBtn, true);

      const payload = {
        full_name:   contactForm.querySelector('[placeholder="Your full name"]')?.value.trim(),
        institution: contactForm.querySelector('[placeholder*="clinic"]')?.value.trim(),
        email:       contactForm.querySelector('[type="email"]')?.value.trim(),
        phone:       contactForm.querySelector('[type="tel"]')?.value.trim(),
        subject:     contactForm.querySelector('[placeholder*="help"]')?.value.trim(),
        message:     contactForm.querySelector('textarea')?.value.trim(),
      };

      try {
        const res  = await fetch('/api/contact', {
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

      const inputs   = quoteForm.querySelectorAll('input, select, textarea');
      const payload  = {
        full_name:          inputs[0]?.value.trim(),
        institution:        inputs[1]?.value.trim(),
        email:              inputs[2]?.value.trim(),
        phone:              inputs[3]?.value.trim(),
        product_category:   quoteForm.querySelector('select')?.value,
        estimated_quantity: quoteForm.querySelector('[placeholder*="units"]')?.value.trim(),
        product_details:    quoteForm.querySelector('textarea')?.value.trim(),
      };

      try {
        const res  = await fetch('/api/quote', {
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
    card.style.animation = `float ${2.5 + i * 1.5}s ease-in-out infinite alternate`;
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
