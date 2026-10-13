// Small shared helpers: DOM, escaping, time, geography, storage, fetching.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const safeUrl = u => /^https?:\/\//i.test(String(u || "")) ? String(u) : "#";
export const trunc = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
export const nid = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- time: the console runs on Singapore time ---------- */
const TZ = "Asia/Singapore";
const fDT = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const fT = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const fClock = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const fDay = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const fUtc = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });
export const sgt = t => t ? fDT.format(t) : "—";
export const sgtTime = t => t ? fT.format(t) : "—";
export const clock = t => fClock.format(t);
export const dayLabel = t => fDay.format(t);
export const utcHHMM = t => fUtc.format(t).replace(":", "");
export function ago(t){ if (!t) return ""; const m = (Date.now() - t) / 60e3; if (m < 1) return "just now"; if (m < 60) return Math.round(m) + " min ago"; if (m < 2880) return Math.round(m / 60) + " h ago"; return Math.round(m / 1440) + " d ago"; }
export function dur(ms){ const neg = ms < 0, a = Math.abs(ms), h = Math.floor(a / 3600e3), m = Math.floor(a % 3600e3 / 60e3); return (neg ? "-" : "") + (h ? h + " h " : "") + m + " min"; }
export function toSgtInput(t){ const d = new Date(t + 8 * 3600e3); return d.toISOString().slice(0, 16); }
export function fromSgtInput(v){ const n = Date.parse(v + ":00Z"); return isFinite(n) ? n - 8 * 3600e3 : NaN; }

/* ---------- geography ---------- */
export function km(a, b, c, d){ const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r; const h = Math.sin(x / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(h))); }
export function bearing(lat1, lon1, lat2, lon2){ const p = Math.PI / 180, y = Math.sin((lon2 - lon1) * p) * Math.cos(lat2 * p), x = Math.cos(lat1 * p) * Math.sin(lat2 * p) - Math.sin(lat1 * p) * Math.cos(lat2 * p) * Math.cos((lon2 - lon1) * p); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
const C16 = ["north", "north-northeast", "northeast", "east-northeast", "east", "east-southeast", "southeast", "south-southeast", "south", "south-southwest", "southwest", "west-southwest", "west", "west-northwest", "northwest", "north-northwest"];
export const compass = deg => C16[Math.round(deg / 22.5) % 16];
export const inAPAC = (lat, lon) => lat > -55 && lat < 60 && (lon > 55 || lon < -160);
export function pointInRing(lat, lon, ring){ let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++){ const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-12) + xi) ins = !ins; } return ins; }
export function inGeo(lat, lon, g){ if (!g) return false; const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []; return polys.some(p => p[0] && pointInRing(lat, lon, p[0]) && !p.slice(1).some(h => pointInRing(lat, lon, h))); }

/* ---------- storage: every key is namespaced; reads never throw ---------- */
const NS = "ite2.";
export function load(k, d){ try{ const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }
export function save(k, v){ try{ localStorage.setItem(NS + k, JSON.stringify(v)); return true; }catch(e){ return false; } }
export function loadRaw(fullKey, d){ try{ const v = localStorage.getItem(fullKey); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }

/* ---------- a tiny event bus: modules announce changes, the shell re-renders ---------- */
const subs = {};
export function on(ev, fn){ (subs[ev] = subs[ev] || []).push(fn); }
export function emit(ev, data){ (subs[ev] || []).forEach(fn => { try{ fn(data); }catch(e){ console.error(ev, e); } }); }

/* ---------- fetching ---------- */
export async function fetchText(url, opts = {}, ms = 20000){
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try{ const r = await fetch(url, Object.assign({ cache: "no-store", signal: ctl.signal }, opts)); return { ok: r.ok, status: r.status, text: await r.text() }; }
  finally{ clearTimeout(t); }
}
export async function getJSON(url, ms){ const r = await fetchText(url, {}, ms); if (!r.ok) throw new Error("HTTP " + r.status); try{ return JSON.parse(r.text); }catch(e){ throw new Error("response is not JSON"); } }
// Direct first; if the agency blocks browsers, through the relay set in Settings (PSOC server or relay.js)
let RELAY = "";
export const setRelay = u => { RELAY = String(u || "").replace(/\/$/, ""); };
export async function viaRelay(url, opts, ms){
  try{ const r = await fetchText(url, opts, ms || 20000); if (r.ok) return r.text; throw new Error("HTTP " + r.status); }
  catch(e){
    const blocked = e.name === "TypeError" || /Failed to fetch|NetworkError|Load failed/i.test(e.message || "");
    if (!RELAY) throw new Error(blocked ? "blocked by the browser — set a relay or the PSOC server in Settings" : (e.name === "AbortError" ? "timed out" : e.message));
    const r = await fetchText(RELAY + "/?url=" + encodeURIComponent(url), opts, (ms || 20000) + 5000);
    if (!r.ok) throw new Error("relay HTTP " + r.status); return r.text;
  }
}
export const relayJSON = async (url, ms) => JSON.parse(await viaRelay(url, null, ms));
export const xmlDoc = t => { const d = new DOMParser().parseFromString(t, "application/xml"); if (d.getElementsByTagName("parsererror").length) throw new Error("unreadable XML"); return d; };
export const tx = (el, tag) => { if (!el) return ""; const n = (el.getElementsByTagNameNS ? el.getElementsByTagNameNS("*", tag)[0] : null) || el.getElementsByTagName(tag)[0]; return n ? n.textContent.trim() : ""; };
export const txAll = (el, tag) => Array.from(el.getElementsByTagName(tag)).map(n => n.textContent.trim());
export const stripHtml = s => String(s || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
export const asArr = v => Array.isArray(v) ? v : v == null ? [] : [v];

/* ---------- clipboard and files ---------- */
export async function copyText(text, html){
  try{ if (html && window.ClipboardItem){ await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]); return true; } }catch(e){}
  try{ await navigator.clipboard.writeText(text); return true; }catch(e){}
  const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); let ok = false; try{ ok = document.execCommand("copy"); }catch(e){} ta.remove(); return ok;
}
export function download(name, text, type = "text/plain"){ const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
export const csv = rows => rows.map(r => r.map(v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(",")).join("\n");
export function loadScript(src){ return new Promise((ok, bad) => { if ([...document.scripts].some(s => s.src === src)) return ok(); const x = document.createElement("script"); x.src = src; x.onload = ok; x.onerror = () => bad(new Error("could not load " + src)); document.head.appendChild(x); }); }
