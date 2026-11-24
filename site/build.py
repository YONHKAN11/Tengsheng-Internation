#!/usr/bin/env python3
"""Build the Tengsheng International static showcase site.

Usage:
    python build.py            # build into ./dist
    python build.py --serve    # build, then serve on http://localhost:8080

All copy lives in content/*.json. Output in dist/ is plain HTML/CSS/JS and can be
uploaded to any static host (Cloudflare Pages, Netlify, GitHub Pages, S3, nginx).
"""

from __future__ import annotations

import html
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content"
ASSETS = ROOT / "assets"
DIST = ROOT / "dist"

SITE = json.loads((CONTENT / "site.json").read_text(encoding="utf-8"))
VEHICLES = json.loads((CONTENT / "vehicles.json").read_text(encoding="utf-8"))["vehicles"]
MARKETS = json.loads((CONTENT / "markets.json").read_text(encoding="utf-8"))

CSS_TEXT = (ASSETS / "css" / "main.css").read_text(encoding="utf-8")
JS_TEXT = (ASSETS / "js" / "main.js").read_text(encoding="utf-8")


def data_uri(path: str) -> str:
    """Inline a local SVG so pages render without external requests."""
    file = ROOT / path
    if not file.exists() or file.suffix.lower() != ".svg":
        return path
    return "data:image/svg+xml;charset=utf-8," + quote(file.read_text(encoding="utf-8"), safe="")


def media_src(path: str, prefix: str) -> str:
    """Placeholder artwork is inlined; absolute (R2/CDN) URLs pass through."""
    if not path:
        return path
    if path.startswith(("http://", "https://", "data:")):
        return path
    if path.startswith("assets/img/") and path.endswith(".svg"):
        return data_uri(path)
    return f"{prefix}{path}"

# Media exported from the CMS (optional). Shape:
# { "<vehicle-slug>": { "images": [{"src", "alt"}], "videos": [{"src", "poster"}] } }
MEDIA: dict = {}
_media_file = CONTENT / "media.json"
if _media_file.exists():
    MEDIA = json.loads(_media_file.read_text(encoding="utf-8"))

# Brand profiles exported from the CMS (optional). Falls back to the brands
# present in vehicles.json when no export exists yet.
BRANDS: list[dict] = []
_brands_file = CONTENT / "brands.json"
if _brands_file.exists():
    BRANDS = json.loads(_brands_file.read_text(encoding="utf-8")).get("brands", [])

# Copy for the vehicle detail page, exported from the CMS (optional).
VEHICLE_PAGE: dict = {}
_vp_file = CONTENT / "vehicle-page.json"
if _vp_file.exists():
    VEHICLE_PAGE = json.loads(_vp_file.read_text(encoding="utf-8"))


def vp(key: str, default: str) -> str:
    value = VEHICLE_PAGE.get(key)
    if isinstance(value, str) and value.strip():
        return value
    return default


def vp_terms() -> list[dict]:
    terms = VEHICLE_PAGE.get("terms")
    if isinstance(terms, list):
        rows = [t for t in terms if isinstance(t, dict) and t.get("label") and t.get("value")]
        if rows:
            return rows
    return [
        {"label": "Terms", "value": "FOB / CFR / CIF / DAP"},
        {"label": "Shipping", "value": "Ro-ro or container"},
        {"label": "Documents", "value": "Full export set"},
        {"label": "Inspection", "value": "Report before payment"},
    ]

_brand_cache: list[dict] | None = None


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")


def brand_entries() -> list[dict]:
    global _brand_cache
    if _brand_cache is None:
        if BRANDS:
            _brand_cache = sorted(
                BRANDS,
                key=lambda b: (b.get("sortOrder") if b.get("sortOrder") is not None else 100, b.get("name", "")),
            )
        else:
            names = sorted({v["brand"] for v in VEHICLES})
            _brand_cache = [
                {
                    "slug": slugify(name),
                    "name": name,
                    "origin": "",
                    "description": "",
                    "website": "",
                    "featured": False,
                    "sortOrder": 100,
                    "logo": "",
                    "cover": "",
                    "vehicleCount": sum(1 for v in VEHICLES if v["brand"] == name),
                }
                for name in names
            ]
    return _brand_cache


def brand_slug(name: str) -> str:
    for brand in brand_entries():
        if str(name).lower() == brand["name"].lower():
            return brand["slug"]
    return slugify(name)


def brand_vehicles(name: str) -> list[dict]:
    return [v for v in VEHICLES if v["brand"].lower() == str(name).lower()]


NAV = [
    ("home", "index.html", "Home"),
    ("vehicles", "vehicles.html", "Inventory"),
    ("brands", "brands.html", "Brands"),
    ("markets", "markets.html", "Markets"),
    ("process", "process.html", "Process"),
    ("about", "about.html", "About"),
    ("contact", "contact.html", "Contact"),
]

COMPANY = SITE["name"]
SHORT = SITE["shortName"]
EMAIL = SITE["contact"]["email"]
WHATSAPP = SITE["contact"]["whatsapp"]
WA_NUMBER = SITE["contact"]["whatsappNumber"]
BASE_URL = (SITE.get("baseUrl") or "").rstrip("/")
YEAR = datetime.now().year


# --------------------------------------------------------------------------- helpers


def esc(value) -> str:
    return html.escape("" if value is None else str(value), quote=True)


def url_for(prefix: str, path: str) -> str:
    return f"{prefix}{path}" if path.startswith("assets/") or path.endswith(".html") else path


def wa_link(text: str) -> str:
    from urllib.parse import quote

    return f"https://wa.me/{WA_NUMBER}?text={quote(text)}"


def mail_link(subject: str, body: str) -> str:
    from urllib.parse import quote

    return f"mailto:{EMAIL}?subject={quote(subject)}&body={quote(body)}"


def nav_html(prefix: str, active: str) -> str:
    links = "".join(
        f'<a class="nav-link{" is-active" if key == active else ""}" href="{prefix}{href}">{esc(label)}</a>'
        for key, href, label in NAV
    )
    return f"""
      <nav class="nav" id="site-nav" aria-label="Main navigation">
        {links}
        <a class="nav-cta" href="{wa_link('Hello Tengsheng International, I would like to inquire about a vehicle.')}" target="_blank" rel="noopener noreferrer">
          <span class="dot" aria-hidden="true"></span> WhatsApp
        </a>
      </nav>
      <button class="nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>"""


