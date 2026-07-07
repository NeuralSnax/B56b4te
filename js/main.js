/* Biotrons Career Institute — Main JavaScript */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHeroSlider();
  initCarousels();
  initFAQ();
  initForms();
  initLightbox();
  initCountdown();
  initResultsTabs();
  initModals();
  initMobileNav();
});

/* ── Navbar ── */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('shrink', window.scrollY > 50);
  });
}

function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('mobile-open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('mobile-open');
    });
  });

  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = toggle.closest('.nav-dropdown');
      parent.classList.toggle('open');
    });
  });
}

/* ── Hero Slider ── */
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  let current = 0;
  let interval;

  function goTo(index) {
    slides[current].classList.remove('active');
    if (dots[current]) dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (dots[current]) dots[current].classList.add('active');
  }

  function startAutoplay() {
    interval = setInterval(() => goTo(current + 1), 5000);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(interval);
      goTo(i);
      startAutoplay();
    });
  });

  let touchStartX = 0;
  const slider = document.querySelector('.hero-slider');
  if (slider) {
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        clearInterval(interval);
        goTo(diff > 0 ? current + 1 : current - 1);
        startAutoplay();
      }
    }, { passive: true });
  }

  startAutoplay();
}

/* ── Carousels ── */
function initCarousels() {
  document.querySelectorAll('.testimonials-carousel').forEach(carousel => {
    const track = carousel.querySelector('.testimonials-track');
    const cards = carousel.querySelectorAll('.testimonial-card');
    const prev = carousel.querySelector('.carousel-btn.prev');
    const next = carousel.querySelector('.carousel-btn.next');
    if (!track || !cards.length) return;

    let index = 0;
    let visible = getVisibleCount();

    function getVisibleCount() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function update() {
      visible = getVisibleCount();
      const maxIndex = Math.max(0, cards.length - visible);
      if (index > maxIndex) index = maxIndex;
      const cardWidth = cards[0].offsetWidth;
      track.style.transform = `translateX(-${index * cardWidth}px)`;
    }

    if (prev) prev.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
    if (next) next.addEventListener('click', () => {
      const maxIndex = Math.max(0, cards.length - visible);
      index = Math.min(maxIndex, index + 1);
      update();
    });

    let autoInterval = setInterval(() => {
      const maxIndex = Math.max(0, cards.length - visible);
      index = index >= maxIndex ? 0 : index + 1;
      update();
    }, 4000);

    carousel.addEventListener('mouseenter', () => clearInterval(autoInterval));
    carousel.addEventListener('mouseleave', () => {
      autoInterval = setInterval(() => {
        const maxIndex = Math.max(0, cards.length - visible);
        index = index >= maxIndex ? 0 : index + 1;
        update();
      }, 4000);
    });

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        const maxIndex = Math.max(0, cards.length - visible);
        index = diff > 0 ? Math.min(maxIndex, index + 1) : Math.max(0, index - 1);
        update();
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  });
}

/* ── FAQ Accordion ── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      item.closest('.faq-list')?.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ── Forms ── */
function initForms() {
  document.querySelectorAll('.enquiry-form, .demo-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      const success = form.querySelector('.form-success');
      if (success) {
        success.classList.add('show');
        form.reset();
        setTimeout(() => success.classList.remove('show'), 5000);
      }
    });

    form.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('input', () => clearFieldError(field));
      field.addEventListener('blur', () => validateField(field));
    });
  });
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    if (!validateField(field)) valid = false;
  });
  return valid;
}

function validateField(field) {
  const errorEl = field.parentElement.querySelector('.form-error');
  let message = '';

  if (field.hasAttribute('required') && !field.value.trim()) {
    message = 'This field is required.';
  } else if (field.type === 'tel' && field.value.trim()) {
    const phone = field.value.replace(/\D/g, '');
    if (phone.length < 10) message = 'Enter a valid 10-digit phone number.';
  } else if (field.type === 'email' && field.value.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) message = 'Enter a valid email address.';
  }

  if (message) {
    field.classList.add('error');
    if (errorEl) { errorEl.textContent = message; errorEl.classList.add('show'); }
    return false;
  }

  clearFieldError(field);
  return true;
}

