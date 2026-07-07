/* Medimath Admin Panel */

const API = '';
let token = localStorage.getItem('adminToken');
let content = null;
let dirty = false;

const $ = id => document.getElementById(id);

// ── API helpers ──
async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (token) headers['X-Admin-Token'] = token;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function markDirty() {
  dirty = true;
  $('save-status').textContent = 'Unsaved changes';
  $('save-status').style.background = '#FEF3C7';
  $('save-status').style.color = '#D97706';
}

function markSaved() {
  dirty = false;
  $('save-status').textContent = 'Saved';
  $('save-status').style.background = '#FFF4EC';
  $('save-status').style.color = '#FF6B00';
}

// ── Auth ──
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('login-error');
  err.style.display = 'none';
  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: { username: $('login-user').value, password: $('login-pass').value }
    });
    token = data.token;
    localStorage.setItem('adminToken', token);
    showDashboard();
  } catch {
    err.textContent = 'Invalid username or password';
    err.style.display = 'block';
  }
});

$('logout-btn').addEventListener('click', async () => {
  try { await api('/api/admin/logout', { method: 'POST' }); } catch {}
  token = null;
  localStorage.removeItem('adminToken');
  $('dashboard').classList.add('hidden');
  $('login-screen').classList.remove('hidden');
});

async function checkAuth() {
  if (!token) return;
  try {
    await api('/api/admin/verify');
    showDashboard();
  } catch {
    token = null;
    localStorage.removeItem('adminToken');
  }
}

async function showDashboard() {
  $('login-screen').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  await loadContent();
}

// ── Load & render ──
async function loadContent() {
  content = await api('/api/content');
  if (content.lastUpdated) {
    $('last-updated').textContent = `Last updated: ${new Date(content.lastUpdated).toLocaleString()}`;
  }
  renderSiteForm();
  renderGallery();
  renderToppers();
  renderHero();
  renderTestimonials();
  renderBatches();
  renderFaqs();
  $('announcement-text').value = content.announcement || '';
  markSaved();
}

function renderSiteForm() {
  const s = content.site;
  $('site-name').value = s.name || '';
  $('site-tagline').value = s.tagline || '';
  $('site-email').value = s.email || '';
  $('site-phone').value = s.phone || '';
  $('site-address').value = s.address || '';
  $('site-whatsapp').value = s.whatsapp || '';
  $('site-testportal').value = s.testPortal || '';
  $('site-playstore').value = s.playStore || '';
  $('site-company').value = s.company || '';
  $('social-facebook').value = s.socials?.facebook || '';
  $('social-instagram').value = s.socials?.instagram || '';
  $('social-youtube').value = s.socials?.youtube || '';
  $('social-linkedin').value = s.socials?.linkedin || '';
  $('vision-text').value = content.visionText || '';
  $('mission-items').value = (content.missionItems || []).join('\n');
}

function collectSiteForm() {
  content.site = {
    ...content.site,
    name: $('site-name').value,
    tagline: $('site-tagline').value,
    email: $('site-email').value,
    phone: $('site-phone').value,
    phoneLink: $('site-phone').value.replace(/\D/g, '').slice(-10),
    address: $('site-address').value,
    whatsapp: $('site-whatsapp').value,
    testPortal: $('site-testportal').value,
    playStore: $('site-playstore').value,
    company: $('site-company').value,
    socials: {
      facebook: $('social-facebook').value,
      instagram: $('social-instagram').value,
      youtube: $('social-youtube').value,
      linkedin: $('social-linkedin').value
    }
  };
  content.visionText = $('vision-text').value;
  content.missionItems = $('mission-items').value.split('\n').map(s => s.trim()).filter(Boolean);
  content.announcement = $('announcement-text').value;
}