def header_html(prefix: str, active: str) -> str:
    return f"""<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="{prefix}index.html" aria-label="{esc(SHORT)} — home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img" focusable="false">
          <path d="M5 9h30l-3 5H8z" fill="currentColor"/>
          <path d="M11 17h18l-2.4 14H13.4z" fill="none" stroke="currentColor" stroke-width="2.2"/>
          <path d="M16 22h8M16 26h8" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      </span>
      <span class="brand-text">
        <span class="brand-name">{esc(SITE['wordmark'])}</span>
        <span class="brand-sub">{esc(SITE['wordmarkSuffix'])}</span>
      </span>
    </a>
    {nav_html(prefix, active)}
  </div>
</header>"""


def footer_html(prefix: str) -> str:
    explore = "".join(
        f'<li><a href="{prefix}{href}">{esc(label)}</a></li>' for key, href, label in NAV if key != "home"
    )
    regions = "".join(f"<li>{esc(r['name'])}</li>" for r in MARKETS["regions"])
    wa = wa_link("Hello Tengsheng International, I would like to inquire about a vehicle.")
    return f"""<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="brand" href="{prefix}index.html" aria-label="{esc(SHORT)} — home">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" role="img" focusable="false">
            <path d="M5 9h30l-3 5H8z" fill="currentColor"/>
            <path d="M11 17h18l-2.4 14H13.4z" fill="none" stroke="currentColor" stroke-width="2.2"/>
            <path d="M16 22h8M16 26h8" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </span>
        <span class="brand-text">
          <span class="brand-name">{esc(SITE['wordmark'])}</span>
          <span class="brand-sub">{esc(SITE['wordmarkSuffix'])}</span>
        </span>
      </a>
      <p class="footer-blurb">{esc(SITE['tagline'])}. New and pre-owned vehicles, documented and shipped worldwide.</p>
      <a class="footer-wa" href="{wa}" target="_blank" rel="noopener noreferrer">WhatsApp {esc(WHATSAPP)}</a>
    </div>
    <div class="footer-col">
      <h2>Explore</h2>
      <ul>{explore}<li><a href="{prefix}credits.html">Media &amp; credits</a></li></ul>
    </div>
    <div class="footer-col">
      <h2>Contact</h2>
      <ul>
        <li><a href="mailto:{esc(EMAIL)}">{esc(EMAIL)}</a></li>
        <li><a href="{wa}" target="_blank" rel="noopener noreferrer">{esc(WHATSAPP)}</a></li>
        <li>{esc(SITE['contact']['response'])}</li>
      </ul>
    </div>
    <div class="footer-col">
      <h2>Export regions</h2>
      <ul>{regions}</ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>© {YEAR} {esc(COMPANY)}. All rights reserved.</p>
    <p>Specifications and prices are indicative and confirmed on quotation.</p>
  </div>
</footer>"""


def head_html(prefix: str, title: str, description: str, *, canonical: str = "", jsonld: str = "", og_image: str = "") -> str:
    full_title = title if title == COMPANY else f"{title} | {esc(SHORT)}"
    meta = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f"<title>{full_title}</title>",
        f'<meta name="description" content="{esc(description)}">',
        '<meta name="theme-color" content="#0a0d12">',
        f'<link rel="icon" href="{data_uri("assets/img/favicon.svg")}" type="image/svg+xml">',
        f"<style>{CSS_TEXT}</style>",
        f'<meta property="og:site_name" content="{esc(COMPANY)}">',
        f'<meta property="og:title" content="{esc(title)}">',
        f'<meta property="og:description" content="{esc(description)}">',
        '<meta property="og:type" content="website">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    if canonical:
        absolute = f"{BASE_URL}/{canonical}" if BASE_URL else ""
        if absolute:
            meta.append(f'<link rel="canonical" href="{esc(absolute)}">')
            meta.append(f'<meta property="og:url" content="{esc(absolute)}">')
    if og_image and BASE_URL:
        absolute_img = og_image if og_image.startswith(("http://", "https://")) else f"{BASE_URL}/{og_image}"
        meta.append(f'<meta property="og:image" content="{esc(absolute_img)}">')
        meta.append(f'<meta name="twitter:image" content="{esc(absolute_img)}">')
    if jsonld:
        meta.append(f'<script type="application/ld+json">{jsonld}</script>')
    return "<!doctype html>\n<html lang=\"en\">\n<head>\n  " + "\n  ".join(meta) + "\n</head>"


def page(prefix: str, active: str, title: str, description: str, body: str, *, canonical: str = "", jsonld: str = "", og_image: str = "") -> str:
    return f"""{head_html(prefix, title, description, canonical=canonical, jsonld=jsonld, og_image=og_image)}
<body class="page-{active}">
{header_html(prefix, active)}
<main id="main">
{body}
</main>
{footer_html(prefix)}
<script>{JS_TEXT}</script>
</body>
</html>
"""


def section_head(eyebrow: str, title: str, intro: str = "") -> str:
    intro_html = f'<p class="section-intro">{esc(intro)}</p>' if intro else ""
    return f"""<div class="section-head">
  <p class="eyebrow"><span></span>{esc(eyebrow)}</p>
  <h2>{esc(title)}</h2>
  {intro_html}
</div>"""


def media_for(v: dict) -> tuple[list[dict], list[dict]]:
    entry = MEDIA.get(v["slug"], {}) if isinstance(MEDIA, dict) else {}
    images = entry.get("images") or v.get("images") or []
    videos = entry.get("videos") or v.get("videos") or []

    normalised_images = []
    for item in images:
        if isinstance(item, str):
            normalised_images.append({"src": item, "alt": v["name"]})
        else:
            normalised_images.append({"src": item["src"], "alt": item.get("alt") or v["name"]})

    normalised_videos = []
    for item in videos:
        if isinstance(item, str):
            normalised_videos.append({"src": item, "poster": ""})
        else:
            normalised_videos.append({"src": item["src"], "poster": item.get("poster") or ""})

    return normalised_images, normalised_videos


def placeholder_image(v: dict) -> dict:
    return {
        "src": f"assets/img/vehicles/{v['slug']}.svg",
        "alt": f"{v['name']} — photos and video pending",
    }


def primary_image(v: dict) -> str:
    images, _ = media_for(v)
    return images[0]["src"] if images else placeholder_image(v)["src"]