function clearFieldError(field) {
  field.classList.remove('error');
  const errorEl = field.parentElement.querySelector('.form-error');
  if (errorEl) errorEl.classList.remove('show');
}

/* ── Lightbox ── */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const items = document.querySelectorAll('[data-lightbox]');
  let currentIndex = 0;

  items.forEach((item, i) => {
    item.addEventListener('click', () => {
      currentIndex = i;
      openLightbox(item);
    });
  });

  function openLightbox(item) {
    const content = lightbox.querySelector('.lightbox-content');
    const img = item.querySelector('img');
    const placeholder = item.dataset.lightbox || item.querySelector('.gallery-placeholder')?.textContent || '📷';

    if (img) {
      content.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    } else {
      content.innerHTML = `<div style="width:600px;height:400px;background:linear-gradient(135deg,#EFF6FF,#FFF4EC);display:flex;align-items:center;justify-content:center;font-size:6rem;border-radius:12px;">${placeholder}</div>`;
    }
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    openLightbox(items[currentIndex]);
  });

  lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % items.length;
    openLightbox(items[currentIndex]);
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + items.length) % items.length; openLightbox(items[currentIndex]); }
    if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % items.length; openLightbox(items[currentIndex]); }
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ── Countdown ── */
function initCountdown() {
  const banner = document.querySelector('.urgency-banner .countdown');
  if (!banner) return;

  const target = new Date();
  target.setDate(target.getDate() + 14);

  function update() {
    const diff = target - new Date();
    if (diff <= 0) return;

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    banner.innerHTML = `
      <span class="countdown-item"><strong>${days}</strong>Days</span>
      <span class="countdown-item"><strong>${hours}</strong>Hrs</span>
      <span class="countdown-item"><strong>${mins}</strong>Min</span>
      <span class="countdown-item"><strong>${secs}</strong>Sec</span>
    `;
  }

  update();
  setInterval(update, 1000);
}

/* ── Results Year Tabs ── */
function initResultsTabs() {
  const tabs = document.querySelectorAll('.year-tab');
  const panels = document.querySelectorAll('.results-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.style.display = 'none');
      tab.classList.add('active');
      const panel = document.getElementById('results-' + tab.dataset.year);
      if (panel) panel.style.display = 'block';
    });
  });
}

/* ── Modals ── */
function initModals() {
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      const modal = document.getElementById(trigger.dataset.modal);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.querySelector('.modal-close')?.addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
    }
  });
}

