#!/usr/bin/env python3
"""Build the installable phone app (app/index.html) from the console.

    python3 tools/build_app.py [source.html]

The app is the same console (same file, same features) with what a phone
needs to install it from the browser: a web app manifest, iPhone home-screen
tags and icons, a service worker that keeps the app shell for fast and
offline starts, and a one-time "Add to Home Screen" hint in Safari.
Run it again whenever the console changes, then publish app/.
"""
import hashlib, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "index.html"
html = src.read_text(encoding="utf-8")
version = hashlib.sha256(html.encode()).hexdigest()[:10]

HEAD = """<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0E171C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TTE">
<meta name="format-detection" content="telephone=no">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
"""

TAIL = """<script>
/* ---------- installable app: service worker and the iPhone install hint ---------- */
(function(){
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost"))
    try{ navigator.serviceWorker.register("sw.js").catch(function(){}); }catch(e){}
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  document.documentElement.classList.toggle("installed", !!standalone);
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var seen = false; try{ seen = localStorage.getItem("ite.installhint") === "1"; }catch(e){}
  if (standalone || seen) return;
  var box = document.createElement("div"); box.id = "installHint"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Install the TTE app");
  box.innerHTML = '<img src="icons/icon-180.png" alt="" width="52" height="52"><div class="ih"><b>Install TTE on your ' + (ios ? "iPhone" : "phone") + '</b>'
    + (ios ? '<span>In Safari, tap <b>Share</b> <svg viewBox="0 0 24 24" width="16" height="16" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4M5 11v9h14v-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> then <b>Add to Home Screen</b>. It opens full screen like an app.</span>'
          : '<span>Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</span>')
    + '</div><button type="button" aria-label="Close">Got it</button>';
  function close(){ box.remove(); try{ localStorage.setItem("ite.installhint", "1"); }catch(e){} }
  box.querySelector("button").onclick = close;
  var st = document.createElement("style");
  st.textContent = "#installHint{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:3100;display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;background:#16242B;color:#EEF3F5;border:1px solid #2C3D45;box-shadow:0 10px 30px rgba(0,0,0,.45);font:14px/1.4 -apple-system,system-ui,sans-serif;max-width:520px;margin:0 auto}"
    + "#installHint img{border-radius:12px;flex:none}#installHint .ih{flex:1;display:flex;flex-direction:column;gap:3px}#installHint svg{vertical-align:-3px}"
    + "#installHint button{flex:none;border:0;border-radius:10px;padding:9px 12px;background:#2F7BD9;color:#fff;font:700 14px -apple-system,system-ui,sans-serif}"
    + "@media (min-width:761px){#installHint{display:none}}";
  document.head.appendChild(st);
  setTimeout(function(){ document.body.appendChild(box); }, 1200);
})();
</script>
"""

assert "<title>" in html and "</body>" in html, "unexpected source file"
out = html.replace("<title>", HEAD + "<title>", 1)
i = out.rindex("</body>")
out = out[:i] + TAIL + out[i:]

app = ROOT / "app"
app.mkdir(exist_ok=True)
(app / "index.html").write_text(out, encoding="utf-8")

(app / "manifest.json").write_text("""{
  "name": "TTE — To The Edge",
  "short_name": "TTE",
  "description": "PSOC situational awareness: hazards, alerts, incidents and sites.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0E171C",
  "theme_color": "#0E171C",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
""", encoding="utf-8")

(app / "sw.js").write_text("""// TTE app service worker (version %s)
// The app shell and its libraries are kept so the app starts fast and opens without signal.
// Live data (hazard feeds, news, maps) always comes from the network and is never stored here.
const SHELL = "ite-shell-%s", LIBS = "ite-libs-v1";
const SHELL_FILES = ["./", "./index.html", "./manifest.json", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon-32.png"];
const LIB_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "unpkg.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("ite-shell-") && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  // the app page: newest from the network, the kept copy when offline
  if (r.mode === "navigate" || (u.origin === location.origin && /\\/(index\\.html)?$/.test(u.pathname))){
    e.respondWith(fetch(r).then(res => { if (res.ok){ const copy = res.clone(); caches.open(SHELL).then(c => c.put("./index.html", copy)); } return res; })
      .catch(() => caches.match("./index.html").then(m => m || caches.match("./"))));
    return; }
  if (u.origin === location.origin){ e.respondWith(caches.match(r).then(m => m || fetch(r))); return; }
  // libraries (Leaflet, SheetJS…): the kept copy straight away, refreshed in the background
  if (LIB_HOSTS.includes(u.hostname) && /\\.(js|css)$/.test(u.pathname)){
    e.respondWith(caches.open(LIBS).then(c => c.match(r).then(m => { const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => m); return m || net; })));
  }
});
""" % (version, version), encoding="utf-8")
print("app/ built from", src.name, "version", version, "-", len(out) // 1024, "KB")