def vehicle_card(v: dict, prefix: str) -> str:
    search = " ".join(
        str(v.get(k, "")) for k in ("name", "brand", "model", "year", "bodyType", "fuel", "condition", "stock")
    ).lower()
    specs = "".join(f"<li>{esc(x)}</li>" for x in (v["fuel"], v["transmission"], v["mileage"]))
    images, _videos = media_for(v)
    cover = images[0] if images else placeholder_image(v)
    pending_label = esc(vp("pendingLabel", "Media pending"))
    pending = "" if images else f'<span class="v-pending">{pending_label}</span>'
    return f"""<article class="v-card reveal" data-brand="{esc(v['brand'])}" data-condition="{esc(v['condition'])}" data-body="{esc(v['bodyType'])}" data-fuel="{esc(v['fuel'])}" data-search="{esc(search)}">
  <a class="v-media" href="{prefix}vehicles/{esc(v['slug'])}.html" aria-label="{esc(v['name'])}">
    <img src="{esc(media_src(cover['src'], prefix))}" alt="{esc(cover['alt'])}" loading="lazy" decoding="async">
    <span class="v-condition">{esc(v['condition'])}</span>
    <span class="v-year">{v['year']}</span>
    {pending}
  </a>
  <div class="v-body">
    <p class="v-brand">{esc(v['brand'])}</p>
    <h3 class="v-title"><a href="{prefix}vehicles/{esc(v['slug'])}.html">{esc(v['name'])}</a></h3>
    <ul class="v-specs">{specs}</ul>
    <div class="v-foot">
      <p class="v-price">{esc(v['price'])} <span>FOB</span></p>
      <a class="v-link" href="{prefix}vehicles/{esc(v['slug'])}.html">Details <span aria-hidden="true">→</span></a>
    </div>
  </div>
</article>"""


def cta_html(prefix: str) -> str:
    cta = SITE["cta"]
    return f"""<section class="cta-band">
  <div class="container cta-inner reveal">
    <p class="eyebrow light"><span></span>Start an inquiry</p>
    <h2>{esc(cta['title'])}</h2>
    <p>{esc(cta['subtitle'])}</p>
    <div class="cta-actions">
      <a class="btn btn-primary" href="{prefix}{esc(cta['href'])}">{esc(cta['label'])}</a>
      <a class="btn btn-ghost" href="{wa_link('Hello Tengsheng International, I would like a quotation for a vehicle export order.')}" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
    </div>
  </div>
</section>"""


def organizations_jsonld() -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": COMPANY,
        "description": SITE["description"],
        "email": EMAIL,
        "telephone": WHATSAPP,
        "areaServed": [r["name"] for r in MARKETS["regions"]],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "sales",
            "email": EMAIL,
            "telephone": WHATSAPP,
            "availableLanguage": ["English", "Chinese"],
        },
    }
    if BASE_URL:
        data["url"] = BASE_URL
    return json.dumps(data, ensure_ascii=False)


# --------------------------------------------------------------------------- pages


def build_home() -> str:
    prefix = ""
    featured = [v for v in VEHICLES if v.get("featured")][:6]
    brand_strip = "".join(
        f'<a class="brand-chip" href="brands/{esc(b["slug"])}.html">{esc(b["name"])}</a>'
        for b in brand_entries()
    )
    stats = "".join(
        f'<div class="stat"><span class="stat-value">{esc(s["value"])}</span><span class="stat-label">{esc(s["label"])}</span></div>'
        for s in SITE["stats"]
    )
    strengths = "".join(
        f"""<article class="feature reveal">
  <span class="feature-num">0{i + 1}</span>
  <h3>{esc(item['title'])}</h3>
  <p>{esc(item['description'])}</p>
</article>"""
        for i, item in enumerate(SITE["strengths"]["items"])
    )
    regions = "".join(
        f"""<a class="region-card reveal" href="markets.html#region-{i + 1}">
  <span class="region-index">0{i + 1}</span>
  <h3>{esc(r['name'])}</h3>
  <p>{esc(r['summary'])}</p>
  <span class="region-count">{len(r['countries'])} destinations <span aria-hidden="true">→</span></span>
</a>"""
        for i, r in enumerate(MARKETS["regions"])
    )
    steps = "".join(
        f"""<li class="step reveal">
  <span class="step-num">{i + 1}</span>
  <h3>{esc(s['title'])}</h3>
  <p>{esc(s['description'])}</p>
</li>"""
        for i, s in enumerate(SITE["process"]["steps"][:4])
    )
    trust = "".join(f'<li>{esc(t)}</li>' for t in SITE["trust"])

    body = f"""
<section class="hero">
  <div class="hero-bg" aria-hidden="true"><img src="{esc(media_src(SITE['hero']['image'], ''))}" alt="" decoding="async"></div>
  <div class="container hero-inner">
    <p class="eyebrow light"><span></span>{esc(SITE['hero']['eyebrow'])}</p>
    <h1>{esc(SITE['hero']['title'])}</h1>
    <p class="hero-sub">{esc(SITE['hero']['subtitle'])}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="{esc(SITE['hero']['primaryCta']['href'])}">{esc(SITE['hero']['primaryCta']['label'])}</a>
      <a class="btn btn-ghost" href="{esc(SITE['hero']['secondaryCta']['href'])}">{esc(SITE['hero']['secondaryCta']['label'])}</a>
    </div>
    <ul class="hero-trust">{trust}</ul>
  </div>
  <div class="hero-side" aria-hidden="true">
    <span>Est. international export desk</span>
    <span>FOB · CFR · CIF · DAP</span>
  </div>
</section>

<div class="brand-strip" aria-label="Brands we source">
  <div class="container brand-strip-inner">{brand_strip}</div>
</div>

<section class="section">
  <div class="container">
    <div class="section-row">
      {section_head(SITE['featured']['eyebrow'], SITE['featured']['title'], SITE['featured']['intro'])}
      <a class="btn btn-outline section-row-action" href="{esc(SITE['featured']['linkHref'])}">{esc(SITE['featured']['linkLabel'])}</a>
    </div>
    <div class="v-grid">
      {''.join(vehicle_card(v, prefix) for v in featured)}
    </div>
  </div>
</section>

<section class="stats-band">
  <div class="container stats-grid">{stats}</div>
</section>

<section class="section section-alt">
  <div class="container">
    {section_head(SITE['strengths']['eyebrow'], SITE['strengths']['title'], SITE['strengths']['intro'])}
    <div class="feature-grid">{strengths}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-row">
      {section_head(SITE['markets']['eyebrow'], SITE['markets']['title'], SITE['markets']['intro'])}
      <a class="btn btn-outline section-row-action" href="{esc(SITE['markets']['linkHref'])}">{esc(SITE['markets']['linkLabel'])}</a>
    </div>
    <div class="region-grid">{regions}</div>
  </div>
</section>

<section class="section section-alt">
  <div class="container">
    <div class="section-row">
      {section_head(SITE['process']['eyebrow'], SITE['process']['title'], SITE['process']['intro'])}
      <a class="btn btn-outline section-row-action" href="{esc(SITE['process']['linkHref'])}">{esc(SITE['process']['linkLabel'])}</a>
    </div>
    <ol class="step-grid">{steps}</ol>
  </div>
</section>

{cta_html(prefix)}
"""
    description = SITE["description"]
    return page(
        prefix,
        "home",
        COMPANY,
        description,
        body,
        canonical="index.html",
        jsonld=organizations_jsonld(),
        og_image=SITE["hero"]["image"],
    )


