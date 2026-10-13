// The one data model. Every source produces SIGNALS; rules turn the ones that touch our sites into
// INBOX items; a decision on an Inbox item can open an EVENT (an escalation with timers);
// events and the live picture feed REPORTS. Everything a person does is written to the AUDIT trail.
import { load, save, km, nid, hash, emit, inAPAC, sgt } from "./core.js";
import { CFG } from "./config.js";
import CITIES_JSON from "./data/cities.json";
import DEMO_SITES from "./data/demo-sites.json";
import DEMO_CONTACTS from "./data/demo-contacts.json";
import SOP from "./data/sop.json";
import { cadenceFor, ttpName } from "./ttp.js";

export const CITIES = CITIES_JSON;
export const SOP_REF = SOP;
export const REGIONS = ["North Asia", "South Asia", "India", "ANZ"];
export const TIER = [{ label: "Normal", cls: "t0" }, { label: "Monitor", cls: "t1" }, { label: "Manager trigger", cls: "t2" }, { label: "Escalate", cls: "t3" }];
export const PRI = { P1: { sla: 5, tier: 3 }, P2: { sla: 15, tier: 2 }, P3: { sla: 60, tier: 1 }, P4: { sla: 240, tier: 0 } };
export const tierToPri = t => t >= 3 ? "P1" : t === 2 ? "P2" : t === 1 ? "P3" : "P4";

/* ---------- people ---------- */
export const STATE = { me: load("me", null), feeds: {}, signals: {}, list: [], city: { wx: {}, air: {}, cams: {}, river: {} }, scores: {} };
export function signIn(name){ STATE.me = { name: String(name).trim(), at: Date.now() }; save("me", STATE.me); audit("Signed in", STATE.me.name); }
export function signOut(){ audit("Signed out", STATE.me ? STATE.me.name : ""); STATE.me = null; save("me", null); }
export const who = () => STATE.me ? STATE.me.name : "unknown";

/* ---------- audit trail ---------- */
let AUDIT = load("audit", []);
export function audit(action, what, detail){ AUDIT.unshift({ t: Date.now(), by: who(), action, what: what || "", detail: detail || "" }); AUDIT = AUDIT.slice(0, 5000); save("audit", AUDIT); }
export const auditLog = () => AUDIT;

/* ---------- sites ---------- */
export const LIVE = ["OPERATIONAL", "DEPLOYMENT", "SECURITY LOCK DOWN"];
// The estate is fictional by design: PULSE-style codes and classes at made-up positions in each metro, plus any
// sites an officer adds by hand. Real site lists and contacts are never loaded into this console.
export let SITES = DEMO_SITES.map(s => Object.assign({}, s)).concat(load("manualSites", []));
export let SITES_META = { source: "the fictional estate", at: null, demo: true };
export const CONTACTS = DEMO_CONTACTS;
export const isLive = s => LIVE.includes(s.status);
export const isOffice = s => s.cls === "OFFICE";
export const isBuild = s => s.status === "CONSTRUCTION";
const CITY_ALIAS = { Bangalore: "Bengaluru", Delhi: "New Delhi", Saigon: "Ho Chi Minh City", Gurgaon: "New Delhi", Gurugram: "New Delhi", Noida: "New Delhi" };
export function metroOf(s){ const c = CITY_ALIAS[s.city] || (s.city || "").trim(); if (CITIES.some(m => m.name === c)) return c;
  if (!isFinite(s.lat)) return null; let best = null; CITIES.forEach(m => { const d = km(m.lat, m.lon, s.lat, s.lon); if (d < 120 && (!best || d < best.d)) best = { n: m.name, d }; }); return best ? best.n : null; }
