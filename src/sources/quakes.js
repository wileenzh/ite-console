// Earthquakes: USGS every 30 seconds from a background worker (keeps running while minimised), EMSC as a cross-check.
// Tier comes from the shaking estimated at our sites; alarms follow the global and near-site thresholds.
import { getJSON, km, load, save, emit } from "../core.js";
import { CFG } from "../config.js";
import { watchSites, nearestSite, sitesNear, isLive, isOffice } from "../model.js";
import { register } from "./index.js";

export const estimateMMI = (mag, surfaceKm, depthKm) => Math.max(0, Math.min(12, mag - 2.5 * Math.log10(Math.max(Math.sqrt(surfaceKm ** 2 + depthKm ** 2), 1)) + 1.5));
export const roman = v => v >= 11 ? "XI+" : ["I", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"][Math.max(0, Math.floor(v))];
export const mmiWord = v => v < 2 ? "not felt" : v < 4 ? "weak" : v < 5 ? "light" : v < 6 ? "moderate" : v < 7 ? "strong" : v < 8 ? "very strong" : v < 9 ? "severe" : v < 11 ? "violent" : "extreme";
export const magLabel = m => m < 4 ? "Minor" : m < 5 ? "Light" : m < 6 ? "Moderate" : m < 7 ? "Strong" : m < 8 ? "Major" : m < 9 ? "Great" : "Extreme";
const feedUrl = t => "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/" + (t >= 4.5 ? "4.5_day" : t >= 2.5 ? "2.5_day" : t >= 1 ? "1.0_day" : "all_day") + ".geojson";
let EMSC = [];
export let QARCH = load("quakeArchive", []);
export const QSTATE = load("quakeState", {});          // per earthquake: alarmed, leadership / welfare sent, shaking and damage reported
export const saveQ = () => save("quakeState", QSTATE);
const ALARMED = new Set(Object.keys(QSTATE).filter(k => QSTATE[k].alarm));

function toSignal(q){ const Q = CFG.quake; let top = { mmi: 0, s: null, d: Infinity };
  watchSites().filter(s => !isOffice(s) || true).forEach(s => { const d = km(q.lat, q.lon, s.lat, s.lon); if (d > 1500) return; const v = estimateMMI(q.mag, d, q.depth); if (v > top.mmi) top = { mmi: v, s, d }; });
  const near = nearestSite(q.lat, q.lon), within = sitesNear(q.lat, q.lon, Q.nearKm), tsuNear = q.tsunami && near && near.km <= CFG.ranges.tsunamiKm;
  let tier = top.mmi >= 5 ? 3 : top.mmi >= 4 ? 2 : top.mmi >= 3 ? 1 : 0; if (tsuNear) tier = 3;
  const global = q.mag >= Q.globalMag, nearAlarm = q.mag >= Q.nearMag && near && near.km <= Q.nearKm, alarm = global || nearAlarm;
  if (alarm) tier = Math.max(tier, 2);
  const listed = q.mag >= Q.listMag || alarm || top.mmi >= 3; if (!listed) return null;
  return { id: q.id, src: "usgs", kind: "quake", rule: "quake", title: `M${q.mag.toFixed(1)} ${q.place || "earthquake"}`, tier, lat: q.lat, lon: q.lon, t: q.time, url: q.url,
    text: `Depth ${Math.round(q.depth)} km.${q.tsunami ? " Tsunami flag set by USGS." : ""}${q.alert ? " PAGER " + q.alert + "." : ""}${top.s ? ` Highest estimated shaking at our sites: MMI ${roman(top.mmi)} at ${top.s.code} (${Math.round(top.d)} km).` : ""}`,
    sites: within.map(x => ({ code: x.code, km: x.km, mmi: +estimateMMI(q.mag, x.km, q.depth).toFixed(1) })), near, alarm: alarm ? (global ? "global" : "near-site") : null,
    extra: { mag: q.mag, depth: q.depth, place: q.place, tsunami: q.tsunami, alert: q.alert, topMMI: top.mmi, topSite: top.s && top.s.code, topKm: top.d, emsc: q.emsc, detail: q.detail } }; }

register({ id: "usgs", name: "USGS earthquakes", provider: "US Geological Survey", what: "Earthquakes worldwide; estimated shaking (MMI) at every site; ShakeMap", every: 30e3, worker: true, key: "No",
  async run(){ const floor = Math.min(CFG.quake.listMag, CFG.quake.globalMag, CFG.quake.nearMag), j = await getJSON(feedUrl(floor));
    const list = (j.features || []).map(f => ({ id: f.id, mag: f.properties.mag, place: f.properties.place, time: f.properties.time, url: f.properties.url, detail: f.properties.detail, tsunami: f.properties.tsunami === 1, alert: f.properties.alert,
      lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], depth: Math.abs(f.geometry.coordinates[2] || 0) })).filter(q => q.mag != null);
    list.forEach(q => { q.emsc = EMSC.find(e => Math.abs(e.time - q.time) < 180e3 && km(e.lat, e.lon, q.lat, q.lon) < 150) || null; });
    const sigs = list.map(toSignal).filter(Boolean);
    sigs.forEach(s => { if (s.alarm && !ALARMED.has(s.id)){ ALARMED.add(s.id); (QSTATE[s.id] = QSTATE[s.id] || {}).alarm = s.alarm; saveQ(); emit("alarm", s); } });
    archive(sigs); return sigs; } });