def build_vehicles() -> str:
    prefix = ""
    brands = sorted({v["brand"] for v in VEHICLES})
    conditions = sorted({v["condition"] for v in VEHICLES})
    bodies = sorted({v["bodyType"] for v in VEHICLES})
    fuels = sorted({v["fuel"] for v in VEHICLES})
    brand_chips = '<button class="chip is-active" type="button" data-filter="brand" data-value="all">All brands</button>' + "".join(
        f'<button class="chip" type="button" data-filter="brand" data-value="{esc(b)}">{esc(b)}</button>' for b in brands
    )

    def options(values, label):
        opts = "".join(f'<option value="{esc(v)}">{esc(v)}</option>' for v in values)
        return f'<option value="all">{label}</option>{opts}'

    body_html = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>Inventory</p>
    <h1>Vehicles available for export</h1>
    <p class="lead">New and pre-owned units, sourced from authorised dealers and fleets. Prices are indicative FOB; condition reports and full photograph sets are shared on request.</p>
  </div>
</section>

<section class="section section-tight">
  <div class="container">
    <div class="filter-panel" data-filters>
      <div class="filter-top">
        <label class="search-field">
          <span class="sr-only">Search inventory</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="2"/></svg>
          <input type="search" placeholder="Search model, brand, stock location…" data-search-input>
        </label>
        <p class="filter-count" aria-live="polite"><strong data-count>{len(VEHICLES)}</strong> vehicles</p>
        <button class="filter-reset" type="button" data-reset>Reset filters</button>
      </div>
      <div class="chip-row" role="group" aria-label="Filter by brand">{brand_chips}</div>
      <div class="select-row">
        <label>Condition<select data-filter="condition">{options(conditions, 'All conditions')}</select></label>
        <label>Body type<select data-filter="body">{options(bodies, 'All body types')}</select></label>
        <label>Fuel<select data-filter="fuel">{options(fuels, 'All fuels')}</select></label>
      </div>
    </div>

    <div class="v-grid v-grid-wide" data-grid>
      {''.join(vehicle_card(v, prefix) for v in VEHICLES)}
    </div>
    <div class="empty-state" data-empty hidden>
      <h2>No vehicles match those filters</h2>
      <p>Try a different brand or clear the filters. We also source to order — send us the specification you need.</p>
      <div class="empty-actions">
        <button class="btn btn-outline" type="button" data-reset>Clear filters</button>
        <a class="btn btn-primary" href="contact.html">Request sourcing</a>
      </div>
    </div>
  </div>
</section>

{cta_html(prefix)}
"""
    description = "Browse new and pre-owned SUVs, pickups, sedans and electric vehicles available for export, with indicative FOB prices and specifications."
    return page(prefix, "vehicles", "Vehicle inventory", description, body_html, canonical="vehicles.html", og_image=primary_image(VEHICLES[0]))


def build_vehicle(v: dict) -> str:
    prefix = "../"
    images, videos = media_for(v)
    has_media = bool(images or videos)
    cover = images[0] if images else placeholder_image(v)
    thumbs = []
    for i, img in enumerate(images):
        thumbs.append(
            f'<button class="gallery-thumb{" is-active" if i == 0 else ""}" type="button" data-type="image" '
            f'data-src="{prefix}{esc(img["src"])}" data-alt="{esc(img["alt"])}" aria-label="View photo {i + 1} of {esc(v["name"])}">'
            f'<img src="{esc(media_src(img["src"], prefix))}" alt="" loading="lazy"></button>'
        )
    for i, vid in enumerate(videos):
        thumbs.append(
            f'<button class="gallery-thumb gallery-thumb-video" type="button" data-type="video" '
            f'data-src="{prefix}{esc(vid["src"])}" aria-label="Play video {i + 1} of {esc(v["name"])}">'
            f'<span class="thumb-video"><span class="thumb-play" aria-hidden="true">▶</span><span>Video {i + 1}</span></span></button>'
        )
    gallery_thumbs = "".join(thumbs)
    media_note = (
        ""
        if has_media
        else f'<p class="media-note">{esc(vp("mediaNote", "Photos and video for this vehicle are uploaded by our team in the admin panel. Request the latest media pack with your quotation."))}</p>'
    )
    features = "".join(f"<li>{esc(f)}</li>" for f in v["features"])
    specs = [
        ("Year", v["year"]),
        ("Condition", v["condition"]),
        ("Mileage", v["mileage"]),
        ("Body type", v["bodyType"]),
        ("Fuel", v["fuel"]),
        ("Engine", v["engine"]),
        ("Power", v["power"]),
        ("Torque", v["torque"]),
        ("Transmission", v["transmission"]),
        ("Drivetrain", v["drivetrain"]),
        ("Seats", v["seats"]),
        ("Exterior", v["exterior"]),
        ("Interior", v["interior"]),
        ("Steering", v["steering"]),
        ("Emissions", v["emissions"]),
        ("Stock location", v["stock"]),
        ("Loading port", v["port"]),
    ]
    spec_rows = "".join(
        f'<div class="spec"><dt>{esc(k)}</dt><dd>{esc(val)}</dd></div>' for k, val in specs
    )
    terms_rows = "".join(
        f'<li><span>{esc(t["label"])}</span><strong>{esc(t["value"])}</strong></li>' for t in vp_terms()
    )

    related = [x for x in VEHICLES if x["slug"] != v["slug"] and (x["brand"] == v["brand"] or x["bodyType"] == v["bodyType"])][:3]
    related_html = ""
    if related:
        related_html = f"""