export function setSites(list){ SITES = list; rebuildMetros(); emit("sites"); }
export const contactFor = s => (CONTACTS.sites || {})[s.code] || null;
export let METRO = {};
export function rebuildMetros(){ METRO = {}; CITIES.forEach(c => { METRO[c.name] = []; }); SITES.forEach(s => { s.metro = metroOf(s); if (s.metro) METRO[s.metro].push(s); }); }
rebuildMetros();
export const watchSites = () => SITES.filter(s => isFinite(s.lat) && (isLive(s) || isOffice(s) || (CFG.quake.scope === "livebuild" && isBuild(s))));
export function sitesNear(lat, lon, r, filter){ if (!isFinite(lat)) return []; return watchSites().filter(s => !filter || filter(s)).map(s => ({ code: s.code, km: km(lat, lon, s.lat, s.lon), s })).filter(x => x.km <= r).sort((a, b) => a.km - b.km); }
export function nearestSite(lat, lon){ let b = null; watchSites().forEach(s => { const d = km(lat, lon, s.lat, s.lon); if (!b || d < b.km) b = { code: s.code, km: d, s }; }); return b; }
export const siteBy = code => SITES.find(s => s.code === code);
export const siteCountries = () => [...new Set(SITES.map(s => s.country).filter(Boolean))].sort();

/* ---------- signals: what every source reports, in one shape ----------
   { id, src, kind, title, tier 0-3, lat, lon, geo?, area, cc, t, end?, url, text,
     cities: [names], sites: [{code, km}], rule: which SOP trigger it belongs to, extra } */
export const KINDS = {
  quake: { label: "Earthquakes", cat: "earthquake" }, warning: { label: "Official warnings", cat: "weather" }, cyclone: { label: "Cyclones", cat: "weather" },
  volcano: { label: "Volcanoes", cat: "volcanic_hazard" }, disaster: { label: "Floods, fires & storms", cat: "flood" }, unrest: { label: "Unrest", cat: "protest" },
  news: { label: "News", cat: "operational_security" }, travel: { label: "Travel advisories", cat: "interstate_conflict" }, conditions: { label: "City conditions", cat: "weather" },
};
const HAZ_CAT = { TSUNAMI: "coastal_flooding", TYPHOON: "weather", STORM_SURGE: "coastal_flooding", FLOOD: "flood", RAIN: "flood", THUNDERSTORM: "weather", HEAT: "extreme_heat", COLD: "weather", WIND: "weather",
  LANDSLIDE: "soil_ground_stability", FIRE: "wildfires", VOLCANIC: "volcanic_hazard", EARTHQUAKE: "earthquake", SNOW: "weather", FOG: "transportation_hazard", WAVE: "coastal_flooding", AIR: "air_quality", WEATHER: "weather" };
export const catFor = sig => (sig.cat) || (sig.extra && sig.extra.hazard && HAZ_CAT[sig.extra.hazard]) || (KINDS[sig.kind] || {}).cat || "weather";

export function setSignals(src, list){ STATE.signals[src] = list.map(enrich); recompute(); }
function enrich(s){ s.cities = s.cities || []; s.sites = s.sites || [];
  if (isFinite(s.lat) && !s.near) s.near = nearestSite(s.lat, s.lon);
  if (!s.cities.length && s.sites.length) s.cities = [...new Set(s.sites.map(x => (siteBy(x.code) || {}).metro).filter(Boolean))];
  if (!s.sites.length && s.cities.length && s.citySites !== false) s.sites = s.cities.flatMap(c => (METRO[c] || []).filter(isLive).map(x => ({ code: x.code, km: 0 })));
  s.key = s.key || s.src + ":" + s.id; return s; }
export const allSignals = () => STATE.list;
export const signalBy = key => STATE.list.find(s => s.key === key);

