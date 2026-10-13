// Loading the real estate: a site workbook or CSV (the PULSE / DCI CSV format works as is), or a PULSE file
// (site list, offices, site contacts, PSOC desk contacts, optionally its keys). Everything stays in this browser.
import { loadScript } from "./core.js";
import { SITES, setSites, setContacts, audit } from "./model.js";
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
  return { sites: out, report: r }; }
export async function readWorkbook(file){ await loadScript(XLSX_URL); const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" }); let best = null;
  wb.SheetNames.forEach(n => { const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: "" }), hits = rows.length ? Object.keys(rows[0]).filter(k => Object.values(COLS).some(v => v.includes(nk(k)))).length : 0; if (!best || hits > best.hits) best = { rows, hits, sheet: n }; });
  if (!best || !best.rows.length) throw new Error("no rows found"); return best; }
export function applySites(sites, source, keepOffices){ const offices = keepOffices ? SITES.filter(s => s.cls === "OFFICE" && !sites.some(x => x.code === s.code)) : [];
  setSites(sites.concat(offices), { source, at: Date.now(), demo: false }); audit("Sites loaded", source, sites.length + " sites"); }

// a PULSE dashboard file: everything is read in this browser and only what you tick is kept
export async function readPulseFile(file){ const txt = await file.text(), found = { file: file.name };
  const grab = name => { const m = new RegExp("const " + name + " = (\\{[\\s\\S]*?\\}|\\[[\\s\\S]*?\\]);\\n").exec(txt); if (!m) return null; try{ return JSON.parse(m[1]); }catch(e){ return null; } };
  const csvTag = /id="psoc-sitesync-csv">\s*([\s\S]*?)<\/script>/.exec(txt);
  if (csvTag){ await loadScript(XLSX_URL); const wb = window.XLSX.read(csvTag[1].trim(), { type: "string" }); found.rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }); }
  found.offices = (grab("PSOC_SITES") || []).filter(x => x.k === "OFFICE"); found.dci = grab("PSOC_DCI"); found.officeAddr = grab("PSOC_OFFICES"); found.watch = grab("PSOC_WATCH"); found.keys = {};
  try{ const dec = b => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))), mods = {}; txt.replace(/^\s*([a-z]+): "([A-Za-z0-9+/=]{1000,})"/gm, (m, k, b) => { mods[k] = b; return m; });
    if (mods.watch){ const w = dec(mods.watch), c = /CWA_KEY\s*=\s*'([^']+)'/.exec(w), k = /KMA_KEY\s*=\s*'([^']+)'/.exec(w); if (c && !/YOUR/.test(c[1])) found.keys.cwa = c[1]; if (k && !/YOUR/.test(k[1])) found.keys.kma = k[1]; }
    const aq = mods.airquality || mods.weather; if (aq){ const a = /waqiToken:\s*"([^"]+)"/.exec(dec(aq)); if (a) found.keys.waqi = a[1]; } }catch(e){}
  if (!found.rows && !found.offices.length && !found.dci) throw new Error("no site list, offices or contacts found — is this a PULSE dashboard file?");
  return found; }
export function applyPulse(found, pick){ const done = [];
  if (pick.rows && found.rows){ const { sites } = rowsToSites(found.rows); let all = sites;
    if (pick.offices && found.offices.length){ all = all.concat(found.offices.map(o => ({ code: o.s, name: o.s.replace(/\s*\([^)]*\)\s*$/, ""), city: (/\(([^)]*)\)\s*$/.exec(o.s) || [])[1] || "", country: o.c, region: "", cls: "OFFICE", status: "OPERATIONAL", lat: o.lat, lon: o.lon }))); done.push(found.offices.length + " offices"); }
    setSites(all, { source: found.file, at: Date.now(), demo: false }); done.unshift(sites.length + " sites"); }
  if (pick.dci && found.dci){ setContacts({ sites: found.dci, offices: found.officeAddr || {}, at: Date.now(), file: found.file }); done.push(Object.keys(found.dci).length + " site contact records"); }
  if (pick.watch && found.watch){ Object.assign(CFG.psoc, { desk: found.watch.desk || "", mobile: found.watch.mobile || "", email: found.watch.email || "" }); done.push("PSOC desk contacts"); }
  ["cwa", "kma", "waqi"].forEach(k => { if (pick["key_" + k] && found.keys[k]){ CFG.keys[k] = found.keys[k]; done.push(k.toUpperCase() + " key"); } });
  saveCfg(); audit("Imported from PULSE file", found.file, done.join(", ")); return done; }
