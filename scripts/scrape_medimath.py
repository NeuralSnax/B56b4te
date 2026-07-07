#!/usr/bin/env python3
"""Scrape all data from medimath.in and output structured JSON."""

import json
import re
import html
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import urlopen, Request

BASE = "https://www.medimath.in"
OUT = Path(__file__).parent.parent / "scraped_data"


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip = True

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = False

    def handle_data(self, data):
        if not self.skip:
            t = data.strip()
            if t:
                self.parts.append(t)

    def get_text(self):
        return " ".join(self.parts)


def fetch(url):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; MedimathScraper/1.0)"})
    with urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", errors="replace")


def strip_html(content):
    content = re.sub(r"<script[^>]*>.*?</script>", "", content, flags=re.DOTALL | re.IGNORECASE)
    content = re.sub(r"<style[^>]*>.*?</style>", "", content, flags=re.DOTALL | re.IGNORECASE)
    parser = TextExtractor()
    parser.feed(content)
    return html.unescape(parser.get_text())


def extract_links(content):
    return list(set(re.findall(r'href=["\']([^"\']+)["\']', content)))


def extract_images(content):
    imgs = []
    for m in re.finditer(r'<img[^>]+>', content, re.IGNORECASE):
        tag = m.group(0)
        src = re.search(r'(?:src|data-src)=["\']([^"\']+)["\']', tag)
        alt = re.search(r'alt=["\']([^"\']*)["\']', tag)
        if src:
            url = src.group(1)
            if url.startswith("//"):
                url = "https:" + url
            imgs.append({"src": url, "alt": alt.group(1) if alt else ""})
    return imgs


def extract_toppers(html_content):
    toppers = []
    # Elementor swiper toppers
    pattern = r'<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"'
    for src, alt in re.findall(pattern, html_content):
        if "NEET" in alt or "JEE" in alt or "IIT" in alt:
            name_match = re.match(r"([^_]+)__?", alt)
            name = name_match.group(1).replace("-", " ").strip() if name_match else alt
            achievement = ""
            if "NEET" in alt:
                achievement = re.search(r"NEET[^\"]*", alt)
                achievement = achievement.group(0).replace("-", " ").replace("_", " ") if achievement else "NEET"
            elif "JEE" in alt or "IIT" in alt:
                achievement = re.search(r"(JEE|IIT)[^\"]*", alt)
                achievement = achievement.group(0).replace("-", " ").replace("_", " ") if achievement else "JEE"
            toppers.append({
                "name": name,
                "achievement": achievement,
                "image": src if src.startswith("http") else "https:" + src.lstrip("/") if src.startswith("//") else src,
                "alt": alt
            })
    # dedupe by name
    seen = set()
    unique = []
    for t in toppers:
        key = t["name"] + t["achievement"]
        if key not in seen:
            seen.add(key)
            unique.append(t)
    return unique


def extract_batches(html_content):
    batches = []
    # Look for batch card titles in HTML
    titles = [
        "School Going Evening Batch 11th JEE/NEET",
        "Full Day Gurukul Batch 11th JEE/NEET",
        "School Going Evening Batch 12th JEE/NEET",
        "Full Day Gurukul Batch 12th JEE/NEET",
        "Only Classes 8-2 Batch (English Medium) NEET Dropper",
        "Only Classes 8-2 Batch (Hindi Medium) NEET Dropper",
        "8 to 8 Gurukul Batch NEET Dropper",
        "8 to 8 Batch (English Medium) JEE Dropper",
    ]
    for title in titles:
        if title in html_content or title.replace("/", "&#8211;") in html_content:
            batches.append({"title": title, "found": True})
    # Also extract from elementor headings
    for m in re.finditer(r'<h[23][^>]*>([^<]*(?:Batch|Gurukul|Dropper)[^<]*)</h', html_content, re.I):
        t = strip_html(m.group(1)).strip()
        if t and len(t) > 10:
            batches.append({"title": t, "source": "heading"})
    return batches