/* ---------- city conditions: weather now, next 48 h, air, river ---------- */
const WMO = { 0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  80: "Showers", 81: "Heavy showers", 82: "Violent showers", 95: "Thunderstorm", 96: "Thunderstorm, hail", 99: "Thunderstorm, hail" };
export const wmo = c => WMO[c] || "—";
export function airFor(city){ const w = STATE.city.air[city], c = STATE.city.cams[city]; if (w && w.aqi != null) return Object.assign({ fmax: c && c.fmax }, w); if (c && c.aqi != null) return Object.assign({ model: true }, c); return null; }
export function conditions(city){ const out = {}, W = CFG.wx, F = CFG.fc, A = CFG.aqi, w = STATE.city.wx[city], a = airFor(city), r = STATE.city.river[city];
  if (w && w.current){ const u = w.current, wt = u.wind_speed_10m >= W.windBad ? 2 : u.wind_speed_10m >= W.windWarn ? 1 : 0, rt = u.precipitation >= W.rainBad ? 2 : u.precipitation >= W.rainWarn ? 1 : 0;
    const ht = (u.temperature_2m >= W.hotBad || u.temperature_2m <= W.coldBad) ? 2 : (u.temperature_2m >= W.hotWarn || u.temperature_2m <= W.coldWarn) ? 1 : 0, tier = Math.max(wt, rt, ht);
    out.weather = { tier, value: Math.round(u.temperature_2m) + "°", text: tier ? (wt === tier ? `wind ${Math.round(u.wind_speed_10m)} km/h` : rt === tier ? `rain ${u.precipitation.toFixed(1)} mm/h` : `temperature ${Math.round(u.temperature_2m)}°C`) : wmo(u.weather_code), model: w.model, raw: u }; }
  if (w && w.daily){ const d = w.daily, n = Math.min(2, d.time.length), g = Math.max(0, ...d.wind_gusts_10m_max.slice(0, n).map(x => x || 0)), p = Math.max(0, ...d.precipitation_sum.slice(0, n).map(x => x || 0)), tx = Math.max(-99, ...d.temperature_2m_max.slice(0, n).map(x => x == null ? -99 : x));
    const why = []; let tier = 0; if (g >= F.gustBad){ tier = 2; why.push(`gusts ${Math.round(g)} km/h`); } else if (g >= F.gustWarn){ tier = Math.max(tier, 1); why.push(`gusts ${Math.round(g)} km/h`); }
    if (p >= F.rainBad){ tier = 2; why.push(`${Math.round(p)} mm/day`); } else if (p >= F.rainWarn){ tier = Math.max(tier, 1); why.push(`${Math.round(p)} mm/day`); }
    if (d.weather_code.slice(0, n).some(x => x >= 95)){ tier = Math.max(tier, 1); why.push("thunderstorms"); } if (tx >= F.heat){ tier = Math.max(tier, 1); why.push(`${Math.round(tx)}°C`); }
    out.forecast = { tier, value: Math.round(p) + " mm", text: why.length ? why.join(", ") : "nothing notable" }; }
  if (a && a.aqi != null){ const tier = a.aqi >= A.intel ? 3 : a.aqi >= A.manager ? 2 : a.aqi >= A.monitor ? 1 : 0; out.air = { tier: tier || (a.fmax >= A.manager ? 1 : 0), value: "AQI " + a.aqi, text: (a.model ? "CAMS model" : (a.station || "station")) + (a.fmax >= A.manager && !tier ? `, forecast ${a.fmax}` : "") }; }
  if (r && r.ratio){ const tier = r.ratio >= CFG.river.bad ? 2 : r.ratio >= CFG.river.warn ? 1 : 0; out.river = { tier, value: "×" + r.ratio.toFixed(1), text: tier ? "river rising sharply vs 30-day median" : "within recent range" }; }
  return out; }
// A city condition at manager level or above becomes a signal like any other, so it is in the feed and can raise an Inbox item
export function conditionSignals(){ const out = []; CITIES.forEach(c => { const co = conditions(c.name);
  Object.entries(co).forEach(([k, v]) => { if (v.tier < 2) return; const label = { weather: "Severe weather", forecast: "Severe weather in the next 48 h", air: "Air quality", river: "River flow" }[k];
    out.push({ id: `${k}:${c.name}`, src: "conditions", kind: "conditions", rule: "conditions", title: `${c.name}: ${label} — ${v.text}`, tier: v.tier, lat: c.lat, lon: c.lon, cc: c.cc, t: Date.now(), cities: [c.name],
      cat: k === "air" ? "air_quality" : k === "river" ? "flood" : /temperature/.test(v.text) ? "extreme_heat" : "weather", text: `${label}: ${v.value} (${v.text}).`, extra: { cond: k } }); }); });
  return out; }

/* ---------- recompute: merge, score cities, apply the rules ---------- */
export function recompute(){
  STATE.signals.conditions = conditionSignals().map(enrich);
  STATE.list = Object.values(STATE.signals).flat().sort((a, b) => b.tier - a.tier || (b.t || 0) - (a.t || 0));
  STATE.scores = {}; CITIES.forEach(c => { const co = conditions(c.name), parts = Object.assign({}, co);
    const hz = STATE.list.filter(s => s.kind !== "conditions" && s.kind !== "news" && s.kind !== "travel" && s.cities.includes(c.name));
    parts.hazards = { tier: Math.max(0, ...hz.map(s => s.tier)), value: hz.length + "", text: hz.length ? hz[0].title : "none in force", list: hz };
    STATE.scores[c.name] = { tier: Math.max(0, ...Object.values(parts).map(p => p.tier)), parts }; });
  remember(); applyRules(); emit("data");
}