<section class="section section-alt">
  <div class="container">
    <div class="section-row">
      {section_head(vp('relatedEyebrow', 'More inventory'), vp('relatedTitle', 'You may also consider'))}
      <a class="btn btn-outline section-row-action" href="../vehicles.html">All inventory</a>
    </div>
    <div class="v-grid">{''.join(vehicle_card(x, prefix) for x in related)}</div>
  </div>
</section>"""

    wa_text = (
        f"Hello Tengsheng International, I am interested in the {v['name']} ({v['year']}, {v['condition']}) "
        f"listed at {v['price']} FOB. Please send the condition report and delivered price to my port."
    )
    mail_body = (
        f"Hello Tengsheng International,\n\nI am interested in the {v['name']} ({v['year']}, {v['condition']}).\n"
        f"Indicative price: {v['price']} FOB.\n\nMy destination port:\nRequired quantity:\nPreferred Incoterms:\n\n"
        f"Please send availability, condition details and a delivered quotation.\n\nBest regards,\n"
    )

    body = f"""
<section class="vehicle-hero">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="../index.html">Home</a><span aria-hidden="true">/</span>
      <a href="../vehicles.html">Inventory</a><span aria-hidden="true">/</span>
      <span>{esc(v['name'])}</span>
    </nav>
    <div class="vehicle-layout">
      <div class="gallery" data-gallery>
        <figure class="gallery-main">
          <img src="{esc(media_src(cover['src'], prefix))}" alt="{esc(cover['alt'])}" data-gallery-main>
          <video data-gallery-video controls playsinline preload="metadata" hidden></video>
          <span class="gallery-tag">{esc(v['condition'])} · {v['year']}</span>
        </figure>
        <div class="gallery-thumbs" role="group" aria-label="Vehicle photos and videos">{gallery_thumbs}</div>
        {media_note}
      </div>
      <aside class="vehicle-summary">
        <p class="v-brand">{esc(v['brand'])} · {esc(v['stock'])}</p>
        <h1>{esc(v['name'])}</h1>
        <p class="summary-price">{esc(v['price'])} <span>{esc(vp('priceLabel', 'Indicative FOB'))}</span></p>
        <ul class="summary-specs">
          <li><span>Year</span><strong>{v['year']}</strong></li>
          <li><span>Mileage</span><strong>{esc(v['mileage'])}</strong></li>
          <li><span>Fuel</span><strong>{esc(v['fuel'])}</strong></li>
          <li><span>Drive</span><strong>{esc(v['drivetrain'])}</strong></li>
          <li><span>Steering</span><strong>{esc(v['steering'])}</strong></li>
          <li><span>Loading port</span><strong>{esc(v['port'])}</strong></li>
        </ul>
        <div class="summary-actions">
          <a class="btn btn-primary btn-block" href="{wa_link(wa_text)}" target="_blank" rel="noopener noreferrer">{esc(vp('whatsappLabel', 'Inquire on WhatsApp'))}</a>
          <a class="btn btn-outline btn-block" href="{mail_link('Vehicle inquiry — ' + v['name'], mail_body)}">{esc(vp('emailLabel', 'Email an inquiry'))}</a>
        </div>
        <p class="summary-note">{esc(vp('priceNote', 'Indicative price, excluding freight and destination charges unless quoted. Condition report, extra photographs and document summary provided before payment.'))}</p>
      </aside>
    </div>
  </div>
</section>

<section class="section section-tight">
  <div class="container vehicle-detail">
    <div class="detail-main">
      <h2>{esc(vp('aboutTitle', 'About this vehicle'))}</h2>
      <p class="detail-description">{esc(v['description'])}</p>
      <h2>{esc(vp('specsTitle', 'Specifications'))}</h2>
      <dl class="spec-grid">{spec_rows}</dl>
      <h2>{esc(vp('featuresTitle', 'Equipment & features'))}</h2>
      <ul class="feature-list">{features}</ul>
    </div>
    <aside class="detail-aside">
      <div class="aside-card">
        <h2>{esc(vp('termsTitle', 'Export terms'))}</h2>
        <ul class="aside-list">{terms_rows}</ul>
        <a class="text-link" href="../process.html">{esc(vp('processLinkLabel', 'See the export process →'))}</a>
      </div>
      <div class="aside-card aside-card-muted">
        <h2>{esc(vp('sourcingTitle', 'Need a different specification?'))}</h2>
        <p>{esc(vp('sourcingText', 'We source to order: other trims, colours, quantities and model years are available through our dealer network.'))}</p>
        <a class="text-link" href="../contact.html">{esc(vp('sourcingLinkLabel', 'Send a sourcing request →'))}</a>
      </div>
    </aside>
  </div>
</section>

{related_html}
{cta_html(prefix)}
"""
    description = f"{v['name']} ({v['year']}, {v['condition']}) for export from {v['stock']}. {v['engine']}, {v['transmission']}, {v['drivetrain']}. Indicative FOB price {v['price']}."
    vehicle_jsonld = {
        "@context": "https://schema.org",
        "@type": "Vehicle",
        "name": v["name"],
        "brand": {"@type": "Brand", "name": v["brand"]},
        "model": v["model"],
        "vehicleModelDate": str(v["year"]),
        "bodyType": v["bodyType"],
        "fuelType": v["fuel"],
        "vehicleTransmission": v["transmission"],
        "driveWheelConfiguration": v["drivetrain"],
        "numberOfDoors": 5,
        "seatingCapacity": v["seats"],
        "color": v["exterior"],
        "mileageFromOdometer": {"@type": "QuantitativeValue", "value": v["mileage"]},
        "vehicleEngine": {"@type": "EngineSpecification", "engineDisplacement": v["engine"], "enginePower": v["power"]},
        "offers": {
            "@type": "Offer",
            "price": "".join(ch for ch in v["price"] if ch.isdigit()),
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock",
            "seller": {"@type": "Organization", "name": COMPANY},
        },
    }
    if BASE_URL:
        vehicle_jsonld["url"] = f"{BASE_URL}/vehicles/{v['slug']}.html"
    return page(
        prefix,
        "vehicles",
        v["name"],
        description,
        body,
        canonical=f"vehicles/{v['slug']}.html",
        jsonld=json.dumps(vehicle_jsonld, ensure_ascii=False),
        og_image=primary_image(v),
    )


def build_brands() -> str:
    prefix = ""
    cards = []
    for brand in brand_entries():
        count = int(brand.get("vehicleCount") or len(brand_vehicles(brand["name"])))
        count_label = f"{count} vehicle{'s' if count != 1 else ''} available" if count else "Sourced to order"
        logo = (
            f'<img src="{esc(media_src(brand["logo"], prefix))}" alt="{esc(brand["name"])} logo" loading="lazy" decoding="async">'
            if brand.get("logo")
            else f'<span class="brand-initial" aria-hidden="true">{esc(brand["name"][:1])}</span>'
        )
        cards.append(
            f"""<a class="brand-card reveal" href="brands/{esc(brand['slug'])}.html">
  <span class="brand-logo">{logo}</span>
  <span class="brand-body">
    <span class="brand-origin">{esc(brand.get('origin') or 'International brand')}</span>
    <h2>{esc(brand['name'])}</h2>
    <p>{esc(brand.get('description') or 'Vehicles sourced to order for export, with condition reports and export documentation.')}</p>
    <span class="brand-count">{esc(count_label)} <span aria-hidden="true">→</span></span>
  </span>
