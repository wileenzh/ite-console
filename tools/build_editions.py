#!/usr/bin/env python3
"""Make the web and mobile versions of the console from index.html.

    python3 tools/build_editions.py

  web.html     the full desktop console; never switches to the phone layout
  mobile.html  the phone layout only, with each role's tabs and the screens meant for a phone
               (on a computer it shows as a phone in the middle of the screen); app/ and the
               store app are built from it
index.html stays adaptive: desktop on a computer, phone layout on a phone.
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
assert '<meta charset="utf-8">' in html and "<title>TTE — To The Edge</title>" in html, "unexpected console file"
for ed, label in (("web", "Web"), ("mobile", "Mobile")):
    out = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script data-ite-lib="edition">window.TTE_EDITION = "%s";</script>' % ed, 1)
    out = out.replace("<title>TTE — To The Edge</title>", "<title>TTE — To The Edge (%s)</title>" % label, 1)
    (ROOT / (ed + ".html")).write_text(out, encoding="utf-8")
    print(ed + ".html", len(out) // 1024, "KB")
