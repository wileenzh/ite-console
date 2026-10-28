#!/usr/bin/env python3
"""Make mobile.html, the light phone app, from lite/tte-mobile.html.

    python3 tools/build_lite.py

The phone app is its own small page (not the console): what needs me now, report to the PSOC, shift and patrol,
decisions, and reading briefs. It shares the console's data through the PSOC server (or the browser's storage when
both are open on the same device). This adds the console's built-in demo site list, so a phone that is not yet
connected can still choose a site; a connected phone uses the organisation's site list from the PSOC instead.
app/ and the store app are then built from mobile.html (tools/build_app.py mobile.html).
"""
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "lite" / "tte-mobile.html").read_text(encoding="utf-8")
console = (ROOT / "index.html").read_text(encoding="utf-8")
m = re.search(r"const BUILTIN_SITES = (\[.*?\]);\n", console)
assert m, "the console's built-in site list was not found"
sites = [{k: s.get(k) for k in ("code", "city", "country", "region", "lat", "lon", "src", "cls", "status")} for s in json.loads(m.group(1))]
assert all(s.get("src") in ("DEMO", "OFFICE") for s in sites), "only the built-in demo sites may go into the phone app"
assert "/*SITES*/[]" in src
out = src.replace("/*SITES*/[]", json.dumps(sites, separators=(",", ":")).replace("</", "<\\/"), 1)
(ROOT / "mobile.html").write_text(out, encoding="utf-8")
print("mobile.html (light phone app)", len(out) // 1024, "KB,", len(sites), "demo sites")