def extract_testimonials(html_content):
    testimonials = []
    # testimonial blocks
    blocks = re.findall(
        r'class="[^"]*testimonial[^"]*"[^>]*>.*?<p[^>]*>([^<]+)</p>',
        html_content, re.DOTALL | re.IGNORECASE
    )
    for b in blocks:
        t = strip_html(b).strip()
        if len(t) > 20:
            testimonials.append({"quote": t})

    # Also from review/testimonial text patterns
    for m in re.finditer(r'<p[^>]*class="[^"]*">([^<]{30,300})</p>', html_content):
        text = strip_html(m.group(1)).strip()
        if any(w in text.lower() for w in ["medimath", "coaching", "institute", "mentor", "neet", "jee", "best"]):
            if text not in [t["quote"] for t in testimonials]:
                testimonials.append({"quote": text})
    return testimonials[:20]


def extract_faqs(html_content):
    faqs = []
    # accordion / FAQ patterns
    questions = re.findall(
        r'<(?:h[234]|button)[^>]*class="[^"]*(?:faq|accordion|question)[^"]*"[^>]*>([^<]+)',
        html_content, re.I
    )
    for q in questions:
        q = strip_html(q).strip()
        if "?" in q and len(q) > 15:
            faqs.append({"question": q})

    # Elementor toggle widgets
    for m in re.finditer(r'elementor-tab-title[^>]*>.*?<(?:a|span)[^>]*>([^<]+\?)</', html_content, re.DOTALL):
        faqs.append({"question": strip_html(m.group(1)).strip()})

    return faqs


def extract_contact(html_content):
    contact = {}
    phone = re.search(r'\+?\s*91\s*1?1?8?1?1?7?2?7|9111811727', html_content.replace(" ", ""))
    if phone:
        contact["phone"] = "+91 11811727"

    email = re.search(r'[\w.+-]+@medimath\.com', html_content)
    if email:
        contact["email"] = email.group(0)

    # address patterns
    addr = re.search(
        r'202[^<]{0,200}Indore[^<]{0,50}',
        strip_html(html_content)
    )
    if addr:
        contact["address"] = addr.group(0).strip()

    # social links
    socials = {}
    for platform, pattern in [
        ("facebook", r'facebook\.com/[^"\'\s]+'),
        ("instagram", r'instagram\.com/[^"\'\s]+'),
        ("youtube", r'youtube\.com/[^"\'\s]+'),
        ("linkedin", r'linkedin\.com/[^"\'\s]+'),
    ]:
        m = re.search(pattern, html_content, re.I)
        if m:
            url = m.group(0)
            if not url.startswith("http"):
                url = "https://" + url
            socials[platform] = url
    contact["socials"] = socials

    # whatsapp
    wa = re.search(r'wa\.me/(\d+)|whatsapp[^"]*(\d{10,})', html_content, re.I)
    if wa:
        contact["whatsapp"] = wa.group(1) or wa.group(2)

    # play store
    ps = re.search(r'play\.google\.com/store/apps/details\?id=[^"\'\s]+', html_content)
    if ps:
        contact["playStore"] = "https://" + ps.group(0)

    return contact