/* ---------- detection history: everything that touched our sites, kept after it ends ---------- */
export let HISTORY = load("history", []);
const HKEEP = 7 * 86400e3;
function remember(){ const now = Date.now(), by = new Map(HISTORY.map(h => [h.key, h])); let changed = false;
  STATE.list.forEach(s => { if (s.kind === "conditions" || (!s.sites.length && !s.cities.length && !s.alarm) || (s.tier < 1 && s.kind !== "quake")) return;
    const h = by.get(s.key); if (h){ h.last = now; if (s.tier > h.tier){ h.tier = s.tier; h.title = s.title; changed = true; } return; }
    const n = { key: s.key, title: s.title, kind: s.kind, src: s.src, tier: s.tier, first: now, t: s.t || now, last: now, sites: s.sites.length, cities: s.cities.slice(0, 4), area: (s.area || "").slice(0, 120), url: s.url || "" };
    HISTORY.unshift(n); by.set(s.key, n); changed = true; });
  if (changed || Math.random() < .05){ HISTORY = HISTORY.filter(h => now - h.last < HKEEP).slice(0, 3000); save("history", HISTORY); } }
export const isLiveKey = key => STATE.list.some(s => s.key === key);

/* ---------- Inbox: what needs a decision ---------- */
export let INBOX = load("inbox", []);
const saveInbox = () => { INBOX = INBOX.filter(i => i.status === "open" || Date.now() - (i.decidedAt || i.createdAt) < 14 * 86400e3).slice(0, 1500); save("inbox", INBOX); };
const RULE_ON = sig => CFG.rules[sig.rule || sig.kind] !== false;
export function applyRules(){ let changed = false; const now = Date.now();
  STATE.list.forEach(sig => {
    if (sig.tier < 2 || !RULE_ON(sig) || sig.noInbox) return;
    if (!sig.sites.length && !sig.cities.length && !sig.alarm) return;          // only what touches our sites (or an alarm)
    const key = "sig:" + sig.key, ex = INBOX.find(i => i.key === key);
    if (ex){ if (ex.status === "open" && sig.tier > ex.tier){ ex.tier = sig.tier; ex.pri = tierToPri(sig.tier); ex.title = sig.title; ex.log.push({ t: now, m: "Raised to " + ex.pri + " by the source" }); changed = true; }
      else if (ex.status === "monitor" && ex.until && now > ex.until){ ex.status = "open"; ex.createdAt = now; ex.log.push({ t: now, m: "Back from monitoring" }); changed = true; }
      return; }
    if (EVENTS.some(e => e.status !== "closed" && (e.signals || []).includes(sig.key))) return;
    INBOX.unshift({ id: "i" + hash(key), key, sigKey: sig.key, kind: sig.kind, title: sig.title, tier: sig.tier, pri: tierToPri(sig.tier), createdAt: now, status: "open", log: [{ t: now, m: "Raised automatically by " + sig.src }] });
    changed = true; emit("inbox:new", INBOX[0]); });
  INBOX.forEach(i => { if (i.status === "monitor" && i.until && now > i.until && !STATE.list.some(s => "sig:" + s.key === i.key)){ i.status = "closed"; i.decision = "expired"; i.decidedAt = now; changed = true; } });
  if (changed) saveInbox(); }
export function addManualItem(o){ const i = { id: nid("i"), key: "man:" + nid(), kind: o.kind || "manual", title: o.title, tier: o.tier || 1, pri: o.pri || "P3", createdAt: Date.now(), status: "open", text: o.text || "", log: [{ t: Date.now(), m: "Added by " + who() }] };
  INBOX.unshift(i); saveInbox(); audit("Added to Inbox", i.title); emit("data"); return i; }
