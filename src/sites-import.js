// Loading the real estate: a site workbook or CSV (the PULSE / DCI CSV format works as is), or a PULSE file
// (site list, offices, site contacts, PSOC desk contacts, the REN TTP, optionally its keys). Everything stays in this browser.
import { loadScript, km, load, save } from "./core.js";
import { SITES, SITES_META, EVENTS, CITIES, saveEvents, applyCadence, setSites, setContacts, audit } from "./model.js";
import { extractTTP, setTTP, ttpName } from "./ttp.js";
import { CFG, saveCfg } from "./config.js";

const XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
const COLS = { site: ["site", "site name", "sitename", "site code", "name", "datacenter", "data center", "dc", "dc code"], city: ["city", "security campus / metro", "campus", "metro", "location"],
  region: ["sub-region", "subregion", "sub region", "region"], country: ["country", "nation"], lat: ["lat", "latitude"], lon: ["lon", "long", "longitude", "lng"],
  latlon: ["latitude, longitude", "latitude,longitude", "lat, long", "lat/long", "lat, lon", "coordinates", "gps"], cls: ["class", "site class", "facility class", "tier", "classification"], status: ["status", "site status", "operational status", "site phase"] };
const nk = h => String(h || "").trim().toLowerCase().replace(/\s+/g, " ");
const unwrap = v => { if (typeof v === "string" && /^\s*\[\s*".*"\s*\]\s*$/.test(v)) try{ const a = JSON.parse(v); return Array.isArray(a) ? a.join(", ") : v; }catch(e){} return v; };
function mapRow(raw){ const o = {}, keys = Object.keys(raw); Object.keys(COLS).forEach(f => { const m = keys.find(k => COLS[f].includes(nk(k))); o[f] = m !== undefined ? unwrap(raw[m]) : undefined; }); return o; }
function normClass(v){ v = String(v || "").trim().toUpperCase(); if (/PROJECT EQUIVALENT|^C-?PE$/.test(v)) return "C-PE"; if (v === "EDGE") return "EDGE"; if (v === "OFFICE") return "OFFICE"; if (v === "CAMPUS") return "CAMPUS";
  const m = /^([A-H])-?CLASS$/.exec(v) || /^CLASS\s+([A-H])$/.exec(v); return m ? ("EFGH".includes(m[1]) ? "EDGE" : "CLASS " + m[1]) : (v || "UNKNOWN"); }
const normStatus = v => String(v || "").trim().toUpperCase().replace(/&/g, "AND").replace(/\s+/g, " ");
export const siteCode = n => { const t = String(n || "").trim().toUpperCase().replace(/\s*\([^)]*\)\s*$/, "").trim(), m = t.match(/\b[A-Z]{2,5}\d{1,3}(?:-\d{1,3})?\b/g); return m && m.length ? m[m.length - 1] : t; };

export function rowsToSites(rows, opts = {}){ const r = { added: 0, skipped: 0, planning: 0, noCoords: 0 }, out = [], seen = new Set();
  rows.forEach(raw => { const m = mapRow(raw), t = v => v == null ? "" : String(v).trim(), st = normStatus(m.status);
    if (st === "PLANNING AND DESIGN" || st === "PROPOSED" || st === "CANCELED" || st === "CANCELLED"){ r.planning++; return; }
    const name = t(m.site); if (!name){ r.skipped++; return; } let la = t(m.lat), lo = t(m.lon); if ((!la || !lo) && t(m.latlon)){ const b = t(m.latlon).split(",").map(x => x.trim()); la = la || b[0]; lo = lo || b[1]; }
    const lat = parseFloat(la), lon = parseFloat(lo); if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180){ r.noCoords++; return; }
    const cls = normClass(m.cls), code = cls === "OFFICE" ? name : siteCode(name); if (seen.has(code)){ r.skipped++; return; } seen.add(code);
    out.push({ code, name: cls === "OFFICE" ? name : "", city: t(m.city), country: t(m.country), region: t(m.region), cls, status: st || "UNKNOWN", lat, lon }); r.added++; });
  return { sites: out, report: Object.assign(r, checkSites(out, rows)) }; }

