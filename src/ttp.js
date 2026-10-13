// The REN TTP (triggers, thresholds and procedures). TTP v2.2 from the PULSE Master Tracker is built in;
// a newer version is built in by running tools/extract-ttp.mjs on the new PULSE file and releasing. The console itself
// never runs code from an imported file.
import { load, save, esc, emit } from "./core.js";
import { CFG } from "./config.js";
import SOP from "./data/sop.json";
import BUILTIN from "./data/ttp.json";

// TTP category keys → the console's category keys
const KEYMAP = { power_disruption: "power_disruptions", soil_stability: "soil_ground_stability", transportation: "transportation_hazard", volcanic: "volcanic_hazard",
  water_supply: "water_supply_quality", wildfire: "wildfires", supply_chain: "supply_chain_disruption" };
const PLACEHOLDER = JSON.parse(JSON.stringify(SOP));
export let TTP = null;                       // { meta, cats: { consoleKey: {...} }, at, file, builtin }

const md = s => esc(String(s || "")).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const ul = a => a && a.length && !(a.length === 1 && /^nil$/i.test(a[0])) ? `<ul>${a.map(x => `<li>${md(x)}</li>`).join("")}</ul>` : `<p class="help">None in the TTP.</p>`;
const plain = s => String(s || "").replace(/\*\*/g, "");
const hours = list => { const m = (list || []).map(x => /every\s+\*{0,2}(\d+)\s*hours?/i.exec(x)).find(Boolean); return m ? +m[1] : null; };

export function ttpHtml(t){ if (!t) return "";
  const sec = (title, body) => `<h4 class="ttp-h">${esc(title)}</h4>${body}`, part = (x) => `${ul(x.trig)}<div class="ttp-sub">Follow-up</div>${ul(x.cad)}<div class="ttp-sub">End — final update when all are met</div>${ul(x.end)}`;
  return `<p class="prose">${md(t.desc)}</p>${sec("Monitor", ul(t.monitor))}${sec("PSOC Operations / Regional Manager trigger", part(t.mgr))}${sec("APAC Escalation Chat trigger", ul(t.esc))}
    ${sec("Intelligence Channel / SLT trigger", part(t.intel))}${sec("Event notice (REN) — issue when any is met", `${TTP.meta.recipients ? `<p class="help">Recipients: ${esc(TTP.meta.recipients)}</p>` : ""}${ul(t.ren.crit)}${t.ren.cad && t.ren.cad.length ? `<div class="ttp-sub">Follow-up</div>${ul(t.ren.cad)}` : ""}${t.ren.reason ? `<div class="ttp-sub">Why</div><p class="prose">${md(t.ren.reason)}</p>` : ""}`)}
    ${sec("Close monitoring when all are achieved", ul(t.close))}${t.cons && t.cons.length ? sec("Security, EHS and resiliency considerations", ul(t.cons)) : ""}${t.psoc && t.psoc.length ? sec("PSOC will", ul(t.psoc)) : ""}${t.note ? `<p class="help">${md(t.note)}</p>` : ""}`; }

// keep only text from what the file returned, in the shape we use
const strs = a => Array.isArray(a) ? a.map(x => String(x)).slice(0, 60) : [];
const part = x => ({ trig: strs(x && x.trig), cad: strs(x && x.cad), end: strs(x && x.end) });
function clean(raw){ const cats = {};
  (raw.order || Object.keys(raw.ttp || {})).forEach(k => { const t = (raw.ttp || {})[k]; if (!t || typeof t !== "object") return;
    cats[KEYMAP[k] || k] = { label: String(t.label || k), desc: String(t.desc || ""), monitor: strs(t.monitor), mgr: part(t.mgr), esc: strs(t.esc), intel: part(t.intel),
      ren: { crit: strs(t.ren && t.ren.crit), cad: strs(t.ren && t.ren.cad), reason: String((t.ren && t.ren.reason) || "") }, close: strs(t.close), cons: strs(t.cons), psoc: strs(t.psoc), note: String(t.note || "") }; });
  const m = raw.meta || {}; return { meta: { version: String(m.version || ""), date: String(m.date || ""), owner: String(m.owner || ""), recipients: String(m.recipients || "") }, cats }; }

TTP = load("ttp", null) || Object.assign(clean(BUILTIN), { at: null, file: "built in", builtin: true });
// Put the TTP into the category list every screen reads (categories it doesn't cover keep their placeholder).
function apply(){ Object.keys(SOP).forEach(k => { if (!PLACEHOLDER[k]) delete SOP[k]; else SOP[k] = Object.assign({}, PLACEHOLDER[k]); });
  if (TTP) Object.entries(TTP.cats).forEach(([k, t]) => { SOP[k] = { label: t.label, html: ttpHtml(t), ttp: true }; }); }
apply();

export const ttpFor = cat => TTP && TTP.cats[cat] || null;
export const ttpName = () => TTP ? `REN TTP${TTP.meta.version ? " v" + TTP.meta.version : ""}` : "";
// update cadence for a category: hours between PSOC Manager updates and Intel / SLT updates
export function cadenceFor(cat){ const t = ttpFor(cat);
  if (!t || CFG.cadence === "fixed") return { m: 12, i: 24, src: "fixed" };
  const m = hours(t.mgr.cad), i = hours(t.intel.cad); return { m: m || 12, i: i || 24, src: ttpName() }; }
export function setTTP(raw, file){ const c = clean(raw); if (!Object.keys(c.cats).length) throw new Error("the TTP in this file is empty");
  TTP = Object.assign(c, { at: Date.now(), file: file || "" }); save("ttp", TTP); apply(); emit("ttp"); return Object.keys(c.cats).length; }
export function clearTTP(){ TTP = Object.assign(clean(BUILTIN), { at: null, file: "built in", builtin: true }); save("ttp", null); apply(); emit("ttp"); }
export const checklistFor = cat => { const t = ttpFor(cat); if (!t) return null;
  return { close: t.close.map(plain), psoc: t.psoc.map(plain), cons: t.cons.map(plain), ren: t.ren.crit.map(plain) }; };