def extract_nav(html_content):
    nav = []
    menu_section = re.search(r'main-menu[^>]*>(.*?)</ul>', html_content, re.DOTALL | re.I)
    if menu_section:
        for m in re.finditer(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>([^<]+)</a>', menu_section.group(1)):
            nav.append({"href": m.group(1), "label": strip_html(m.group(2)).strip()})
    return nav


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    print("Fetching homepage HTML...")
    home_html = fetch(BASE + "/")
    (OUT / "homepage.html").write_text(home_html, encoding="utf-8")

    print("Fetching WordPress pages...")
    pages_raw = fetch(BASE + "/wp-json/wp/v2/pages?per_page=100")
    pages = json.loads(pages_raw)
    (OUT / "pages.json").write_text(json.dumps(pages, indent=2, ensure_ascii=False), encoding="utf-8")

    print("Fetching WordPress posts...")
    posts_raw = fetch(BASE + "/wp-json/wp/v2/posts?per_page=100")
    posts = json.loads(posts_raw)
    (OUT / "posts.json").write_text(json.dumps(posts, indent=2, ensure_ascii=False), encoding="utf-8")

    # Fetch individual key pages
    page_urls = [
        "/about-us/",
        "/courses/",
        "/results/",
        "/gallery/",
        "/testimonials/",
        "/blog/",
        "/contact-us/",
        "/neet-coaching-in-indore/",
        "/jee-coaching-in-indore/",
    ]

    extra_pages = {}
    for path in page_urls:
        url = BASE + path
        try:
            print(f"Fetching {url}...")
            content = fetch(url)
            slug = path.strip("/").replace("/", "_") or "home"
            (OUT / f"page_{slug}.html").write_text(content, encoding="utf-8")
            extra_pages[slug] = content
        except Exception as e:
            print(f"  Failed: {e}")

    # Build structured dataset
    data = {
        "site": {
            "name": "Medimath Career Institute",
            "url": BASE,
            "tagline": "JEE Institute in Indore | NEET Institute in Indore",
        },
        "contact": extract_contact(home_html),
        "navigation": extract_nav(home_html),
        "toppers": extract_toppers(home_html),
        "batches": extract_batches(home_html),
        "testimonials": extract_testimonials(home_html),
        "faqs": extract_faqs(home_html),
        "images": extract_images(home_html),
        "hero_images": [],
        "gallery_images": [],
        "pages": [],
        "blog_posts": [],
    }

    # Hero images from slider
    for m in re.finditer(r'data-src=["\'](//[^"\']+)["\']', home_html):
        url = "https:" + m.group(1)
        if any(x in url.lower() for x in ["banner", "whatsapp", "d8b82d4c", "bannerrrr"]):
            data["hero_images"].append(url)

    # Gallery from footer/home
    for img in data["images"]:
        if any(x in img["src"] for x in ["medi", "gallery", "WhatsApp", "570-383", "msc-e"]):
            data["gallery_images"].append(img)

    # Process WP pages
    for page in pages:
        slug = page.get("slug", "")
        title = page.get("title", {}).get("rendered", "")
        link = page.get("link", "")
        content_html = page.get("content", {}).get("rendered", "")
        excerpt = page.get("excerpt", {}).get("rendered", "")
        data["pages"].append({
            "id": page.get("id"),
            "slug": slug,
            "title": html.unescape(strip_html(title)),
            "link": link,
            "excerpt": strip_html(excerpt),
            "content_text": strip_html(content_html),
            "content_html": content_html,
            "images": extract_images(content_html),
        })

    # Process blog posts
    for post in posts:
        data["blog_posts"].append({
            "id": post.get("id"),
            "slug": post.get("slug", ""),
            "title": html.unescape(strip_html(post.get("title", {}).get("rendered", ""))),
            "link": post.get("link", ""),
            "date": post.get("date", ""),
            "excerpt": strip_html(post.get("excerpt", {}).get("rendered", "")),
            "content_text": strip_html(post.get("content", {}).get("rendered", "")),
            "images": extract_images(post.get("content", {}).get("rendered", "")),
        })

    # Logo
    logo_match = re.search(r'wp-content/uploads/[^"\']+MediMath[^"\']+\.png', home_html)
    if logo_match:
        data["site"]["logo"] = "https://www.medimath.in/" + logo_match.group(0)

    # Company name from footer
    footer_match = re.search(r'Edumedimath[^<]+', home_html)
    if footer_match:
        data["site"]["company"] = strip_html(footer_match.group(0))

    (OUT / "medimath_data.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(f"\nDone! Scraped:")
    print(f"  Pages: {len(data['pages'])}")
    print(f"  Blog posts: {len(data['blog_posts'])}")
    print(f"  Toppers: {len(data['toppers'])}")
    print(f"  Testimonials: {len(data['testimonials'])}")
    print(f"  Images: {len(data['images'])}")
    print(f"  Output: {OUT / 'medimath_data.json'}")


if __name__ == "__main__":
    main()