register({ id: "emsc", name: "EMSC earthquakes", provider: "European-Mediterranean Seismological Centre", what: "Second source to cross-check USGS in Asia-Pacific", every: 120e3,
  async run(){ const start = new Date(Date.now() - 86400e3).toISOString().slice(0, 19), floor = Math.max(3.5, CFG.quake.listMag);
    const j = await getJSON(`https://www.seismicportal.eu/fdsnws/event/1/query?format=json&minmag=${floor}&start=${start}&minlat=-55&maxlat=60&minlon=55&maxlon=180&limit=400`);
    EMSC = (j.features || []).map(f => ({ mag: f.properties.mag, time: Date.parse(f.properties.time), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] })); }, count: () => EMSC.length });

function archive(sigs){ const cut = Date.now() - 60 * 86400e3, by = new Map(QARCH.map(q => [q.id, q])); let ch = false;
  sigs.forEach(s => { const st = QSTATE[s.id] || {}, rec = { id: s.id, mag: s.extra.mag, place: s.extra.place, t: s.t, lat: s.lat, lon: s.lon, depth: s.extra.depth, url: s.url, near: s.near ? s.near.code : "", nearKm: s.near ? Math.round(s.near.km) : null,
      mmi: +s.extra.topMMI.toFixed(1), alarm: !!s.alarm, leadership: st.leadership || null, welfare: st.welfare || null };
    if (!(s.alarm || s.extra.mag >= 4.5 || s.tier >= 2)) return; const ex = by.get(s.id); if (!ex || JSON.stringify(ex) !== JSON.stringify(rec)){ by.set(s.id, rec); ch = true; } });
  if (ch || QARCH.some(q => q.t < cut)){ QARCH = [...by.values()].filter(q => q.t >= cut).sort((a, b) => b.t - a.t).slice(0, 2000); save("quakeArchive", QARCH); } }

/* ---------- the two messages the SOP asks for after a felt earthquake ---------- */
const expandPlace = p => String(p || "").replace(/\b([NSEW]{1,3})\b(?= of )/g, d => ({ N: "north", NNE: "north-northeast", NE: "northeast", ENE: "east-northeast", E: "east", ESE: "east-southeast", SE: "southeast", SSE: "south-southeast", S: "south", SSW: "south-southwest", SW: "southwest", WSW: "west-southwest", W: "west", WNW: "west-northwest", NW: "northwest", NNW: "north-northwest" })[d] || d);
const headerPlace = p => String(p || "").replace(/^\s*\d+(?:\.\d+)?\s*km\s+[NSEW]{1,3}\s+of\s+/i, "").replace(/^\s*(?:near the coast of|off the coast of|offshore(?: of)?|near)\s+/i, "").trim() || p;
const joinOx = a => a.length < 2 ? (a[0] || "") : a.length === 2 ? a.join(" and ") : a.slice(0, -1).join(", ") + ", and " + a[a.length - 1];
export function leadershipUpdate(sig, compassWord, bearing){ const e = sig.extra, n = sig.near, hhmm = new Date(sig.t).toISOString().slice(11, 16).replace(":", "");
  const paras = [`At ${hhmm} hours (UTC), PSOC has identified a magnitude ${e.mag.toFixed(1)} earthquake approximately ${expandPlace(e.place)}, at a depth of ${Math.round(e.depth)} km.`,
    `${e.tsunami ? "A tsunami warning has been issued." : "No tsunami warning has been issued."} ${e.alert ? `The PAGER alert level was assessed as ${e.alert[0].toUpperCase() + e.alert.slice(1)} by the U.S. Geological Survey (USGS).` : "No PAGER alert level has been published by the U.S. Geological Survey (USGS) at this time."}`,
    n ? `The closest company site, located in ${n.s.city || n.s.code}, is approximately ${Math.round(n.km)} km ${compassWord(bearing(sig.lat, sig.lon, n.s.lat, n.s.lon))} of the epicenter. At this time, no impacts to company personnel, assets, or operations have been identified.` : "",
    `Event: M${e.mag.toFixed(1)} Earthquake - ${expandPlace(e.place)} (${sig.url})`, "Monitoring is ongoing."].filter(Boolean);
  return `${headerPlace(e.place)} | Earthquake | M${e.mag.toFixed(1)}\n\n` + paras.join("\n\n"); }
export function welfareUpdate(sig){ const st = QSTATE[sig.id] || {}, all = sig.sites.slice(0, 20).map(x => x.code), shake = st.shaking || [], dmg = st.damage || [];
  let mid; if (!shake.length && !dmg.length) mid = "All sites confirmed normal operations and personnel safety, with no impacts to company personnel, assets, or operations identified.";
  else if (shake.length && !dmg.length) mid = `While light shaking was reported at ${joinOx(shake)}, all sites confirmed normal operations and personnel safety, with no impacts to company personnel, assets, or operations identified.`;
  else mid = `${shake.length ? `Light shaking was reported at ${joinOx(shake)}. ` : ""}Infrastructural damage was noted at ${joinOx(dmg)} and is pending assessment; personnel safety has been confirmed${dmg.length === all.length ? " at all sites" : " and remaining sites confirmed normal operations"}.`;
  return ["Following updates from welfare checks on site:", `Welfare checks have been completed with personnel at ${joinOx(all) || "the nearest sites"}. ${mid}`, "Monitoring is ongoing."].join("\n\n"); }