// Data checks, reported rather than silently trusted: field coverage, counts by class and status,
// cities that disagree with the coordinates, and sites far from the others filed under the same city.
function checkSites(sites, rows){ const by = k => sites.reduce((o, x) => (o[x[k]] = (o[x[k]] || 0) + 1, o), {}), fixes = [], outliers = [], groups = {};
  const coverage = Object.keys(COLS).map(f => { const n = rows.filter(raw => { const v = mapRow(raw)[f]; return v != null && String(v).trim() !== ""; }).length; return [f, n, rows.length]; }).filter(x => x[1] || ["site", "city", "country", "cls", "status"].includes(x[0]));
  sites.forEach(x => { if (/^hebei$/i.test(x.city)){ fixes.push(`${x.code}: city "Hebei" (a province) read as Zhangjiakou`); x.city = "Zhangjiakou"; }
    const named = CITIES.find(c => c.name.toLowerCase() === String(x.city).toLowerCase());
    if (named && km(x.lat, x.lon, named.lat, named.lon) > 300){ const near = CITIES.filter(c => km(x.lat, x.lon, c.lat, c.lon) < 150).sort((a, b) => km(x.lat, x.lon, a.lat, a.lon) - km(x.lat, x.lon, b.lat, b.lon))[0];
      if (near){ fixes.push(`${x.code}: city "${x.city}" corrected to ${near.name} (its coordinates are ${Math.round(km(x.lat, x.lon, near.lat, near.lon))} km from ${near.name})`); x.city = near.name; } } });
  sites.forEach(x => { if (x.city) (groups[x.city] = groups[x.city] || []).push(x); });
  Object.entries(groups).forEach(([c, g]) => { if (g.length < 3) return; const med = a => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)], la = med(g.map(x => x.lat)), lo = med(g.map(x => x.lon));
    g.forEach(x => { const d = km(la, lo, x.lat, x.lon); if (d > 150) outliers.push(`${x.code} (${c}, ${Math.round(d)} km from the other ${c} sites)`); }); });
  return { byClass: by("cls"), byStatus: by("status"), coverage, fixes, outliers, rows: rows.length }; }
export async function readWorkbook(file){ await loadScript(XLSX_URL); const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" }); let best = null;
  wb.SheetNames.forEach(n => { const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: "" }), hits = rows.length ? Object.keys(rows[0]).filter(k => Object.values(COLS).some(v => v.includes(nk(k)))).length : 0; if (!best || hits > best.hits) best = { rows, hits, sheet: n }; });
  if (!best || !best.rows.length) throw new Error("no rows found"); return best; }
export let LAST_REPORT = load("siteReport", null);
export function applySites(sites, source, keepOffices, report){ const offices = keepOffices ? SITES.filter(s => s.cls === "OFFICE" && !sites.some(x => x.code === s.code)) : [];
  const manual = manualSites().filter(m => !sites.some(x => x.code === m.code)), before = new Set(SITES.map(x => x.code)), next = sites.concat(offices, manual);
  const added = next.filter(x => !before.has(x.code)).map(x => x.code), removed = SITES.filter(x => !next.some(y => y.code === x.code)).map(x => x.code);
  if (report){ LAST_REPORT = Object.assign({ source, at: Date.now(), added: added.length, removed: removed.length }, report); save("siteReport", LAST_REPORT); }
  setSites(next, { source, at: Date.now(), demo: false }); audit("Sites loaded", source, `${sites.length} sites; ${added.length} added, ${removed.length} removed`); return { added, removed }; }

/* sites added by hand: kept separately so a re-sync of the site file never drops them */
export const manualSites = () => load("manualSites", []);
export function addManualSite(x){ const list = manualSites().filter(m => m.code !== x.code).concat([Object.assign({ manual: true }, x)]); save("manualSites", list);
  setSites(SITES.filter(s => s.code !== x.code).concat([Object.assign({ manual: true }, x)]), Object.assign({}, SITES_META, { demo: false })); audit("Site added by hand", x.code); }
export function removeManualSite(code){ save("manualSites", manualSites().filter(m => m.code !== code)); setSites(SITES.filter(s => !(s.code === code && s.manual)), SITES_META); audit("Site removed", code); }

