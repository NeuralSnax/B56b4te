const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { loadContent, syncDataJs } = require('./sync-data');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const UPLOADS_DIR = path.join(ROOT, 'assets', 'images', 'uploads');
const ADMIN_CONFIG = path.join(ROOT, 'data', 'admin.config.json');

const app = express();
const PORT = process.env.PORT || 3000;

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });

if (!fs.existsSync(CONTENT_PATH)) {
  require('./import-data');
}

const adminConfig = JSON.parse(fs.readFileSync(ADMIN_CONFIG, 'utf8'));
const sessions = new Map();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(ROOT));
app.use('/admin', express.static(path.join(ROOT, 'admin')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files allowed (jpg, png, gif, webp)'));
  }
});

function saveContent(content) {
  content.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf8');
  syncDataJs(content);
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminUser = sessions.get(token);
  next();
}

// ── Auth ──
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminConfig.username && password === adminConfig.password) {
    const token = createToken();
    sessions.set(token, { username, loginAt: Date.now() });
    return res.json({ token, username });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/admin/logout', authMiddleware, (req, res) => {
  const token = req.headers['x-admin-token'];
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/admin/verify', authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.adminUser });
});

// ── Content ──
app.get('/api/content', (_req, res) => {
  try {
    res.json(loadContent());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/content', authMiddleware, (req, res) => {
  try {
    const content = req.body;
    saveContent(content);
    res.json({ ok: true, lastUpdated: content.lastUpdated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Partial updates ──
app.patch('/api/content/site', authMiddleware, (req, res) => {
  const content = loadContent();
  content.site = { ...content.site, ...req.body };
  saveContent(content);
  res.json({ ok: true, site: content.site });
});

app.patch('/api/content/announcement', authMiddleware, (req, res) => {
  const content = loadContent();
  content.announcement = req.body.announcement || '';
  saveContent(content);
  res.json({ ok: true });
});

// ── Image upload ──
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/assets/images/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

app.post('/api/upload/multiple', authMiddleware, upload.array('images', 20), (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });
  const urls = req.files.map(f => ({
    url: `/assets/images/uploads/${f.filename}`,
    filename: f.filename
  }));
  res.json({ urls });
});

app.delete('/api/upload/:filename', authMiddleware, (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ ok: true });
});

// ── Gallery helpers ──
app.post('/api/gallery', authMiddleware, upload.single('image'), (req, res) => {
  const content = loadContent();
  const alt = req.body.alt || 'Biotrons Gallery';
  let src = req.body.src || '';

  if (req.file) {
    src = `/assets/images/uploads/${req.file.filename}`;
  }
  if (!src) return res.status(400).json({ error: 'Image URL or file required' });

  content.galleryImages.push({ src, alt });
  saveContent(content);
  res.json({ ok: true, image: { src, alt } });
});

app.delete('/api/gallery/:index', authMiddleware, (req, res) => {
  const content = loadContent();
  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= content.galleryImages.length) {
    return res.status(404).json({ error: 'Image not found' });
  }
  content.galleryImages.splice(idx, 1);
  saveContent(content);
  res.json({ ok: true });
});

// ── Topper helpers ──
app.post('/api/toppers', authMiddleware, upload.single('image'), (req, res) => {
  const content = loadContent();
  const { name, achievement } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  let image = req.body.image || '';
  if (req.file) image = `/assets/images/uploads/${req.file.filename}`;

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const topper = { name, achievement: achievement || '', image, initials };
  content.toppers.push(topper);
  if (content.results?.['2024']) {
    content.results['2024'].push({ name, exam: achievement?.includes('JEE') || achievement?.includes('IIT') ? 'JEE' : 'NEET', rank: achievement, image });
  }
  saveContent(content);
  res.json({ ok: true, topper });
});

app.delete('/api/toppers/:index', authMiddleware, (req, res) => {
  const content = loadContent();
  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= content.toppers.length) {
    return res.status(404).json({ error: 'Topper not found' });
  }
  const removed = content.toppers.splice(idx, 1)[0];
  saveContent(content);
  res.json({ ok: true, removed });
});

// ── Hero images ──
app.post('/api/hero', authMiddleware, upload.single('image'), (req, res) => {
  const content = loadContent();
  let src = req.body.src || '';
  if (req.file) src = `/assets/images/uploads/${req.file.filename}`;
  if (!src) return res.status(400).json({ error: 'Image required' });
  content.heroImages.push(src);
  saveContent(content);
  res.json({ ok: true, src });
});

app.delete('/api/hero/:index', authMiddleware, (req, res) => {
  const content = loadContent();
  const idx = parseInt(req.params.index, 10);
  content.heroImages.splice(idx, 1);
  saveContent(content);
  res.json({ ok: true });
});

// ── Password change ──
app.post('/api/admin/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (currentPassword !== adminConfig.password) {
    return res.status(401).json({ error: 'Current password incorrect' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  adminConfig.password = newPassword;
  fs.writeFileSync(ADMIN_CONFIG, JSON.stringify(adminConfig, null, 2), 'utf8');
  res.json({ ok: true });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(ROOT, 'admin', 'index.html'));
});

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`\n  Biotrons Website + Admin Panel`);
  console.log(`  Website:  http://localhost:${PORT}`);
  console.log(`  Admin:    http://localhost:${PORT}/admin`);
  console.log(`  Login:    ${adminConfig.username} / ${adminConfig.password}\n`);
});