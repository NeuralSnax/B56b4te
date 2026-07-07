const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const replacements = [
  [/Medimath Career Institute/gi, 'Biotrons Career Institute'],
  [/Medimath Career Instit/gi, 'Biotrons Career Instit'],
  [/Edumedimath Services Pvt Ltd\./g, 'Biotrons Education Pvt Ltd.'],
  [/info@medimath\.com/g, 'info@biotrons.com'],
  [/medimath career institute/gi, 'Biotrons Career Institute'],
  [/medimath institute/gi, 'Biotrons institute'],
  [/at medimath/gi, 'at Biotrons'],
  [/Medimath's/g, "Biotrons's"],
  [/Medimath/g, 'Biotrons'],
  [/medimath/g, 'biotrons'],
  [/Why Biotrons/g, 'Why Biotrons'],
  [/why-biotrons/g, 'why-biotrons'],
  [/why-medimath/g, 'why-biotrons'],
  [/MediMathhha\.png/g, 'assets/images/logo.svg'],
  [/MediMathhh-logo-white-1\.png/g, 'assets/images/logo-white.svg'],
];

function rebrandFile(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    const next = text.replace(from, to);
    if (next !== text) {
      text = next;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(filePath, text, 'utf8');
  return changed;
}

const contentPath = path.join(ROOT, 'data', 'content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

content.site.name = 'Biotrons Career Institute';
content.site.email = 'info@biotrons.com';
content.site.company = 'Biotrons Education Pvt Ltd.';
content.site.logo = 'assets/images/logo.svg';
content.site.logoWhite = 'assets/images/logo-white.svg';

content.heroImages = [
  'assets/images/hero-campus.jpg',
  'assets/images/gallery-classroom.jpg'
];

if (content.galleryImages?.length) {
  content.galleryImages[0] = {
    src: 'assets/images/gallery-classroom.jpg',
    alt: 'Biotrons Classroom'
  };
  content.galleryImages[1] = {
    src: 'assets/images/hero-campus.jpg',
    alt: 'Biotrons Campus'
  };
}

fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');

const files = [
  'about.html', 'blog.html', 'contact.html', 'courses.html', 'gallery.html',
  'index.html', 'jee.html', 'neet.html', 'results.html', 'testimonials.html',
  'js/components.js', 'js/main.js', 'css/style.css',
  'admin/index.html', 'admin/admin.js', 'admin/admin.css',
  'server/index.js', 'server/sync-data.js', 'package.json',
  'data/admin.config.json'
].map(f => path.join(ROOT, f));

let count = 0;
for (const file of files) {
  if (fs.existsSync(file) && rebrandFile(file)) count++;
}

require('../server/sync-data').syncDataJs(content);

console.log(`Rebranded ${count} files + content.json + data.js`);