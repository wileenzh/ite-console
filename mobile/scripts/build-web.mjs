// Build the web part of the store app (mobile/www) from the mobile version of the console (../mobile.html,
// made by tools/build_editions.py; falls back to ../index.html).
//   node scripts/build-web.mjs
// The app is the same console with its phone layout; in the store app it detects Capacitor and uses the phone's
// features (reminders, haptics, back button, push). Leaflet is bundled so the map starts without the network;
// other libraries still load on demand from their pinned CDN copies.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, ".."), repo = path.resolve(root, ".."), www = path.join(root, "www");
const src = fs.existsSync(path.join(repo, "mobile.html")) ? path.join(repo, "mobile.html") : path.join(repo, "index.html"); let html = fs.readFileSync(src, "utf8");
if (!html.includes("<title>") || !html.includes("</body>")) throw new Error("unexpected console file");
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(path.join(www, "lib/leaflet"), { recursive: true });
// Leaflet from node_modules (same bytes as the pinned CDN file, so the integrity hashes still match)
const ld = path.join(root, "node_modules/leaflet/dist"); for (const f of ["leaflet.js", "leaflet.css"]) fs.copyFileSync(path.join(ld, f), path.join(www, "lib/leaflet", f));
fs.cpSync(path.join(ld, "images"), path.join(www, "lib/leaflet/images"), { recursive: true });
const sri = f => "sha384-" + crypto.createHash("sha384").update(fs.readFileSync(path.join(www, "lib/leaflet", f))).digest("base64");
let n = 0; const rep = (a, b) => { if (!html.includes(a)) throw new Error("not found: " + a); html = html.split(a).join(b); n++; };
rep('href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css"', 'href="lib/leaflet/leaflet.css"');
rep('src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"', 'src="lib/leaflet/leaflet.js"');
for (const [f, re] of [["leaflet.css", /(href="lib\/leaflet\/leaflet\.css" integrity=")([^"]+)"/], ["leaflet.js", /(src="lib\/leaflet\/leaflet\.js" integrity=")([^"]+)"/]]){
  const m = re.exec(html); if (m && m[2] !== sri(f)) throw new Error(`${f}: bundled copy does not match the pinned integrity hash`); }
const head = `<meta name="theme-color" content="#0E171C">
<meta name="format-detection" content="telephone=no">
<meta name="color-scheme" content="dark light">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
`;
html = html.replace("<title>", head + "<title>");
fs.writeFileSync(path.join(www, "index.html"), html);
fs.cpSync(path.join(repo, "app/icons"), path.join(www, "icons"), { recursive: true });
const ver = crypto.createHash("sha256").update(html).digest("hex").slice(0, 10);
fs.writeFileSync(path.join(www, "version.json"), JSON.stringify({ version: ver, built: new Date().toISOString() }) + "\n");
console.log(`www/ built from ${path.basename(src)} (${Math.round(html.length / 1024)} KB, ${n} library links bundled, version ${ver})`);