</a>"""
        )

    body = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>Brands</p>
    <h1>Brands we export</h1>
    <p class="lead">Every brand below can be sourced new or pre-owned, in left- or right-hand drive, with specifications matched to your market. Brand profiles and logos are managed by our team.</p>
  </div>
</section>

<section class="section section-tight">
  <div class="container">
    <div class="brand-grid">{''.join(cards)}</div>
  </div>
</section>

{cta_html(prefix)}
"""
    description = "Vehicle brands available for export through Tengsheng International, with brand profiles, available stock and sourcing to order."
    return page(prefix, "brands", "Vehicle brands", description, body, canonical="brands.html")


def build_brand(brand: dict) -> str:
    prefix = "../"
    name = brand["name"]
    vehicles = brand_vehicles(name)
    cover = brand.get("cover") or ""
    logo = (
        f'<img src="{esc(media_src(brand["logo"], prefix))}" alt="{esc(name)} logo">'
        if brand.get("logo")
        else f'<span class="brand-initial" aria-hidden="true">{esc(name[:1])}</span>'
    )
    website = brand.get("website") or ""
    website_html = (
        f'<a class="text-link" href="{esc(website)}" target="_blank" rel="noopener noreferrer">Official website →</a>'
        if website
        else ""
    )
    cover_html = (
        f'<div class="brand-hero-bg" aria-hidden="true"><img src="{esc(media_src(cover, prefix))}" alt="" decoding="async"></div>'
        if cover
        else ""
    )
    vehicle_grid = (
        f'<div class="v-grid">{''.join(vehicle_card(v, prefix) for v in vehicles)}</div>'
        if vehicles
        else """<div class="empty-state">
  <h2>No units in stock right now</h2>
  <p>We source this brand to order. Send the model, trim, quantity and destination port for a quotation.</p>
  <div class="empty-actions"><a class="btn btn-primary" href="../contact.html">Request sourcing</a></div>
</div>"""
    )

    body = f"""
<section class="brand-hero">
  {cover_html}
  <div class="container brand-hero-inner">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="../index.html">Home</a><span aria-hidden="true">/</span>
      <a href="../brands.html">Brands</a><span aria-hidden="true">/</span>
      <span>{esc(name)}</span>
    </nav>
    <div class="brand-hero-grid">
      <div class="brand-hero-logo">{logo}</div>
      <div class="brand-hero-copy">
        <p class="eyebrow"><span></span>{esc(brand.get('origin') or 'International brand')}</p>
        <h1>{esc(name)}</h1>
        <p class="lead">{esc(brand.get('description') or 'Vehicles from this brand are sourced to order for export, with condition reports, documentation and freight arranged by one team.')}</p>
        <div class="brand-hero-meta">
          <span>{len(vehicles)} vehicle{'s' if len(vehicles) != 1 else ''} available</span>
          {website_html}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-row">
      {section_head('Inventory', f'{name} vehicles for export')}
      <a class="btn btn-outline section-row-action" href="../vehicles.html">All inventory</a>
    </div>
    {vehicle_grid}
  </div>
</section>

{cta_html(prefix)}
"""
    description = f"{name} vehicles available for export: new and pre-owned units with indicative FOB prices, specifications and export documentation."
    return page(prefix, "brands", f"{name} vehicles", description, body, canonical=f"brands/{brand['slug']}.html", og_image=cover or (primary_image(vehicles[0]) if vehicles else ""))


def build_markets() -> str:
    prefix = ""
    regions = "".join(
        f"""<article class="market reveal" id="region-{i + 1}">
  <div class="market-head">
    <span class="region-index">0{i + 1}</span>
    <div>
      <h2>{esc(r['name'])}</h2>
      <p>{esc(r['summary'])}</p>
    </div>
  </div>
  <div class="market-body">
    <div>
      <h3>Destinations</h3>
      <ul class="country-list">{''.join(f'<li>{esc(c)}</li>' for c in r['countries'])}</ul>
    </div>
    <div class="market-notes">
      <h3>Shipping notes</h3>
      <p>{esc(r['logistics'])}</p>
      <p class="port-list"><span>Ports</span> {esc(' · '.join(r['ports']))}</p>
    </div>
  </div>
</article>"""
        for i, r in enumerate(MARKETS["regions"])
    )
    incoterms = "".join(
        f"""<article class="term-card reveal">
  <p class="term-code">{esc(t['code'])}</p>
  <h3>{esc(t['name'])}</h3>
  <p>{esc(t['description'])}</p>
</article>"""
        for t in MARKETS["incoterms"]
    )
    logistics = "".join(
        f"""<article class="feature reveal">
  <h3>{esc(x['title'])}</h3>
  <p>{esc(x['description'])}</p>
</article>"""
        for x in MARKETS["logisticsPoints"]
    )
    body = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>{esc(MARKETS['eyebrow'])}</p>
    <h1>{esc(MARKETS['title'])}</h1>
    <p class="lead">{esc(MARKETS['intro'])}</p>
  </div>
</section>

<section class="section section-tight">
  <div class="container market-list">{regions}</div>
</section>