// ── Gallery ──
function renderGallery() {
  const grid = $('gallery-grid');
  grid.innerHTML = (content.galleryImages || []).map((img, i) => `
    <div class="image-card">
      <img src="${img.src}" alt="${img.alt || ''}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/></svg>'">
      <div class="overlay">
        <button class="btn btn-danger btn-sm" onclick="deleteGallery(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deleteGallery = async function(index) {
  if (!confirm('Delete this gallery image?')) return;
  try {
    await api(`/api/gallery/${index}`, { method: 'DELETE' });
    content = await api('/api/content');
    renderGallery();
    toast('Image deleted');
  } catch (e) {
    toast(e.message, 'error');
  }
};

const galleryZone = $('gallery-upload-zone');
const galleryInput = $('gallery-file-input');

galleryZone.addEventListener('click', () => galleryInput.click());
galleryZone.addEventListener('dragover', e => { e.preventDefault(); galleryZone.classList.add('dragover'); });
galleryZone.addEventListener('dragleave', () => galleryZone.classList.remove('dragover'));
galleryZone.addEventListener('drop', e => {
  e.preventDefault();
  galleryZone.classList.remove('dragover');
  uploadGalleryFiles(e.dataTransfer.files);
});

galleryInput.addEventListener('change', () => uploadGalleryFiles(galleryInput.files));

async function uploadGalleryFiles(files) {
  if (!files.length) return;
  let uploaded = 0;
  for (const file of files) {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('alt', 'Medimath Gallery');
    try {
      await api('/api/gallery', { method: 'POST', body: fd });
      uploaded++;
    } catch (e) {
      toast(e.message, 'error');
    }
  }
  if (uploaded) {
    content = await api('/api/content');
    renderGallery();
    toast(`Uploaded ${uploaded} image(s) & published`);
  }
  galleryInput.value = '';
}

// ── Toppers ──
function renderToppers() {
  $('toppers-list').innerHTML = (content.toppers || []).map((t, i) => `
    <div class="list-item">
      ${t.image ? `<img src="${t.image}" alt="${t.name}">` : '<div style="width:60px;height:60px;background:#FFF4EC;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#FF6B00;">' + t.initials + '</div>'}
      <div class="list-item-content">
        <h4>${t.name}</h4>
        <p>${t.achievement || ''}</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteTopper(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deleteTopper = async function(index) {
  if (!confirm('Delete this topper?')) return;
  try {
    await api(`/api/toppers/${index}`, { method: 'DELETE' });
    content = await api('/api/content');
    renderToppers();
    toast('Topper deleted');
  } catch (e) {
    toast(e.message, 'error');
  }
};

$('topper-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/toppers', { method: 'POST', body: fd });
    content.toppers.push(data.topper);
    renderToppers();
    e.target.reset();
    toast('Topper added & published');
    content = await api('/api/content');
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ── Hero ──
function renderHero() {
  $('hero-grid').innerHTML = (content.heroImages || []).map((src, i) => `
    <div class="image-card">
      <img src="${src}" alt="Hero ${i + 1}">
      <div class="overlay">
        <button class="btn btn-danger btn-sm" onclick="deleteHero(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deleteHero = async function(index) {
  if (!confirm('Delete this hero banner?')) return;
  try {
    await api(`/api/hero/${index}`, { method: 'DELETE' });
    content.heroImages.splice(index, 1);
    renderHero();
    toast('Banner removed');
  } catch (e) {
    toast(e.message, 'error');
  }
};

$('hero-form').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/hero', { method: 'POST', body: fd });
    content.heroImages.push(data.src);
    renderHero();
    e.target.reset();
    toast('Hero banner added & published');
  } catch (err) {
    toast(err.message, 'error');
  }
});

// ── Testimonials ──
function renderTestimonials() {
  $('testimonials-list').innerHTML = (content.testimonials || []).map((t, i) => `
    <div class="list-item">
      <div class="list-item-content" style="flex:1;">
        <h4>${t.author}</h4>
        <p>"${t.quote}"</p>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteTestimonial(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.deleteTestimonial = function(index) {
  if (!confirm('Delete this testimonial?')) return;
  content.testimonials.splice(index, 1);
  markDirty();
  renderTestimonials();
};

$('add-testimonial-btn').addEventListener('click', () => {
  const quote = $('new-testimonial-quote').value.trim();
  const author = $('new-testimonial-author').value.trim();
  if (!quote || !author) return toast('Quote and author required', 'error');
  const initials = author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  content.testimonials.push({
    quote,
    author,
    role: $('new-testimonial-role').value || 'Student / Parent',
    initials
  });
  $('new-testimonial-quote').value = '';
  $('new-testimonial-author').value = '';
  markDirty();
  renderTestimonials();
  toast('Testimonial added (save to publish)');
});

// ── Batches ──
function renderBatches() {
  $('batches-list').innerHTML = (content.batches || []).map((b, i) => `
    <div class="form-group" style="padding:16px;background:var(--gray-50);border-radius:8px;margin-bottom:12px;">
      <label style="font-size:0.95rem;">${b.title}</label>
      <textarea data-batch="${i}" rows="2" style="margin-top:8px;">${b.desc || ''}</textarea>
    </div>
  `).join('');

  $('batches-list').querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', () => {
      content.batches[parseInt(ta.dataset.batch)].desc = ta.value;
      markDirty();
    });
  });
}

// ── FAQs ──
function renderFaqs() {
  $('faqs-list').innerHTML = (content.faqs || []).map((f, i) => `
    <div class="list-item" style="flex-direction:column;align-items:stretch;">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <h4 style="font-size:0.9rem;color:var(--navy);flex:1;">${f.q}</h4>
        <button class="btn btn-danger btn-sm" onclick="deleteFaq(${i})">Delete</button>
      </div>
      <p style="font-size:0.85rem;color:var(--gray-500);margin-top:8px;">${f.a}</p>
    </div>
  `).join('');
}

window.deleteFaq = function(index) {
  if (!confirm('Delete this FAQ?')) return;
  content.faqs.splice(index, 1);
  markDirty();
  renderFaqs();
};

$('add-faq-btn').addEventListener('click', () => {
  const q = $('new-faq-q').value.trim();
  const a = $('new-faq-a').value.trim();
  if (!q || !a) return toast('Question and answer required', 'error');
  content.faqs.push({ q, a });
  $('new-faq-q').value = '';
  $('new-faq-a').value = '';
  markDirty();
  renderFaqs();
});

// ── Save all ──
$('save-all-btn').addEventListener('click', async () => {
  collectSiteForm();
  try {
    const data = await api('/api/content', { method: 'PUT', body: content });
    $('last-updated').textContent = `Last updated: ${new Date(data.lastUpdated).toLocaleString()}`;
    markSaved();
    toast('Published! Website updated.');
  } catch (e) {
    toast(e.message, 'error');
  }
});

// Track site form changes
['site-name','site-tagline','site-email','site-phone','site-address','site-whatsapp',
 'site-testportal','site-playstore','site-company','social-facebook','social-instagram',
 'social-youtube','social-linkedin','vision-text','mission-items','announcement-text'
].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener('input', markDirty);
});

// ── Password change ──
$('change-pass-btn').addEventListener('click', async () => {
  const cur = $('current-pass').value;
  const nw = $('new-pass').value;
  const conf = $('confirm-pass').value;
  if (nw !== conf) return toast('Passwords do not match', 'error');
  if (nw.length < 6) return toast('Password must be 6+ characters', 'error');
  try {
    await api('/api/admin/change-password', {
      method: 'POST',
      body: { currentPassword: cur, newPassword: nw }
    });
    toast('Password updated');
    $('current-pass').value = '';
    $('new-pass').value = '';
    $('confirm-pass').value = '';
  } catch (e) {
    toast(e.message, 'error');
  }
});

// ── Navigation ──
const titles = {
  site: 'Site Settings', gallery: 'Gallery Photos', toppers: 'Toppers',
  hero: 'Hero Banners', testimonials: 'Testimonials', batches: 'Batches',
  faqs: 'FAQs', announcement: 'Announcement', password: 'Change Password'
};

document.querySelectorAll('.sidebar-nav button[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
    $(`panel-${section}`).classList.add('active');
    $('section-title').textContent = titles[section] || section;
  });
});

// ── Init ──
checkAuth();