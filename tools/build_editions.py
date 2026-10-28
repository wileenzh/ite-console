#!/usr/bin/env python3
"""Make the web version of the console from index.html.

    python3 tools/build_editions.py

  web.html     the full desktop console; never switches to the phone layout
index.html stays adaptive: desktop on a computer, phone layout on a phone.
The mobile version is a separate light app: tools/build_lite.py makes mobile.html from lite/tte-mobile.html.
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
assert '<meta charset="utf-8">' in html and "<title>TTE — To The Edge</title>" in html, "unexpected console file"
for ed, label in (("web", "Web"),):
    out = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script data-ite-lib="edition">window.TTE_EDITION = "%s";</script>' % ed, 1)
    out = out.replace("<title>TTE — To The Edge</title>", "<title>TTE — To The Edge (%s)</title>" % label, 1)
    (ROOT / (ed + ".html")).write_text(out, encoding="utf-8")
    print(ed + ".html", len(out) // 1024, "KB")
