#!/usr/bin/env python3
"""Build data.js from scraped medimath.in content."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
home = (ROOT / "scrape_home.html").read_text(encoding="utf-8")

# Testimonials
testimonials = []
for m in re.finditer(
    r'class="testimonials-item__text">(.*?)</p>.*?class="testimonials-item__name">([^<]+)',
    home, re.DOTALL
):
    quote = re.sub(r"\s+", " ", m.group(1).strip())
    author = m.group(2).strip()
    initials = "".join(w[0] for w in author.split()[:2]).upper()
    testimonials.append({
        "quote": quote,
        "author": author,
        "role": "Student / Parent",
        "initials": initials
    })

# Deduplicate testimonials by quote
seen = set()
unique_tests = []
for t in testimonials:
    if t["quote"] not in seen:
        seen.add(t["quote"])
        unique_tests.append(t)

# Toppers from scraped data
scraped = json.loads((ROOT / "scraped_data" / "medimath_data.json").read_text(encoding="utf-8"))
toppers = []
for t in scraped["toppers"]:
    initials = "".join(w[0] for w in t["name"].split()[:2]).upper()
    toppers.append({
        "name": t["name"],
        "achievement": t["achievement"],
        "image": t["image"],
        "initials": initials
    })

# Gallery images
gallery_urls = []
for p in scraped["pages"]:
    if p["slug"] == "gallery":
        gallery_urls = list(dict.fromkeys(
            re.findall(
                r'href="(https://www\.medimath\.in/wp-content/uploads/[^"]+\.(?:jpeg|jpg|png))"',
                p["content_html"]
            )
        ))
        break

# Footer gallery fallback
if not gallery_urls:
    gallery_urls = list(dict.fromkeys(
        re.findall(
            r'src="(https://www\.medimath\.in/wp-content/uploads/2024/04/[^"]+\.jpg)"',
            home
        )
    ))

# Hero images
hero_images = list(dict.fromkeys([
    "https://www.medimath.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-22-at-16.48.48_5e84d1ce.jpg",
    "https://www.medimath.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-22-at-16.48.48_0a8b6f77.jpg",
    "https://www.medimath.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-22-at-16.48.48_bd0acdea.jpg",
    "https://www.medimath.in/wp-content/uploads/2025/03/d8b82d4c-0d80-43d9-9b1b-3236e01b0482.png",
]))

# Blog posts
blog_posts = []
for post in scraped["blog_posts"]:
    blog_posts.append({
        "title": post["title"],
        "excerpt": post["excerpt"][:200] + "..." if len(post["excerpt"]) > 200 else post["excerpt"],
        "date": post["date"][:10],
        "link": post["link"],
        "icon": "📚"
    })

# FAQs from homepage HTML
faqs = []
for m in re.finditer(
    r'<h4>\s*(Q\.[^<]+)<.*?<p>(.*?)</p>',
    home, re.DOTALL
):
    q = re.sub(r"\s+", " ", m.group(1).strip())
    a = re.sub(r"\s+", " ", m.group(2).strip())
    if q.startswith("Q."):
        faqs.append({"q": q, "a": a})

# Vision & Mission text
vision_match = re.search(r'Our Vision.*?<p[^>]*>(.*?)</p>', home, re.DOTALL)
mission_items = re.findall(r'elementor-icon-list-text">([^<]+)</span>', home)
mission_items = [m for m in mission_items if any(
    w in m.lower() for w in ["ambience", "problems", "education", "collaborate", "leaders"]
)]

# Features text
features = {
    "expert": "Our team consists of seasoned educators who blend practical expertise with deep subject knowledge in every JEE coaching and NEET preparation session. More than just instructors, they're dedicated mentors invested in your academic journey.",
    "customized": "We recognize that each learner is unique. At Medimath Career Institute, our personalized JEE coaching in Indore and NEET preparation are tailored to your individual needs through one-on-one support.",
    "success": "With a strong history of guiding students to academic breakthroughs, Medimath Career Institute is your trusted partner for JEE and NEET coaching in Indore. Our students experience remarkable growth in grades, confidence, and subject mastery."
}

# Build JS output
output = {
    "testimonials_count": len(unique_tests),
    "toppers_count": len(toppers),
    "gallery_count": len(gallery_urls),
    "blog_count": len(blog_posts),
    "faqs_count": len(faqs),
}

# Write summary
(ROOT / "scraped_data" / "build_summary.json").write_text(
    json.dumps(output, indent=2), encoding="utf-8"
)

# Generate data.js content
js_lines = ['/* Medimath Career Institute — Data scraped from medimath.in */', '']

js_lines.append("const SITE = {")
js_lines.append("  name: 'Medimath Career Institute',")
js_lines.append("  tagline: 'JEE Institute in Indore | NEET Institute in Indore',")
js_lines.append("  email: 'info@medimath.com',")
js_lines.append("  phone: '+91 11811727',")
js_lines.append("  phoneLink: '9111811727',")
js_lines.append("  address: '202, 203, Landmark - Nissan Car Showroom, Vibrant Tower, Gita Bhawan Rd, Manorama Ganj, Indore, MP 452018',")
js_lines.append("  company: 'Edumedimath Services Pvt Ltd.',")
js_lines.append("  logo: 'https://www.medimath.in/wp-content/uploads/2024/04/MediMathhha.png',")
js_lines.append("  logoWhite: 'https://www.medimath.in/wp-content/uploads/2024/04/MediMathhh-logo-white-1.png',")
js_lines.append("  testPortal: 'https://web.classplusapp.com/login',")
js_lines.append("  playStore: 'https://play.google.com/store/apps/details?id=co.rios.xnnkh',")
js_lines.append("  whatsapp: '9111811727',")
js_lines.append("  socials: {")
js_lines.append("    facebook: 'https://www.facebook.com/edumedimath',")
js_lines.append("    instagram: 'https://www.instagram.com/medimath',")
js_lines.append("    youtube: 'https://www.youtube.com/channel/UCqNkAy6Rd4eb3m-scMj1vUA',")
js_lines.append("    linkedin: 'https://www.linkedin.com/company/medimath'")
js_lines.append("  },")
js_lines.append("  mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.089!2d75.8577!3d22.7196!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd0f0f0f0f0f%3A0x0!2sVibrant+Tower%2C+Manorama+Ganj%2C+Indore!5e0!3m2!1sen!2sin!4v1'")
js_lines.append("};")
js_lines.append("")

def js_str(s):
    return json.dumps(s, ensure_ascii=False)

# NAV_LINKS
js_lines.append("const NAV_LINKS = [")
js_lines.append("  { href: 'index.html', label: 'Home' },")
js_lines.append("  { href: 'about.html', label: 'About' },")
js_lines.append("  { href: SITE.testPortal, label: 'Test Portal', external: true },")
js_lines.append("  { href: 'courses.html', label: 'Courses' },")
js_lines.append("  { href: 'results.html', label: 'Results' },")
js_lines.append("  { href: 'gallery.html', label: 'Gallery' },")
js_lines.append("  { href: 'testimonials.html', label: 'Testimonials' },")
js_lines.append("  { href: 'blog.html', label: 'Blog' },")
js_lines.append("  { label: 'Exams', dropdown: [{ href: 'neet.html', label: 'NEET' }, { href: 'jee.html', label: 'JEE' }] },")
js_lines.append("  { href: 'contact.html', label: 'Contact' }")
js_lines.append("];")
js_lines.append("")

# BATCHES - from live site
batches = [
    {"id": "evening-11", "title": "School Going Evening Batch 11th JEE/NEET", "desc": "Perfect for school-going students balancing academics with competitive exam prep.", "tags": ["11th", "JEE", "NEET"], "timing": "Evening", "medium": "English & Hindi"},
    {"id": "gurukul-11", "title": "Full Day Gurukul Batch 11th JEE/NEET", "desc": "Intensive full-day program with structured study, doubt sessions, and mentorship.", "tags": ["11th", "JEE", "NEET"], "timing": "Full Day", "medium": "English & Hindi"},
    {"id": "evening-12", "title": "School Going Evening Batch 12th JEE/NEET", "desc": "Board + competitive exam preparation with daily practice and test series.", "tags": ["12th", "JEE", "NEET"], "timing": "Evening", "medium": "English & Hindi"},
    {"id": "gurukul-12", "title": "Full Day Gurukul Batch 12th JEE/NEET", "desc": "Complete immersion program for serious aspirants targeting top ranks.", "tags": ["12th", "JEE", "NEET"], "timing": "Full Day", "medium": "English & Hindi"},
    {"id": "neet-dropper-en", "title": "Only Classes 8-2 Batch (English Medium) NEET Dropper", "desc": "Focused NEET dropper batch with rigorous daily classes and mock tests.", "tags": ["Dropper", "NEET"], "timing": "8 AM - 2 PM", "medium": "English"},
    {"id": "neet-dropper-hi", "title": "Only Classes 8-2 Batch (Hindi Medium) NEET Dropper", "desc": "Hindi medium NEET preparation for droppers with personalized mentoring.", "tags": ["Dropper", "NEET"], "timing": "8 AM - 2 PM", "medium": "Hindi"},
    {"id": "neet-dropper-8-8", "title": "8 to 8 Gurukul Batch NEET Dropper", "desc": "Full-day residential-style coaching for dedicated NEET droppers.", "tags": ["Dropper", "NEET"], "timing": "8 AM - 8 PM", "medium": "English & Hindi"},
    {"id": "jee-dropper-8-8", "title": "8 to 8 Batch (English Medium) JEE Dropper", "desc": "Intensive JEE Main & Advanced preparation for droppers aiming for IITs.", "tags": ["Dropper", "JEE"], "timing": "8 AM - 8 PM", "medium": "English"},
]

js_lines.append("const BATCHES = " + json.dumps(batches, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const TOPPERS = " + json.dumps(toppers, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const TESTIMONIALS = " + json.dumps(unique_tests, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const FAQS = " + json.dumps(faqs, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const BLOG_POSTS = " + json.dumps(blog_posts, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

gallery = [{"src": u, "alt": f"Medimath Gallery {i+1}"} for i, u in enumerate(gallery_urls)]
js_lines.append("const GALLERY_IMAGES = " + json.dumps(gallery, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const HERO_IMAGES = " + json.dumps(hero_images, indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const VISION_TEXT = " + js_str(
    "At Medimath Career Institute, Indore, we aim to shape confident, well-rounded, and responsible individuals who are ready to unlock their highest potential. Our vision is to create a welcoming and supportive learning environment where every student thrives while preparing for JEE Main, JEE Advanced, and NEET exams."
) + ";")
js_lines.append("")

js_lines.append("const MISSION_ITEMS = " + json.dumps(mission_items[:4] if mission_items else [
    "To create an ambience where learning is easy and the leaders and innovators of tomorrow emerge.",
    "To address problems faced by students and give solution to them.",
    "To provide an education that transforms students through rigorous practice and by developing the skills needed to crack competitive exam.",
    "To collaborate with excellent faculties around the country to strengthen and support the students in securing good ranks."
], indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const FEATURES = " + json.dumps([
    {"title": "Expert Tutors Who Cares About Success", "desc": features["expert"], "icon": "👨‍🏫"},
    {"title": "Customized Coaching for Every Student", "desc": features["customized"], "icon": "🎯"},
    {"title": "Proven Success with Medimath's Coaching", "desc": features["success"], "icon": "🏆"},
], indent=2, ensure_ascii=False) + ";")
js_lines.append("")

js_lines.append("const RESULTS = { '2024': " + json.dumps(
    [{"name": t["name"], "exam": "NEET" if "NEET" in t["achievement"] else "JEE", "rank": t["achievement"], "image": t["image"]} for t in toppers],
    indent=2, ensure_ascii=False
) + " };")

(ROOT / "js" / "data.js").write_text("\n".join(js_lines), encoding="utf-8")
print(json.dumps(output, indent=2))
print("Wrote js/data.js")