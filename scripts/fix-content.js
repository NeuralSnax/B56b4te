const fs = require('fs');
const path = require('path');
const { syncDataJs } = require('../server/sync-data');

const contentPath = path.join(__dirname, '..', 'data', 'content.json');
let text = fs.readFileSync(contentPath, 'utf8');

const reps = [
  [/Medimath Career Institute/gi, 'Biotrons Career Institute'],
  [/Medimath's/g, "Biotrons's"],
  [/Medimath/g, 'Biotrons'],
  [/medimath/g, 'biotrons'],
  [/Medimath Gallery/g, 'Biotrons Gallery'],
];

for (const [from, to] of reps) text = text.replace(from, to);

const content = JSON.parse(text);
content.site.logo = 'assets/images/logo.svg';
content.site.logoWhite = 'assets/images/logo-white.svg';
content.site.name = 'Biotrons Career Institute';
content.site.email = 'info@biotrons.com';
content.site.company = 'Biotrons Education Pvt Ltd.';

fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
syncDataJs(content);
console.log('content.json fixed');