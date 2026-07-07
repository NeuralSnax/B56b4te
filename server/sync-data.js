const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_PATH = path.join(ROOT, 'data', 'content.json');
const DATA_JS_PATH = path.join(ROOT, 'js', 'data.js');

function loadContent() {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
}

function generateDataJs(content) {
  const { site, batches, toppers, testimonials, faqs, blogPosts, galleryImages, heroImages, visionText, missionItems, features, results, announcement } = content;

  const navLinks = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'SITE.testPortal', label: 'Test Portal', external: true },
    { href: 'courses.html', label: 'Courses' },
    { href: 'results.html', label: 'Results' },
    { href: 'gallery.html', label: 'Gallery' },
    { href: 'testimonials.html', label: 'Testimonials' },
    { href: 'blog.html', label: 'Blog' },
    { label: 'Exams', dropdown: [{ href: 'neet.html', label: 'NEET' }, { href: 'jee.html', label: 'JEE' }] },
    { href: 'contact.html', label: 'Contact' }
  ];

  return `/* Medimath Career Institute — Auto-generated from data/content.json */
/* Last updated: ${new Date().toISOString()} */

const SITE = ${JSON.stringify(site, null, 2)};

const NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'about.html', label: 'About' },
  { href: SITE.testPortal, label: 'Test Portal', external: true },
  { href: 'courses.html', label: 'Courses' },
  { href: 'results.html', label: 'Results' },
  { href: 'gallery.html', label: 'Gallery' },
  { href: 'testimonials.html', label: 'Testimonials' },
  { href: 'blog.html', label: 'Blog' },
  { label: 'Exams', dropdown: [{ href: 'neet.html', label: 'NEET' }, { href: 'jee.html', label: 'JEE' }] },
  { href: 'contact.html', label: 'Contact' }
];

const BATCHES = ${JSON.stringify(batches, null, 2)};

const TOPPERS = ${JSON.stringify(toppers, null, 2)};

const TESTIMONIALS = ${JSON.stringify(testimonials, null, 2)};

const FAQS = ${JSON.stringify(faqs, null, 2)};

const BLOG_POSTS = ${JSON.stringify(blogPosts, null, 2)};

const GALLERY_IMAGES = ${JSON.stringify(galleryImages, null, 2)};

const HERO_IMAGES = ${JSON.stringify(heroImages, null, 2)};

const VISION_TEXT = ${JSON.stringify(visionText)};

const MISSION_ITEMS = ${JSON.stringify(missionItems, null, 2)};

const FEATURES = ${JSON.stringify(features, null, 2)};

const RESULTS = ${JSON.stringify(results, null, 2)};

const ANNOUNCEMENT = ${JSON.stringify(announcement || '')};
`;
}

function syncDataJs(content) {
  const data = content || loadContent();
  fs.writeFileSync(DATA_JS_PATH, generateDataJs(data), 'utf8');
  return DATA_JS_PATH;
}

module.exports = { loadContent, syncDataJs, generateDataJs };