<section class="section section-alt">
  <div class="container">
    {section_head('Incoterms', 'Terms that suit your risk and budget', 'We quote the same vehicle on different terms so you can compare the true landed cost, not just the sticker price.')}
    <div class="term-grid">{incoterms}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    {section_head('Logistics', 'What we arrange')}
    <div class="feature-grid">{logistics}</div>
  </div>
</section>

{cta_html(prefix)}
"""
    description = "Export destinations and shipping terms: Middle East, Africa, Latin America, Central Asia and the Caucasus, Southeast Asia, Russia and Belarus. FOB, CFR, CIF and DAP quotations."
    return page(prefix, "markets", "Markets & logistics", description, body, canonical="markets.html")


def build_about() -> str:
    prefix = ""
    a = SITE["about"]
    paragraphs = "".join(f"<p>{esc(p)}</p>" for p in a["paragraphs"])
    principles = "".join(
        f"""<article class="feature reveal">
  <h3>{esc(p['title'])}</h3>
  <p>{esc(p['description'])}</p>
</article>"""
        for p in a["principles"]
    )
    capabilities = "".join(f"<li>{esc(c)}</li>" for c in a["capabilities"])
    stats = "".join(
        f'<div class="stat"><span class="stat-value">{esc(s["value"])}</span><span class="stat-label">{esc(s["label"])}</span></div>'
        for s in SITE["stats"]
    )
    body = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>{esc(a['eyebrow'])}</p>
    <h1>{esc(a['title'])}</h1>
    <p class="lead">{esc(a['lead'])}</p>
  </div>
</section>

<section class="section section-tight">
  <div class="container about-grid">
    <div class="about-copy">{paragraphs}</div>
    <aside class="about-aside">
      <div class="aside-card">
        <h2>{esc(a['capabilitiesTitle'])}</h2>
        <ul class="check-list">{capabilities}</ul>
      </div>
    </aside>
  </div>
</section>

<section class="stats-band">
  <div class="container stats-grid">{stats}</div>
</section>

<section class="section section-alt">
  <div class="container">
    {section_head('Operating principles', a['principlesTitle'])}
    <div class="feature-grid">{principles}</div>
  </div>
</section>

{cta_html(prefix)}
"""
    description = "Tengsheng International Co., Limited is a vehicle export house supplying new and pre-owned vehicles to dealers, fleets and private buyers across six export regions."
    return page(prefix, "about", "About us", description, body, canonical="about.html", jsonld=organizations_jsonld())


def build_process() -> str:
    prefix = ""
    steps = "".join(
        f"""<li class="process-step reveal">
  <span class="step-num">{i + 1}</span>
  <div>
    <h2>{esc(s['title'])}</h2>
    <p>{esc(s['description'])}</p>
  </div>
</li>"""
        for i, s in enumerate(SITE["process"]["steps"])
    )
    docs = [
        ("Commercial invoice", "Issued to the consignee with agreed Incoterms and payment terms."),
        ("Packing list", "VIN, dimensions and weights for clearance and freight."),
        ("Bill of lading", "Original or telex release, issued after loading."),
        ("Certificate of origin", "Prepared for preferential or standard duty treatment where applicable."),
        ("Export declaration", "Filed at origin; export licence where the destination requires one."),
        ("Insurance certificate", "All-risk marine cover issued in the consignee's name where agreed."),
        ("Pre-shipment inspection", "Third-party or destination-mandated inspection arranged before loading."),
        ("Destination compliance", "Homologation, age and emissions checks confirmed before quotation."),
    ]
    doc_rows = "".join(f"<li><strong>{esc(t)}</strong><span>{esc(d)}</span></li>" for t, d in docs)
    body = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>{esc(SITE['process']['eyebrow'])}</p>
    <h1>{esc(SITE['process']['title'])}</h1>
    <p class="lead">{esc(SITE['process']['intro'])}</p>
  </div>
</section>

<section class="section section-tight">
  <div class="container">
    <ol class="process-list">{steps}</ol>
  </div>
</section>

<section class="section section-alt">
  <div class="container process-docs">
    <div>
      {section_head('Documentation', 'The export file', 'Prepared at origin, checked against the destination rules, and shared with you before the vessel sails.')}
      <p class="section-note">Requirements vary by country and vehicle type. We confirm the exact list for your order in the quotation.</p>
    </div>
    <ul class="doc-list">{doc_rows}</ul>
  </div>
</section>

<section class="section">
  <div class="container">
    {section_head('Terms', 'Freight that fits the order', 'Ro-ro is usually the most economical choice for driveable units; containers suit mixed orders, high-value cars and routes without a ro-ro service.')}
    <div class="term-grid">
      {''.join(f'<article class="term-card reveal"><p class="term-code">{esc(t["code"])}</p><h3>{esc(t["name"])}</h3><p>{esc(t["description"])}</p></article>' for t in MARKETS['incoterms'])}
    </div>
  </div>
</section>

