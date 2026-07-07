const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA_JS = path.join(ROOT, 'js', 'data.js');
const CONTENT_JSON = path.join(ROOT, 'data', 'content.json');

const code = fs.readFileSync(DATA_JS, 'utf8');
const sandbox = { exports: {} };
const wrapped = code + `
;exports.data = {
  site: typeof SITE !== 'undefined' ? SITE : {},
  batches: typeof BATCHES !== 'undefined' ? BATCHES : [],
  toppers: typeof TOPPERS !== 'undefined' ? TOPPERS : [],
  testimonials: typeof TESTIMONIALS !== 'undefined' ? TESTIMONIALS : [],
  faqs: typeof FAQS !== 'undefined' ? FAQS : [],
  blogPosts: typeof BLOG_POSTS !== 'undefined' ? BLOG_POSTS : [],
  galleryImages: typeof GALLERY_IMAGES !== 'undefined' ? GALLERY_IMAGES : [],
  heroImages: typeof HERO_IMAGES !== 'undefined' ? HERO_IMAGES : [],
  visionText: typeof VISION_TEXT !== 'undefined' ? VISION_TEXT : '',
  missionItems: typeof MISSION_ITEMS !== 'undefined' ? MISSION_ITEMS : [],
  features: typeof FEATURES !== 'undefined' ? FEATURES : [],
  results: typeof RESULTS !== 'undefined' ? RESULTS : {},
  announcement: typeof ANNOUNCEMENT !== 'undefined' ? ANNOUNCEMENT : 'New Batch Starting Soon — Limited Seats Available!'
};`;
vm.runInNewContext(wrapped, sandbox);

const d = sandbox.exports.data;
const content = {
  site: d.site,
  batches: d.batches,
  toppers: d.toppers,
  testimonials: d.testimonials,
  faqs: d.faqs,
  blogPosts: d.blogPosts,
  galleryImages: d.galleryImages,
  heroImages: d.heroImages,
  visionText: d.visionText,
  missionItems: d.missionItems,
  features: d.features,
  results: d.results,
  announcement: d.announcement,
  lastUpdated: new Date().toISOString()
};

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(CONTENT_JSON, JSON.stringify(content, null, 2), 'utf8');
console.log('Imported to data/content.json');
console.log(`  Toppers: ${content.toppers.length}`);
console.log(`  Gallery: ${content.galleryImages.length}`);
console.log(`  Testimonials: ${content.testimonials.length}`);