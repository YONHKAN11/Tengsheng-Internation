#!/usr/bin/env python3
"""Generate the placeholder artwork used until real media is uploaded.

The showcase ships without stock photography. Each vehicle gets a designed
placeholder (body-type line drawing + model name) and a note that media is
managed in the CMS admin panel. Re-run this after editing content/vehicles.json:

    python tools/make_placeholders.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VEHICLES = json.loads((ROOT / "content" / "vehicles.json").read_text(encoding="utf-8"))["vehicles"]
OUT = ROOT / "assets" / "img"

GOLD = "#d6b26b"
TEXT = "#eef2f6"
MUTED = "#98a4b3"
FAINT = "#6f7c8c"

SILHOUETTES = {
    "SUV": """
      <path d="M40 236 L40 190 Q44 170 72 164 L168 158 Q206 104 282 96 L432 94 Q522 98 572 148 L700 154 Q756 158 768 186 L790 196 Q808 202 808 226 L808 236"/>
      <path d="M188 154 Q222 116 284 110 L424 108 Q494 112 528 150"/>
      <path d="M470 108 L470 152 M340 236 L340 196 M690 204 L690 236"/>
      <path d="M40 236 L808 236"/>
      <circle cx="212" cy="240" r="50"/>
      <circle cx="212" cy="240" r="26"/>
      <circle cx="642" cy="240" r="50"/>
      <circle cx="642" cy="240" r="26"/>
      <path d="M112 186 L150 186 M700 166 L742 170"/>
    """,
    "Pickup": """
      <path d="M40 236 L40 192 Q44 172 74 166 L176 160 Q212 110 288 102 L404 100 Q470 104 502 152 L556 154 L556 142 Q562 132 578 132 L760 132 Q792 136 796 164 L800 198 Q812 204 812 228 L812 236"/>
      <path d="M200 156 Q232 118 292 112 L392 110 Q458 114 486 152"/>
      <path d="M560 154 L780 154 M560 154 L560 134"/>
      <path d="M40 236 L812 236"/>
      <circle cx="206" cy="240" r="52"/>
      <circle cx="206" cy="240" r="26"/>
      <circle cx="650" cy="240" r="52"/>
      <circle cx="650" cy="240" r="26"/>
      <path d="M600 176 L760 176"/>
    """,
    "Sedan": """
      <path d="M40 236 L40 196 Q44 176 76 170 L182 164 Q232 112 312 104 L480 102 Q560 106 610 158 L722 164 Q772 168 782 192 L802 202 Q814 208 814 230 L814 236"/>
      <path d="M214 160 Q250 120 316 114 L470 112 Q540 116 574 154"/>
      <path d="M426 112 L426 158 M40 236 L814 236"/>
      <circle cx="214" cy="240" r="48"/>
      <circle cx="214" cy="240" r="24"/>
      <circle cx="640" cy="240" r="48"/>
      <circle cx="640" cy="240" r="24"/>
      <path d="M110 192 L152 192"/>
    """,
}


def esc(value: str) -> str:
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def frame(inner: str, label: str, premium: bool = False, chrome: bool = True) -> str:
    glow_opacity = "0.2" if premium else "0.14"
    brand_text = (
        f'<text x="800" y="150" text-anchor="middle" fill="{GOLD}" font-family="Segoe UI, system-ui, sans-serif" font-size="17" font-weight="600" letter-spacing="7">TENGSHENG INTERNATIONAL</text>'
        if chrome
        else ""
    )
    pending = (
        f'<text x="1500" y="150" text-anchor="end" fill="{FAINT}" font-family="Segoe UI, system-ui, sans-serif" font-size="13" letter-spacing="4">MEDIA PENDING</text>'
        if chrome
        else ""
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000" role="img" aria-label="{esc(label)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0f15"/>
      <stop offset="0.55" stop-color="#101823"/>
      <stop offset="1" stop-color="#0b1118"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.18" r="0.85">
      <stop offset="0" stop-color="{GOLD}" stop-opacity="{glow_opacity}"/>
      <stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{GOLD}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M80 0H0V80" fill="none" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <rect width="1600" height="1000" fill="url(#grid)"/>
  <rect width="1600" height="1000" fill="url(#glow)"/>
  <path d="M-120 940 L720 -40 L980 -40 L140 940 Z" fill="url(#beam)" opacity="0.5"/>
  <rect x="56" y="56" width="1488" height="888" fill="none" stroke="{GOLD}" stroke-opacity="0.16"/>
  <rect x="72" y="902" width="46" height="2" fill="{GOLD}" fill-opacity="0.6"/>
  {brand_text}
  {pending}
  {inner}
</svg>
"""


def vehicle_svg(vehicle: dict) -> str:
    name = vehicle["name"]
    kind = vehicle["bodyType"]
    outline = SILHOUETTES.get(kind, SILHOUETTES["SUV"])
    size = 64 if len(name) <= 28 else 56 if len(name) <= 34 else 48
    inner = f"""
  <g transform="translate(330, 250)" fill="none" stroke="{GOLD}" stroke-opacity="0.62" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft)">
    {outline}
  </g>
  <text x="800" y="782" text-anchor="middle" fill="{TEXT}" font-family="Segoe UI, system-ui, sans-serif" font-size="{size}" font-weight="700" letter-spacing="-1.5">{esc(name)}</text>
  <text x="800" y="832" text-anchor="middle" fill="{MUTED}" font-family="Segoe UI, system-ui, sans-serif" font-size="17" letter-spacing="4">PHOTOS &amp; VIDEO TO BE UPLOADED</text>
  <text x="800" y="886" text-anchor="middle" fill="{FAINT}" font-family="Segoe UI, system-ui, sans-serif" font-size="13" letter-spacing="3">MANAGED IN THE ADMIN PANEL</text>
"""
    return frame(inner, f"{name} — media pending")


def hero_svg() -> str:
    inner = f"""
  <g transform="translate(610, 360) scale(0.92)" fill="none" stroke="{GOLD}" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft)">
    {SILHOUETTES["SUV"]}
  </g>
  <g opacity="0.5" stroke="{GOLD}" stroke-opacity="0.3" fill="none">
    <circle cx="1210" cy="690" r="190"/>
    <circle cx="1210" cy="690" r="262" stroke-opacity="0.14"/>
  </g>
"""
    return frame(inner, "Vehicle export hero artwork", premium=True, chrome=False)


def favicon() -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="9" fill="#0a0f15"/>
  <path d="M9 12h22l-2 4H11z" fill="{GOLD}"/>
  <path d="M14 19h12l-1.7 10h-8.6z" fill="none" stroke="{GOLD}" stroke-width="1.8"/>
  <path d="M17 23h6M17 26h6" stroke="{GOLD}" stroke-width="1.3"/>
</svg>
"""


def main() -> None:
    (OUT / "vehicles").mkdir(parents=True, exist_ok=True)
    (OUT / "hero.svg").write_text(hero_svg(), encoding="utf-8")
    (OUT / "favicon.svg").write_text(favicon(), encoding="utf-8")
    for vehicle in VEHICLES:
        (OUT / "vehicles" / f"{vehicle['slug']}.svg").write_text(vehicle_svg(vehicle), encoding="utf-8")
    print(f"Wrote {len(VEHICLES)} vehicle placeholders, hero and favicon to {OUT}")


if __name__ == "__main__":
    main()