export const openItems = () => INBOX.filter(i => i.status === "open").sort((a, b) => dueAt(a) - dueAt(b));
export const dueAt = i => i.createdAt + PRI[i.pri].sla * 60e3;
export function decide(item, decision, extra = {}){ item.status = decision === "monitor" ? "monitor" : "closed"; item.decision = decision; item.decidedAt = Date.now(); item.by = who();
  if (decision === "monitor") item.until = Date.now() + (extra.hours || 4) * 3600e3; if (extra.reason) item.reason = extra.reason; if (extra.eventId) item.eventId = extra.eventId;
  item.log.push({ t: Date.now(), m: `${({ dismiss: "Dismissed", monitor: "Monitoring for " + (extra.hours || 4) + " h", escalate: "Escalated", notify: "Notified" })[decision] || decision}${extra.reason ? ": " + extra.reason : ""} — ${who()}` });
  saveInbox(); audit("Decision: " + decision, item.title, extra.reason || ""); emit("data"); }
export const decided = since => INBOX.filter(i => i.decidedAt && i.decidedAt > since);

/* ---------- Events: escalations, each with its own timers, sites, notifications and welfare ---------- */
export const REN = { assess: "Under assessment", issued: "Issued", none: "Not required" };
export let EVENTS = load("events", []);
export const saveEvents = () => save("events", EVENTS);
export const IMMEDIATE = new Set(["protest"]);             // civil unrest: updates as it develops, no countdown
export function createEvent(o){ const now = Date.now();
  const ev = { id: nid("ev"), title: o.title || "Untitled event", cat: o.cat || "weather", sev: o.sev || "P3", country: o.country || "", sites: o.sites || [], lat: o.lat ?? null, lon: o.lon ?? null,
    ren: o.ren || "assess", timer: o.startNow || o.ren === "issued" ? "running" : "awaiting", created: now, last12: now, last24: now, status: "active", signals: o.signals || [], from: o.from || null,
    cad: cadenceFor(o.cat || "weather"), checks: {}, welfare: {}, comms: [], log: [{ t: now, by: who(), m: "Escalation opened" + (o.from ? " from the Inbox" : "") + "." }] };
  EVENTS.unshift(ev); saveEvents(); audit("Escalation opened", ev.title, ev.sev); emit("data"); return ev; }
export const cad = ev => ev.cad || { m: 12, i: 24, src: "fixed" };     // hours between Manager updates (m) and Intel / SLT updates (i)
// a category change or a newly imported TTP re-sets the cadence of open events (unless set by hand)
export function applyCadence(ev, why){ if (ev.status === "closed" || (ev.cad && ev.cad.src === "manual")) return false; const c = cadenceFor(ev.cat), o = cad(ev);
  if (o.m === c.m && o.i === c.i && o.src === c.src) return false; ev.cad = c; ev.log.push({ t: Date.now(), by: "system", m: `Update cadence ${c.src === "fixed" ? "set to the standard" : "set from the " + c.src}: Manager every ${c.m} h, Intel / SLT every ${c.i} h${why ? " (" + why + ")" : ""}.` }); return true; }
export function timers(ev, now = Date.now()){
  if (ev.status === "closed") return { state: "closed", rank: 9 };
  if (IMMEDIATE.has(ev.cat)) return { state: "immediate", rank: 3 };
  if (ev.timer === "awaiting") return { state: "awaiting", rank: 2 };
  const c = cad(ev), d12 = ev.last12 + c.m * 3600e3 - now, d24 = ev.last24 + c.i * 3600e3 - now, st = d => d < 0 ? "overdue" : d < Math.min(3600e3, c.m * 3600e3 / 4) ? "duesoon" : "ontrack";
  const s12 = st(d12), s24 = st(d24), state = [s12, s24].includes("overdue") ? "overdue" : [s12, s24].includes("duesoon") ? "duesoon" : "ontrack";
  return { state, rank: { overdue: 0, duesoon: 1, ontrack: 4 }[state], d12, d24, s12, s24 }; }
