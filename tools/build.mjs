// Bundles src/ into one page, next/index.html, and copies every third-party library and font it uses into
// next/vendor/ with a subresource-integrity hash, so the console loads nothing from public CDNs.
// Run: npm run build   (or: npm run watch)
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");
const nm = p => join(root, "node_modules", p);
// key: [source in node_modules, name in next/vendor]
const VENDOR = { leafletJs: ["leaflet/dist/leaflet.js", "leaflet.js"], leafletCss: ["leaflet/dist/leaflet.css", "leaflet.css"], xlsx: ["xlsx/dist/xlsx.full.min.js", "xlsx.full.min.js"],
  hls: ["hls.js/dist/hls.min.js", "hls.min.js"], tf: ["@tensorflow/tfjs/dist/tf.min.js", "tf.min.js"], cocossd: ["@tensorflow-models/coco-ssd/dist/coco-ssd.min.js", "coco-ssd.min.js"],
  plex400: ["@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2", "plex-sans-400.woff2"], plex500: ["@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2", "plex-sans-500.woff2"],
  plex600: ["@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2", "plex-sans-600.woff2"], cond500: ["@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-500-normal.woff2", "plex-cond-500.woff2"],
  cond600: ["@fontsource/ibm-plex-sans-condensed/files/ibm-plex-sans-condensed-latin-600-normal.woff2", "plex-cond-600.woff2"] };
const LICENSES = [["leaflet/LICENSE", "LICENSE-leaflet.txt"], ["xlsx/LICENSE", "LICENSE-sheetjs.txt"], ["hls.js/LICENSE", "LICENSE-hls.txt"], ["@tensorflow/tfjs/package.json", "tfjs-package.json"], ["@fontsource/ibm-plex-sans/LICENSE", "LICENSE-ibm-plex.txt"]];

function vendor(){ const out = {}; mkdirSync(join(root, "next/vendor"), { recursive: true });
  for (const [k, [from, to]] of Object.entries(VENDOR)){ const buf = readFileSync(nm(from)); copyFileSync(nm(from), join(root, "next/vendor", to));
    out[k] = { src: "vendor/" + to, sri: "sha384-" + createHash("sha384").update(buf).digest("base64") }; }
  for (const [from, to] of LICENSES){ try{ copyFileSync(nm(from), join(root, "next/vendor", to)); }catch(e){} }
  return out; }

async function build(){ const V = vendor();
  const r = await esbuild.build({ entryPoints: [join(root, "src/main.js")], bundle: true, format: "iife", target: "es2020", minify: false, write: false, loader: { ".json": "json" }, legalComments: "none", charset: "utf8",
    define: { __VENDOR__: JSON.stringify(V) } });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  const fonts = [["IBM Plex Sans", 400, "plex400"], ["IBM Plex Sans", 500, "plex500"], ["IBM Plex Sans", 600, "plex600"], ["IBM Plex Sans Condensed", 500, "cond500"], ["IBM Plex Sans Condensed", 600, "cond600"]]
    .map(([f, w, k]) => `@font-face{font-family:"${f}";font-style:normal;font-weight:${w};font-display:swap;src:url(${V[k].src}) format("woff2")}`).join("\n");
  const css = fonts + "\n" + readFileSync(join(root, "src/styles.css"), "utf8");
  const page = readFileSync(join(root, "src/index.html"), "utf8")
    .replace("__LEAFLET_CSS__", V.leafletCss.src).replace("__LEAFLET_CSS_SRI__", V.leafletCss.sri).replace("__LEAFLET_JS__", V.leafletJs.src).replace("__LEAFLET_JS_SRI__", V.leafletJs.sri)
    .replace("/*__CSS__*/", () => css).replace("/*__JS__*/", () => js)
    .replace("__BUILD__", new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC");
  writeFileSync(join(root, "next/index.html"), page);
  console.log(`next/index.html  ${(page.length / 1024).toFixed(0)} KB, ${Object.keys(V).length} vendor files`);
}
if (watch){
  const ctx = await esbuild.context({ entryPoints: [join(root, "src/main.js")], bundle: true, write: false, define: { __VENDOR__: "{}" }, plugins: [{ name: "rebuild", setup(b){ b.onEnd(() => build().catch(e => console.error(e.message))); } }] });
  await ctx.watch(); console.log("watching src/ …");
} else await build();