function closeModal(overlay) {
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

/* ── Render Helpers ── */
function renderBatches(container, limit) {
  if (!container || typeof BATCHES === 'undefined') return;
  const batches = limit ? BATCHES.slice(0, limit) : BATCHES;

  container.innerHTML = batches.map(b => `
    <div class="batch-card">
      <div class="batch-card-icon">📚</div>
      <h3>${b.title}</h3>
      <p>${b.desc}</p>
      <div class="batch-meta">
        ${b.tags.map(t => `<span class="${t.toLowerCase() === 'jee' ? 'jee' : t.toLowerCase() === 'neet' ? 'neet' : ''}">${t}</span>`).join('')}
        <span>${b.timing}</span>
        <span>${b.medium}</span>
      </div>
      <a href="courses.html#${b.id}" class="btn btn-primary btn-sm">Enroll Now</a>
    </div>
  `).join('');
}

function renderToppers(container, limit) {
  if (!container || typeof TOPPERS === 'undefined') return;
  const toppers = limit ? TOPPERS.slice(0, limit) : TOPPERS;

  container.innerHTML = toppers.map(t => `
    <div class="topper-card">
      <div class="topper-avatar">
        ${t.image ? `<img src="${t.image}" alt="${t.name}" loading="lazy">` : t.initials}
      </div>
      <h3>${t.name}</h3>
      <span class="topper-tag ${t.achievement.includes('IIT') || t.achievement.includes('JEE') ? 'gold' : ''}">${t.achievement}</span>
    </div>
  `).join('');
}

function renderTestimonials(container) {
  if (!container || typeof TESTIMONIALS === 'undefined') return;

  container.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-inner">
        <div class="stars">★★★★★</div>
        <blockquote>"${t.quote}"</blockquote>
        <div class="testimonial-author">
          <div class="testimonial-author-avatar">${t.initials}</div>
          <div>
            <h4>${t.author}</h4>
            <span>${t.role}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderFAQ(container) {
  if (!container || typeof FAQS === 'undefined') return;

  container.innerHTML = FAQS.map(f => `
    <div class="faq-item">
      <button class="faq-question" aria-expanded="false">
        ${f.q}
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${f.a}</div>
      </div>
    </div>
  `).join('');
}

function renderGallery(container, limit) {
  if (!container || typeof GALLERY_IMAGES === 'undefined') return;
  const images = limit ? GALLERY_IMAGES.slice(0, limit) : GALLERY_IMAGES;

  container.innerHTML = images.map(g => `
    <div class="gallery-item" data-lightbox>
      ${g.src
        ? `<img src="${g.src}" alt="${g.alt || 'Biotrons Gallery'}" loading="lazy">`
        : `<div class="gallery-placeholder">${g.icon || '📷'}</div>`}
    </div>
  `).join('');
}

function renderBlog(container) {
  if (!container || typeof BLOG_POSTS === 'undefined') return;

  container.innerHTML = BLOG_POSTS.map(b => `
    <article class="blog-card">
      <div class="blog-card-image">${b.icon || '📚'}</div>
      <div class="blog-card-body">
        <div class="blog-card-meta">${b.date}</div>
        <h3>${b.title}</h3>
        <p>${b.excerpt}</p>
        <a href="${b.link || '#'}" ${b.link ? 'target="_blank" rel="noopener"' : ''} class="btn btn-outline-dark btn-sm">Read More</a>
      </div>
    </article>
  `).join('');
}

function renderResults(container) {
  if (!container || typeof RESULTS === 'undefined') return;
  const years = Object.keys(RESULTS).sort((a, b) => b - a);

  let tabsHTML = years.map((y, i) =>
    `<button class="year-tab ${i === 0 ? 'active' : ''}" data-year="${y}">${y}</button>`
  ).join('');

  let panelsHTML = years.map((y, i) => `
    <div class="results-panel" id="results-${y}" style="display:${i === 0 ? 'block' : 'none'}">
      <div class="results-table-wrap">
        <table class="results-table">
          <thead>
            <tr><th>Student</th><th>Exam</th><th>Achievement</th></tr>
          </thead>
          <tbody>
            ${RESULTS[y].map(r => `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td>${r.exam}</td>
                <td><span class="rank-badge">${r.rank}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="results-year-tabs">${tabsHTML}</div>
    ${panelsHTML}
  `;

  initResultsTabs();
}

function initHeroImages() {
  if (typeof HERO_IMAGES === 'undefined') return;
  document.querySelectorAll('.hero-slide-bg').forEach((el, i) => {
    if (HERO_IMAGES[i]) {
      el.style.backgroundImage = `url('${HERO_IMAGES[i]}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }
  });
}

function renderFeatures(container) {
  if (!container || typeof FEATURES === 'undefined') return;
  container.innerHTML = FEATURES.map(f => `
    <div class="feature-card">
      <div class="feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>
  `).join('');
}

function renderVisionMission() {
  const visionEl = document.getElementById('vision-text');
  const missionEl = document.getElementById('mission-items');
  if (visionEl && typeof VISION_TEXT !== 'undefined') {
    visionEl.textContent = VISION_TEXT;
  }
  if (missionEl && typeof MISSION_ITEMS !== 'undefined') {
    missionEl.innerHTML = MISSION_ITEMS.map(item =>
      `<li style="padding-left:28px;position:relative;color:var(--gray-600);line-height:1.7;margin-bottom:10px;">
        <span style="position:absolute;left:0;color:var(--green);font-weight:700;">✓</span>${item}
      </li>`
    ).join('');
  }
}