const fs = require('fs');
const path = require('path');
const { syncDataJs } = require('../server/sync-data');

const contentPath = path.join(__dirname, '..', 'data', 'content.json');
let text = fs.readFileSync(contentPath, 'utf8');

text = text.replace(/https:\/\/www\.biotrons\.in/g, 'https://www.medimath.in');

const content = JSON.parse(text);

content.heroImages = [
  'assets/images/hero-campus.jpg',
  'assets/images/gallery-classroom.jpg'
];

if (content.galleryImages?.length >= 2) {
  content.galleryImages[0] = { src: 'assets/images/gallery-classroom.jpg', alt: 'Biotrons Classroom' };
  content.galleryImages[1] = { src: 'assets/images/hero-campus.jpg', alt: 'Biotrons Campus' };
}

fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
syncDataJs(content);
console.log('URLs fixed');