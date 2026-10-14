// Administrator tool: rebuild src/data/ttp.json from a PULSE dashboard file when the REN TTP changes.
//   node tools/extract-ttp.mjs path/to/PULSE.html
// The TTP in PULSE is JavaScript, so it is evaluated here, offline, in an empty sandbox with no access to the
// file system, network or this process. Review the diff of src/data/ttp.json before releasing.
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = process.argv[2]; if (!file){ console.error("usage: node tools/extract-ttp.mjs PULSE.html"); process.exit(1); }
const html = readFileSync(file, "utf8"), mods = {}; html.replace(/^\s*([a-z]+): "([A-Za-z0-9+/=]{1000,})"/gm, (m, k, b) => { mods[k] = Buffer.from(b, "base64").toString("utf8"); return m; });
const src = mods.tracker || html, i = src.indexOf('id="psoc-ttp-v'), a = i < 0 ? -1 : src.indexOf("var TTP_META", i); if (a < 0){ console.error("no REN TTP found in this file"); process.exit(1); }
let out = null, b = a; while ((b = src.indexOf("})();", b + 1)) > 0 && !out){ try{ out = vm.runInNewContext(src.slice(a, b + 5) + "\n;({ meta: TTP_META, order: TTP_ORDER, ttp: TTP })", Object.create(null), { timeout: 2000 }); }catch(e){} }
if (!out){ console.error("could not read the REN TTP"); process.exit(1); }
const dest = join(dirname(fileURLToPath(import.meta.url)), "../src/data/ttp.json"); writeFileSync(dest, JSON.stringify(JSON.parse(JSON.stringify(out))));
console.log(`REN TTP v${out.meta.version} (${out.meta.date}), ${out.order.length} categories → src/data/ttp.json`);