export const openEvents = () => EVENTS.filter(e => e.status !== "closed").sort((a, b) => timers(a).rank - timers(b).rank || a.sev.localeCompare(b.sev) || a.created - b.created);
export function eventLog(ev, m, kind){ ev.log.push({ t: Date.now(), by: who(), m, kind }); ev.updatedAt = Date.now(); saveEvents(); emit("data"); }
export function setRen(ev, ren){ ev.ren = ren; if (ren === "issued" && ev.timer === "awaiting"){ ev.timer = "running"; ev.last12 = ev.last24 = Date.now(); } eventLog(ev, "Event notice: " + REN[ren].toLowerCase() + (ren === "issued" ? ". Update timers started." : ".")); audit("Event notice " + ren, ev.title); }
export function resetTimer(ev, which, at){ const now = at || Date.now(); if (which !== "24") ev.last12 = now; if (which !== "12") ev.last24 = now; if (ev.timer === "awaiting") ev.timer = "running";
  const c = cad(ev); ev.notified = false; eventLog(ev, (which === "12" ? `PSOC Manager update sent — ${c.m} h timer reset` : which === "24" ? `Intel / SLT update sent — ${c.i} h timer reset` : "Update sent — both timers reset") + (at ? ` (sent at ${sgt(at)} SGT)` : "") + ".", "update"); audit("Escalation update", ev.title, which); }
export function setCheck(ev, key, on, label){ ev.checks = ev.checks || {}; if (on) ev.checks[key] = { at: Date.now(), by: who() }; else delete ev.checks[key]; eventLog(ev, `${on ? "Done" : "Un-ticked"}: ${label}`, "check"); }
export function setWelfare(ev, code, status, note){ ev.welfare[code] = { status, note: note || "", at: Date.now(), by: who() }; eventLog(ev, `Welfare ${code}: ${status}${note ? " — " + note : ""}`, "welfare"); }
export function closeEvent(ev, summary){ ev.status = "closed"; ev.closed = { at: Date.now(), by: who(), summary }; eventLog(ev, "Closed. " + (summary || "")); audit("Escalation closed", ev.title, summary); }
export function reopenEvent(ev){ ev.status = "active"; delete ev.closed; ev.last12 = ev.last24 = Date.now(); eventLog(ev, "Reopened."); audit("Escalation reopened", ev.title); }

/* ---------- Reports: the shift's saved documents ---------- */
export let REPORTS = load("reports", []);
export function saveReport(o){ const r = Object.assign({ id: nid("r"), at: Date.now(), by: who() }, o); REPORTS.unshift(r); REPORTS = REPORTS.slice(0, 500); save("reports", REPORTS); audit("Report saved", r.title, r.type); emit("data"); return r; }
export function deleteReport(id){ REPORTS = REPORTS.filter(r => r.id !== id); save("reports", REPORTS); emit("data"); }

/* ---------- feeds health ---------- */
export function feedResult(id, patch){ const f = STATE.feeds[id] = Object.assign(STATE.feeds[id] || {}, patch);
  if (patch.ok === false) f.failSince = f.failSince || patch.at || Date.now(); else if (patch.ok) f.failSince = null; emit("feeds"); }

/* ---------- first start: the current console's open escalations (its sites are not brought over) ---------- */
export function migrateData(loadRaw){
  if (load("migratedData", false)) return []; const out = [];
  const oldEv = loadRaw("psoc.uni.events.v1", []).filter(e => e.status !== "closed");
  oldEv.forEach(d => { const t = x => (x ? new Date(x).getTime() : Date.now());
    const known = (d.sites || []).filter(c => SITES.some(x => x.code === c));   // only the fictional estate's codes come across
    EVENTS.push({ id: d.id || nid("ev"), title: d.desc || "Imported escalation", cat: SOP[d.cat] ? d.cat : "weather", sev: d.sev || "P3", country: d.country || "", sites: known, lat: d.eventLat ?? null, lon: d.eventLon ?? null,
      ren: ["assess", "issued", "none"].includes(d.ren) ? d.ren : "assess", timer: d.timerMode === "awaiting" ? "awaiting" : "running", created: t(d.created || d.last), last12: t(d.last12 || d.last), last24: t(d.last24 || d.last),
      status: "active", signals: [], welfare: {}, comms: [], log: (d.log || []).map(l => ({ t: t(l.t), by: l.by || "", m: l.m || "" })).concat([{ t: Date.now(), by: "system", m: "Brought over from the current console." }]) }); });
  if (oldEv.length){ saveEvents(); out.push(oldEv.length + " open escalations"); }
  const me = loadRaw("psoc.uni.me.v1", null); if (me && me.name && !STATE.me){ STATE.me = { name: me.name, at: Date.now() }; save("me", STATE.me); }
  save("migratedData", Date.now()); return out; }
export { inAPAC };