{cta_html(prefix)}
"""
    description = "The Tengsheng export process: inquiry, sourcing and quotation, inspection, contract and payment, shipping and documents, arrival and after-sales support."
    return page(prefix, "process", "Our process", description, body, canonical="process.html")


def build_contact() -> str:
    prefix = ""
    options = "".join(f'<option value="{esc(v["name"])}">{esc(v["name"])}</option>' for v in VEHICLES)
    body = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>Contact</p>
    <h1>Start with the vehicle and the port.</h1>
    <p class="lead">Send the model, quantity and destination port. We will reply with availability, condition, an FOB price and a delivered estimate.</p>
  </div>
</section>

<section class="section section-tight">
  <div class="container contact-grid">
    <div class="contact-main">
      <form class="inquiry-form" data-inquiry-form data-email="{esc(EMAIL)}" data-whatsapp="{esc(WA_NUMBER)}">
        <h2>Inquiry form</h2>
        <p class="form-note">Submitting opens WhatsApp or your email app with the details filled in — no server or account required.</p>
        <div class="form-row">
          <label>Name<input type="text" name="name" autocomplete="name" required placeholder="Your name"></label>
          <label>Country<input type="text" name="country" autocomplete="country-name" required placeholder="Destination country"></label>
        </div>
        <div class="form-row">
          <label>Email<input type="email" name="email" autocomplete="email" placeholder="you@company.com"></label>
          <label>WhatsApp / phone<input type="tel" name="phone" autocomplete="tel" placeholder="+1 555 000 0000"></label>
        </div>
        <label>Vehicle of interest
          <select name="vehicle">
            <option value="General sourcing request">General sourcing request</option>
            {options}
          </select>
        </label>
        <label>Destination port &amp; quantity<input type="text" name="quantity" placeholder="e.g. Jebel Ali, 2 units"></label>
        <label>Message<textarea name="message" rows="5" placeholder="Model year, trim, budget, timeline or any special requirements…"></textarea></label>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit" data-send="whatsapp">Send via WhatsApp</button>
          <button class="btn btn-outline" type="button" data-send="email">Send via email</button>
        </div>
        <p class="form-status" role="status" data-form-status></p>
      </form>
    </div>
    <aside class="contact-side">
      <div class="contact-card">
        <h2>Direct contact</h2>
        <a href="mailto:{esc(EMAIL)}"><span>Email</span><strong>{esc(EMAIL)}</strong></a>
        <a href="{wa_link('Hello Tengsheng International, I would like to inquire about a vehicle.')}" target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><strong>{esc(WHATSAPP)}</strong></a>
        <p class="contact-hours">{esc(SITE['contact']['response'])}</p>
      </div>
      <div class="contact-card">
        <h2>What to include</h2>
        <ul class="check-list">
          <li>Make, model, year and trim</li>
          <li>New or pre-owned preference</li>
          <li>Quantity and destination port</li>
          <li>Left- or right-hand drive</li>
          <li>Target budget and timeline</li>
          <li>Any inspection or certification needs</li>
        </ul>
      </div>
      <div class="contact-card contact-regions">
        <h2>Export regions</h2>
        <ul class="country-list">{''.join(f'<li>{esc(r["name"])}</li>' for r in MARKETS['regions'])}</ul>
      </div>
    </aside>
  </div>
</section>

{cta_html(prefix)}
"""
    description = f"Contact Tengsheng International for vehicle export quotations. Email {EMAIL} or WhatsApp {WHATSAPP}. Send the model, quantity and destination port for a delivered price."
    return page(prefix, "contact", "Contact", description, body, canonical="contact.html", jsonld=organizations_jsonld())


def build_credits() -> str:
    prefix = ""
    guidelines = [
        (
            "Admin-managed media",
            "Photos and videos are attached to each vehicle in the CMS admin panel, then exported to this static site. Nothing on this site relies on third-party stock photography.",
        ),
        (
            "Placeholder artwork",
            "The line-drawing placeholders are original artwork created for Tengsheng International. Keep them while media is pending, or replace them once real photos are uploaded.",
        ),
        (
            "Rights for supplier media",
            "If you add photographs or video from a dealer, auction or supplier, confirm you hold the rights to publish them in every market you sell into.",
        ),
        (
            "File guidance",
            "Photos: JPG or WebP, around 1600 px wide, under 400 KB each. Video: MP4 (H.264), 1080p, under 50 MB each. Upload originals — the site resizes them.",
        ),
    ]
    rows = "".join(
        f'<li><strong>{esc(title)}</strong><span>{esc(text)}</span></li>' for title, text in guidelines
    )
    body = f"""
<section class="page-hero">
  <div class="container">
    <p class="eyebrow"><span></span>Media</p>
    <h1>Media &amp; credits</h1>
    <p class="lead">This showcase ships without stock photography. Vehicle images and video are uploaded by the Tengsheng team through the admin panel, so every listing carries media you control.</p>
  </div>
</section>
<section class="section section-tight">
  <div class="container">
    <ul class="doc-list">{rows}</ul>
    <p class="section-note" style="margin-top:28px">Questions about media rights or file formats? <a class="text-link" href="contact.html">Contact the export desk</a>.</p>
  </div>
</section>
"""
    return page(prefix, "credits", "Media & credits", "How vehicle photos and videos are managed on the Tengsheng International showcase, including file guidance and rights notes.", body, canonical="credits.html")


def build_404() -> str:
    body = """
<section class="error-page">
  <div class="container">
    <p class="eyebrow"><span></span>404</p>
    <h1>That page is not on the manifest.</h1>
    <p class="lead">The link may be outdated, or the vehicle may have been sold. Browse current inventory or send us the specification you need.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="vehicles.html">Browse inventory</a>
      <a class="btn btn-outline" href="index.html">Back to home</a>
    </div>
  </div>
</section>
"""
    return page("", "404", "Page not found", "The requested page could not be found.", body)


# --------------------------------------------------------------------------- output


def write(path: str, content: str) -> None:
    target = DIST / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    print(f"  wrote {path}")


def copy_assets() -> None:
    for name in ("css", "js", "img", "video"):
        src = ASSETS / name
        if not src.exists():
            continue
        target = DIST / "assets" / name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(src, target)
        print(f"  copied assets/{name}")


def build_sitemap() -> None:
    if not BASE_URL:
        print("  skipped sitemap.xml (set baseUrl in content/site.json)")
        return
    pages = ["index.html", "vehicles.html", "brands.html", "markets.html", "process.html", "about.html", "contact.html"]
    pages += [f"vehicles/{v['slug']}.html" for v in VEHICLES]
    pages += [f"brands/{b['slug']}.html" for b in brand_entries()]
    urls = "\n".join(f"  <url><loc>{BASE_URL}/{p}</loc></url>" for p in pages)
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}/sitemap.xml\n")


def main() -> None:
    DIST.mkdir(parents=True, exist_ok=True)
    print("Building Tengsheng International showcase…")
    write("index.html", build_home())
    write("vehicles.html", build_vehicles())
    for v in VEHICLES:
        write(f"vehicles/{v['slug']}.html", build_vehicle(v))
    write("brands.html", build_brands())
    for brand in brand_entries():
        write(f"brands/{brand['slug']}.html", build_brand(brand))
    write("markets.html", build_markets())
    write("about.html", build_about())
    write("process.html", build_process())
    write("contact.html", build_contact())
    write("credits.html", build_credits())
    write("404.html", build_404())
    copy_assets()
    build_sitemap()
    print(f"Done: {len(VEHICLES)} vehicles, {len(MARKETS['regions'])} regions → {DIST}")

    if "--serve" in sys.argv:
        import functools
        import http.server
        import socketserver

        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
        with socketserver.TCPServer(("", 8080), handler) as httpd:
            print("Serving http://localhost:8080 (Ctrl+C to stop)")
            httpd.serve_forever()


if __name__ == "__main__":
    main()
