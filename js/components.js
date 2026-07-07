/* Medimath Career Institute — Shared Components */

function getCurrentPage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  return path;
}

function renderTopBar() {
  return `
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-left">
          <span>📧 <a href="mailto:${SITE.email}">${SITE.email}</a></span>
          <span>📞 <a href="tel:${SITE.phoneLink}">${SITE.phone}</a></span>
        </div>
        <div class="top-bar-right">
          <span>${SITE.tagline}</span>
        </div>
      </div>
    </div>
  `;
}

function renderNavbar() {
  const current = getCurrentPage();
  const links = NAV_LINKS.map(link => {
    if (link.dropdown) {
      const isActive = link.dropdown.some(d => d.href === current);
      return `
        <div class="nav-dropdown">
          <button class="nav-dropdown-toggle ${isActive ? 'active' : ''}">
            ${link.label} ▾
          </button>
          <div class="nav-dropdown-menu">
            ${link.dropdown.map(d => `<a href="${d.href}" class="${d.href === current ? 'active' : ''}">${d.label}</a>`).join('')}
          </div>
        </div>
      `;
    }
    const cls = link.href === current ? 'active' : '';
    const target = link.external ? ' target="_blank" rel="noopener"' : '';
    return `<a href="${link.href}" class="${cls}"${target}>${link.label}</a>`;
  }).join('');

  return `
    <nav class="navbar">
      <div class="container">
        <a href="index.html" class="logo">
          ${SITE.logo ? `<img src="${SITE.logo}" alt="Medimath" class="logo-img" style="height:44px;width:auto;">` : '<div class="logo-icon">M</div>'}
          <div class="logo-text">
            <h1>Medimath</h1>
            <span>Career Institute</span>
          </div>
        </a>
        <div class="nav-links">${links}</div>
        <div class="nav-actions">
          <a href="${SITE.playStore}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm mobile-cta">Download App</a>
          <button class="btn btn-primary btn-sm" data-modal="demo-modal">Book Free Demo</button>
          <button class="hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="logo">
              ${SITE.logoWhite ? `<img src="${SITE.logoWhite}" alt="Medimath" style="height:50px;width:auto;margin-bottom:12px;">` : '<div class="logo-icon">M</div>'}
              <div class="logo-text">
                <h1>Medimath</h1>
                <span>Career Institute</span>
              </div>
            </a>
            <p>${SITE.tagline}. Empowering students in Indore to achieve their dreams in NEET & JEE with expert faculty and proven results.</p>
            <div class="social-links">
              <a href="${SITE.socials.facebook}" target="_blank" rel="noopener" aria-label="Facebook">f</a>
              <a href="${SITE.socials.instagram}" target="_blank" rel="noopener" aria-label="Instagram">📷</a>
              <a href="${SITE.socials.youtube}" target="_blank" rel="noopener" aria-label="YouTube">▶</a>
              <a href="${SITE.socials.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
            </div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <div class="footer-links">
              <a href="index.html">Home</a>
              <a href="about.html">About Us</a>
              <a href="courses.html">Courses</a>
              <a href="results.html">Results</a>
              <a href="gallery.html">Gallery</a>
              <a href="contact.html">Contact</a>
            </div>
          </div>
          <div>
            <h4>Our Programs</h4>
            <div class="footer-links">
              <a href="neet.html">NEET Coaching</a>
              <a href="jee.html">JEE Coaching</a>
              <a href="courses.html#evening-11">11th Batch</a>
              <a href="courses.html#gurukul-12">12th Gurukul</a>
              <a href="courses.html#neet-dropper-8-8">NEET Dropper</a>
              <a href="courses.html#jee-dropper-8-8">JEE Dropper</a>
            </div>
          </div>
          <div>
            <h4>Contact Us</h4>
            <div class="footer-links">
              <a href="tel:${SITE.phoneLink}">📞 ${SITE.phone}</a>
              <a href="mailto:${SITE.email}">📧 ${SITE.email}</a>
              <p style="padding:6px 0;font-size:0.9rem;line-height:1.6;">📍 ${SITE.address}</p>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} ${SITE.company} All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

function renderFloatingElements() {
  return `
    <div class="floating-cta">
      <button class="sticky-demo-btn" data-modal="demo-modal">📅 Book Free Demo Class</button>
      <a href="${SITE.playStore}" target="_blank" rel="noopener" class="download-app-btn">
        📱 Download App
      </a>
    </div>
    <a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" class="whatsapp-btn" aria-label="Chat on WhatsApp">
      💬
    </a>
  `;
}

function renderDemoModal() {
  return `
    <div class="modal-overlay" id="demo-modal">
      <div class="modal">
        <button class="modal-close" aria-label="Close">&times;</button>
        <h3>Book Your Free Demo Class</h3>
        <p>Experience Medimath's teaching methodology firsthand. Fill in your details and we'll schedule your free demo.</p>
        <form class="demo-form enquiry-form" style="padding:0;box-shadow:none;">
          <div class="form-group">
            <label for="demo-name">Full Name *</label>
            <input type="text" id="demo-name" name="name" required placeholder="Enter your name">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="demo-phone">Phone Number *</label>
            <input type="tel" id="demo-phone" name="phone" required placeholder="10-digit mobile number">
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="demo-class">Class *</label>
            <select id="demo-class" name="class" required>
              <option value="">Select Class</option>
              <option value="11th">11th</option>
              <option value="12th">12th</option>
              <option value="Dropper">Dropper</option>
            </select>
            <span class="form-error"></span>
          </div>
          <div class="form-group">
            <label for="demo-exam">Exam Interest *</label>
            <select id="demo-exam" name="exam" required>
              <option value="">Select Exam</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="Both">Both NEET & JEE</option>
            </select>
            <span class="form-error"></span>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">Book Free Demo Class</button>
          <div class="form-success" style="margin-top:16px;">✅ Demo class booked! We'll contact you within 24 hours.</div>
        </form>
      </div>
    </div>
  `;
}

function renderLightbox() {
  return `
    <div class="lightbox" id="lightbox">
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous">‹</button>
      <div class="lightbox-content"></div>
      <button class="lightbox-nav lightbox-next" aria-label="Next">›</button>
    </div>
  `;
}

function renderEnquiryForm(id = 'enquiry') {
  return `
    <form class="enquiry-form" id="${id}-form">
      <h3 style="font-size:1.35rem;font-weight:800;color:var(--navy);margin-bottom:8px;">Enquire Now</h3>
      <p style="color:var(--gray-500);margin-bottom:24px;">Fill in your details and our counselor will get in touch.</p>
      <div class="form-row">
        <div class="form-group">
          <label for="${id}-name">Full Name *</label>
          <input type="text" id="${id}-name" name="name" required placeholder="Your name">
          <span class="form-error"></span>
        </div>
        <div class="form-group">
          <label for="${id}-phone">Phone Number *</label>
          <input type="tel" id="${id}-phone" name="phone" required placeholder="10-digit mobile">
          <span class="form-error"></span>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="${id}-class">Class *</label>
          <select id="${id}-class" name="class" required>
            <option value="">Select Class</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
            <option value="Dropper">Dropper</option>
          </select>
          <span class="form-error"></span>
        </div>
        <div class="form-group">
          <label for="${id}-exam">Exam Interest *</label>
          <select id="${id}-exam" name="exam" required>
            <option value="">Select Exam</option>
            <option value="NEET">NEET</option>
            <option value="JEE">JEE</option>
            <option value="Both">Both NEET & JEE</option>
          </select>
          <span class="form-error"></span>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-lg" style="width:100%;">Submit Enquiry</button>
      <div class="form-success" style="margin-top:16px;">✅ Thank you! Our team will contact you shortly.</div>
    </form>
  `;
}

function initSharedComponents() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const floating = document.getElementById('floating-elements');
  const modals = document.getElementById('site-modals');

  if (header) header.innerHTML = renderTopBar() + renderNavbar();
  if (footer) footer.innerHTML = renderFooter();
  if (floating) floating.innerHTML = renderFloatingElements();
  if (modals) modals.innerHTML = renderDemoModal() + renderLightbox();
}

document.addEventListener('DOMContentLoaded', initSharedComponents);