// Bundles src/ into one self-contained page, next/index.html, so it still opens from a file,
// from GitHub Pages and inside the desktop app. Run: npm run build   (or: npm run watch)
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");

async function build(){
  const r = await esbuild.build({ entryPoints: [join(root, "src/main.js")], bundle: true, format: "iife", target: "es2020",
    minify: false, write: false, loader: { ".json": "json" }, legalComments: "none", charset: "utf8" });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  const css = readFileSync(join(root, "src/styles.css"), "utf8");
  const page = readFileSync(join(root, "src/index.html"), "utf8")
    .replace("/*__CSS__*/", () => css).replace("/*__JS__*/", () => js)
    .replace("__BUILD__", new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC");
  mkdirSync(join(root, "next"), { recursive: true });
  writeFileSync(join(root, "next/index.html"), page);
  console.log(`next/index.html  ${(page.length / 1024).toFixed(0)} KB`);
}
if (watch){
  const ctx = await esbuild.context({ entryPoints: [join(root, "src/main.js")], bundle: true, write: false, plugins: [{ name: "rebuild", setup(b){ b.onEnd(() => build().catch(e => console.error(e.message))); } }] });
  await ctx.watch(); console.log("watching src/ …");
} else await build();