/* a linked site file (Chrome and Edge): re-read on a schedule so the console follows the master list */
const DB = () => new Promise((res, rej) => { const r = indexedDB.open("ite2-files", 1); r.onupgradeneeded = () => r.result.createObjectStore("h"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idb = async (mode, fn) => { const db = await DB(); return new Promise((res, rej) => { const tx = db.transaction("h", mode), q = fn(tx.objectStore("h")); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); }); };
export const canLink = () => typeof window.showOpenFilePicker === "function";
export async function linkSiteFile(){ const [h] = await window.showOpenFilePicker({ types: [{ description: "Site list", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"], "text/csv": [".csv"] } }] });
  await idb("readwrite", st => st.put(h, "sites")); save("siteLink", { name: h.name, at: Date.now() }); return syncSiteFile(true); }
export async function unlinkSiteFile(){ await idb("readwrite", st => st.delete("sites")); save("siteLink", null); }
export async function syncSiteFile(ask){ const h = await idb("readonly", st => st.get("sites")); if (!h) return null;
  let perm = await h.queryPermission({ mode: "read" }); if (perm !== "granted" && ask) perm = await h.requestPermission({ mode: "read" }); if (perm !== "granted") return { needsPermission: true };
  const f = await h.getFile(), link = load("siteLink", {}) || {}; if (!ask && link.modified === f.lastModified) return { unchanged: true };
  const wb = await readWorkbook(f), { sites, report } = rowsToSites(wb.rows); if (!sites.length) throw new Error("no usable rows in " + f.name);
  const r = applySites(sites, f.name + " (linked)", true, report); save("siteLink", Object.assign(link, { name: f.name, modified: f.lastModified, synced: Date.now() })); return r; }

// a PULSE dashboard file: everything is read in this browser and only what you tick is kept
export async function readPulseFile(file){ const txt = await file.text(), found = { file: file.name };
  const grab = name => { const m = new RegExp("const " + name + " = (\\{[\\s\\S]*?\\}|\\[[\\s\\S]*?\\]);\\n").exec(txt); if (!m) return null; try{ return JSON.parse(m[1]); }catch(e){ return null; } };
  const csvTag = /id="psoc-sitesync-csv">\s*([\s\S]*?)<\/script>/.exec(txt);
  if (csvTag){ await loadScript(XLSX_URL); const wb = window.XLSX.read(csvTag[1].trim(), { type: "string" }); found.rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); }
  found.offices = (grab("PSOC_SITES") || []).filter(x => x.k === "OFFICE"); found.dci = grab("PSOC_DCI"); found.officeAddr = grab("PSOC_OFFICES"); found.watch = grab("PSOC_WATCH"); found.keys = {};
  try{ const dec = b => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))), mods = {}; txt.replace(/^\s*([a-z]+): "([A-Za-z0-9+/=]{1000,})"/gm, (m, k, b) => { mods[k] = b; return m; });
    if (mods.watch){ const w = dec(mods.watch), c = /CWA_KEY\s*=\s*'([^']+)'/.exec(w), k = /KMA_KEY\s*=\s*'([^']+)'/.exec(w); if (c && !/YOUR/.test(c[1])) found.keys.cwa = c[1]; if (k && !/YOUR/.test(k[1])) found.keys.kma = k[1]; }
    const aq = mods.airquality || mods.weather; if (aq){ const a = /waqiToken:\s*"([^"]+)"/.exec(dec(aq)); if (a) found.keys.waqi = a[1]; }
    if (mods.tracker) try{ found.ttp = await extractTTP(dec(mods.tracker)); }catch(e){ found.ttpErr = e.message; } }catch(e){}
  if (!found.rows && !found.offices.length && !found.dci && !found.ttp) throw new Error("no site list, offices or contacts found — is this a PULSE dashboard file?");
  return found; }
export function applyPulse(found, pick){ const done = [];
  if (pick.rows && found.rows){ const { sites, report } = rowsToSites(found.rows); let all = sites; LAST_REPORT = Object.assign({ source: found.file, at: Date.now() }, report); save("siteReport", LAST_REPORT);
    if (pick.offices && found.offices.length){ all = all.concat(found.offices.map(o => ({ code: o.s, name: o.s.replace(/\s*\([^)]*\)\s*$/, ""), city: (/\(([^)]*)\)\s*$/.exec(o.s) || [])[1] || "", country: o.c, region: "", cls: "OFFICE", status: "OPERATIONAL", lat: o.lat, lon: o.lon }))); done.push(found.offices.length + " offices"); }
    setSites(all.concat(manualSites().filter(m => !all.some(x => x.code === m.code))), { source: found.file, at: Date.now(), demo: false }); done.unshift(sites.length + " sites"); }
  if (pick.dci && found.dci){ setContacts({ sites: found.dci, offices: found.officeAddr || {}, at: Date.now(), file: found.file }); done.push(Object.keys(found.dci).length + " site contact records"); }
  if (pick.watch && found.watch){ Object.assign(CFG.psoc, { desk: found.watch.desk || "", mobile: found.watch.mobile || "", email: found.watch.email || "" }); done.push("PSOC desk contacts"); }
  if (pick.ttp && found.ttp){ const n = setTTP(found.ttp, found.file); let moved = 0; EVENTS.forEach(ev => { if (applyCadence(ev, "REN TTP imported")) moved++; }); if (moved) saveEvents();
    done.push(`${ttpName()} (${n} categories${moved ? `; cadence applied to ${moved} open escalation${moved === 1 ? "" : "s"}` : ""})`); }
  ["cwa", "kma", "waqi"].forEach(k => { if (pick["key_" + k] && found.keys[k]){ CFG.keys[k] = found.keys[k]; done.push(k.toUpperCase() + " key"); } });
  saveCfg(); audit("Imported from PULSE file", found.file, done.join(", ")); return done; }
