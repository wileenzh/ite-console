// TTE app service worker (version 4006e4dd47)
// The app shell and its libraries are kept so the app starts fast and opens without signal.
// Live data (hazard feeds, news, maps) always comes from the network and is never stored here.
const SHELL = "ite-shell-4006e4dd47", LIBS = "ite-libs-v1";
const SHELL_FILES = ["./", "./index.html", "./manifest.json", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/favicon-32.png"];
const LIB_HOSTS = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "unpkg.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("ite-shell-") && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  // the app page: newest from the network, the kept copy when offline
  if (r.mode === "navigate" || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname))){
    e.respondWith(fetch(r).then(res => { if (res.ok){ const copy = res.clone(); caches.open(SHELL).then(c => c.put("./index.html", copy)); } return res; })
      .catch(() => caches.match("./index.html").then(m => m || caches.match("./"))));
    return; }
  if (u.origin === location.origin){ e.respondWith(caches.match(r).then(m => m || fetch(r))); return; }
  // libraries (Leaflet, SheetJS…): the kept copy straight away, refreshed in the background
  if (LIB_HOSTS.includes(u.hostname) && /\.(js|css)$/.test(u.pathname)){
    e.respondWith(caches.open(LIBS).then(c => c.match(r).then(m => { const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => m); return m || net; })));
  }
});
