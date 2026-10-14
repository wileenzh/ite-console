// Disasters (GDACS, NASA EONET), tropical cyclones (JMA official forecast + GDACS), volcanoes (Smithsonian + EONET).
import { getJSON, viaRelay, xmlDoc, tx, km, load, save, inAPAC, asArr, sgt } from "../core.js";
import { CFG } from "../config.js";
import { sitesNear, watchSites, nearestSite } from "../model.js";
import { register } from "./index.js";

/* ---------- GDACS floods, fires, droughts (cyclones and volcanoes have their own sources) ---------- */
const GD_T = { FL: ["Flood", "flood", "FLOOD"], WF: ["Wildfire", "wildfires", "FIRE"], DR: ["Drought", "water_supply_quality", "WEATHER"], VO: ["Volcano", "volcanic_hazard", "VOLCANIC"], TC: ["Tropical cyclone", "weather", "TYPHOON"] };
register({ id: "gdacs", name: "GDACS", provider: "UN / European Commission JRC", what: "Floods, wildfires and droughts in Asia-Pacific with humanitarian impact levels", group: "Disasters", every: 15 * 60e3,
  async run(){ const from = new Date(Date.now() - 10 * 86400e3).toISOString().slice(0, 10), j = await getJSON(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=FL;WF;DR&fromDate=${from}&alertlevel=Green;Orange;Red`);
    return (j.features || []).filter(f => f.geometry && f.geometry.type === "Point" && String(f.properties.iscurrent) !== "false").map(f => { const p = f.properties, [lon, lat] = f.geometry.coordinates, t = GD_T[p.eventtype] || ["Event", "weather", "WEATHER"];
      if (!inAPAC(lat, lon)) return null; const lvl = { Red: 3, Orange: 2, Green: 1 }[p.alertlevel] || 1, sites = sitesNear(lat, lon, CFG.ranges.gdacsKm);
      return { id: "gdacs:" + p.eventtype + p.eventid, src: "gdacs", kind: "disaster", rule: "gdacs", cat: t[1], title: `${p.alertlevel || "Green"} ${t[0].toLowerCase()} alert — ${p.country || p.name || ""}`, tier: sites.length ? lvl : Math.max(0, lvl - 1),
        lat, lon, t: Date.parse(p.todate || p.fromdate) || Date.now(), url: (p.url && p.url.report) || "https://www.gdacs.org/", text: [(p.severitydata || {}).severitytext, p.description].filter(Boolean).join(". "), sites: sites.map(x => ({ code: x.code, km: x.km })), extra: { hazard: t[2], level: p.alertlevel } }; }).filter(Boolean); } });
const EO_CAT = { wildfires: ["wildfires", "FIRE"], severeStorms: ["weather", "WIND"], floods: ["flood", "FLOOD"], landslides: ["soil_ground_stability", "LANDSLIDE"], dustHaze: ["air_quality", "AIR"], tempExtremes: ["extreme_heat", "HEAT"], seaLakeIce: ["weather", "COLD"], snow: ["weather", "SNOW"], drought: ["water_supply_quality", "WEATHER"] };
register({ id: "eonet", name: "NASA EONET", provider: "NASA Earth Observatory", what: "Open natural events: wildfires, severe storms, floods, landslides, dust and haze", group: "Disasters", every: 15 * 60e3,
  async run(){ const j = await getJSON("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=10");
    return (j.events || []).map(e => { const g = e.geometry && e.geometry[e.geometry.length - 1], cat = (e.categories && e.categories[0]) || {}; if (!g || cat.id === "volcanoes") return null;
      let lon, lat; if (g.type === "Point") [lon, lat] = g.coordinates; else if (g.coordinates && g.coordinates[0] && g.coordinates[0][0]) [lon, lat] = g.coordinates[0][0]; else return null; if (!inAPAC(lat, lon)) return null;
      const sites = sitesNear(lat, lon, CFG.ranges.eonetKm), m = EO_CAT[cat.id] || ["weather", "WEATHER"], close = sites.filter(x => x.km <= 25);
      return { id: "eonet:" + e.id, src: "eonet", kind: "disaster", rule: "gdacs", cat: m[0], title: `${cat.title || "Event"}: ${e.title}`, tier: close.length && cat.id === "wildfires" ? 2 : sites.length ? 1 : 0, lat, lon, t: Date.parse(g.date),
        url: (e.sources && e.sources[0] && e.sources[0].url) || e.link, text: sites.length ? `${sites.length} site(s) within ${CFG.ranges.eonetKm} km; nearest ${sites[0].code} at ${Math.round(sites[0].km)} km.` : "", sites: sites.map(x => ({ code: x.code, km: x.km })), extra: { hazard: m[1] } }; }).filter(Boolean); } });

/* ---------- tropical cyclones: GDACS (every basin, track and cone) + JMA (RSMC Tokyo official forecast) ---------- */
const kts = kmh => kmh == null ? null : kmh / 1.852;
export const tcClass = kt => kt == null ? ["?", "Unknown"] : kt < 34 ? ["TD", "Tropical depression"] : kt < 48 ? ["TS", "Tropical storm"] : kt < 64 ? ["STS", "Severe tropical storm"] : kt < 85 ? ["TY", "Typhoon"] : kt < 105 ? ["TY", "Very strong typhoon"] : ["TY", "Violent typhoon"];
const COURSE = { "北": "N", "北北東": "NNE", "北東": "NE", "東北東": "ENE", "東": "E", "東南東": "ESE", "南東": "SE", "南南東": "SSE", "南": "S", "南南西": "SSW", "南西": "SW", "西南西": "WSW", "西": "W", "西北西": "WNW", "北西": "NW", "北北西": "NNW" };
const norm = n => String(n || "").toLowerCase().replace(/-\d\d$/, "").replace(/^(tropical (storm|depression|cyclone)|severe tropical storm|super typhoon|typhoon)\s+/, "").replace(/[^a-z]/g, "");
function jmaPart(p){ const n = v => { const x = parseFloat(v); return isFinite(x) ? x : null; }, mx = a => { let m = 0; asArr(a).forEach(x => { const v = x && x.range && n(x.range.km); if (v > m) m = v; }); return m || null; }, pos = p.position && p.position.deg;
  return { h: p.advancedHours || 0, lat: pos ? n(pos[0]) : null, lon: pos ? n(pos[1]) : null, kt: p.maximumWind && p.maximumWind.sustained ? n(p.maximumWind.sustained.kt) : null, gust: p.maximumWind && p.maximumWind.gust ? n(p.maximumWind.gust.kt) : null,
    hpa: n(p.pressure), probKm: p.probabilityCircleRadius ? n(p.probabilityCircleRadius.km) : null, stormKm: mx(p.stormWarning), galeKm: mx(p.galeWarning), course: COURSE[p.course] || null, speed: p.speed ? n(p.speed["km/h"]) : null, time: p.validtime && p.validtime.UTC ? Date.parse(p.validtime.UTC) : null }; }
async function jmaStorms(){ const J = "https://www.jma.go.jp/bosai/typhoon/data/", list = asArr(await getJSON(J + "targetTc.json")).filter(t => t && t.tropicalCyclone);
  return (await Promise.all(list.map(async t => { try{ let title = null, now = null; const fc = [];
      asArr(await getJSON(J + t.tropicalCyclone + "/specifications.json")).forEach(p => { if (p.part === "title") title = p; else if (p.position && p.position.deg){ const q = jmaPart(p); if (q.lat == null) return; if (q.h === 0) now = q; else fc.push(q); } });
      return title && now ? { id: t.tropicalCyclone, number: title.typhoonNumber, name: (title.name && title.name.en) || t.tropicalCyclone, issue: title.issue && title.issue.UTC ? Date.parse(title.issue.UTC) : null, now, fc: fc.sort((a, b) => a.h - b.h) } : null; }catch(e){ return null; } }))).filter(Boolean); }
async function gdacsStorms(){ const from = new Date(Date.now() - 12 * 86400e3).toISOString().slice(0, 10), j = await getJSON(`https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC&fromDate=${from}&alertlevel=Green;Orange;Red`);
  const list = (j.features || []).map(f => { const p = f.properties || {}, c = (f.geometry || {}).coordinates || []; return { eventid: p.eventid, episodeid: p.episodeid, name: String(p.eventname || p.name || "").replace(/-\d\d$/, ""), level: p.alertlevel || "Green", lat: c[1], lon: c[0], current: String(p.iscurrent) !== "false", report: (p.url && p.url.report) || "https://www.gdacs.org/", kmh: (p.severitydata || {}).severity }; })
    .filter(e => e.current && isFinite(e.lat) && inAPAC(e.lat, e.lon));
  await Promise.all(list.map(async e => { try{ const gj = await getJSON(`https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=TC&eventid=${e.eventid}${e.episodeid ? "&episodeid=" + e.episodeid : ""}`); e.track = parseTrack(gj); }catch(err){ e.track = null; } }));
  return list; }
function parseTrack(gj){ const out = { obs: [], fc: [], cone: [] }; (gj.features || []).forEach(f => { const g = f.geometry || {}, p = f.properties || {}, cls = String(p.Class || p.class || p.polygonlabel || "").toLowerCase();
    if (g.type === "Point"){ const [lon, lat] = g.coordinates, isF = /^(false|0|no)$/i.test(String(p.actual).trim()) || /forecast/.test(cls), t = Date.parse(String(p.trackdate || p.todate || "").replace(" ", "T")) || null, kmh = parseFloat(p.windspeed || p.wind_speed);
      (isF ? out.fc : out.obs).push({ lat, lon, t, kt: isFinite(kmh) ? kts(kmh) : null }); }
    else if (/polygon/i.test(g.type) && (/cone|uncert/.test(cls) || /cone/.test(JSON.stringify(p).toLowerCase()))) out.cone.push(g); });
  out.obs.sort((a, b) => (a.t || 0) - (b.t || 0)); out.fc.sort((a, b) => (a.t || 0) - (b.t || 0)); return out; }
// exposure along the forecast, interpolated hourly: DIRECT inside the storm-force (50 kt) circle, POSSIBLE inside that plus the 70 % circle, WATCH within the watch range
export function exposure(storm){ const pts = [storm.now].concat(storm.fc || []), tl = [];
  for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[i + 1]; if (!b){ tl.push({ t: a.time, lat: a.lat, lon: a.lon, R: a.stormKm || 0, P: a.probKm || 0 }); break; }
    const ta = a.time || Date.now(), tb = b.time || ta + ((b.h || 0) - (a.h || 0)) * 3600e3, n = Math.max(1, Math.round((tb - ta) / 3600e3));
    for (let k = 0; k < n; k++){ const f = k / n, L = (x, y) => (x || 0) + ((y || 0) - (x || 0)) * f; tl.push({ t: ta + (tb - ta) * f, lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, R: L(a.stormKm, b.stormKm), P: L(a.probKm, b.probKm) }); } }
  const out = []; watchSites().forEach(s => { let best = 1e9, at = null, direct = null, poss = null, until = null;
    tl.forEach(q => { const d = km(s.lat, s.lon, q.lat, q.lon); if (d < best){ best = d; at = q.t; } if (q.R > 0 && d <= q.R){ if (direct == null) direct = q.t; until = q.t; } if ((q.R + q.P) > 0 && d <= q.R + q.P && poss == null) poss = q.t; });
    const level = direct != null ? "direct" : poss != null ? "possible" : best <= CFG.ranges.cycloneWatchKm ? "watch" : null;
    if (level) out.push({ code: s.code, km: best, level, at: direct ?? poss ?? at, closestAt: at, until: direct != null ? until : null, open: direct != null && until === tl[tl.length - 1].t }); });
  const r = { direct: 0, possible: 1, watch: 2 }; return out.sort((a, b) => r[a.level] - r[b.level] || a.km - b.km); }
register({ id: "cyclones", name: "Tropical cyclones", provider: "JMA (RSMC Tokyo) official forecasts and GDACS (all basins)", what: "Position, intensity, forecast track, storm-force and 70 % probability circles; every site graded direct, possible or watch", group: "Disasters", every: 10 * 60e3,
  async run(){ const [jr, gr] = await Promise.allSettled([jmaStorms(), gdacsStorms()]); if (jr.status === "rejected" && gr.status === "rejected") throw new Error("JMA: " + jr.reason.message + "; GDACS: " + gr.reason.message);
    const jma = jr.status === "fulfilled" ? jr.value : [], gd = gr.status === "fulfilled" ? gr.value : [], used = new Set(), storms = [];
    jma.forEach(s => { const g = gd.find(x => norm(x.name) && norm(x.name) === norm(s.name)); if (g) used.add(g.eventid); storms.push(Object.assign(s, { src: "JMA", gdacs: g || null })); });
    gd.filter(g => !used.has(g.eventid)).forEach(g => { const last = g.track && g.track.obs.length ? g.track.obs[g.track.obs.length - 1] : { lat: g.lat, lon: g.lon, kt: kts(g.kmh), t: Date.now() };
      storms.push({ id: "gdacs" + g.eventid, name: g.name || "Tropical cyclone", src: "GDACS", gdacs: g, now: { lat: last.lat, lon: last.lon, kt: last.kt ?? kts(g.kmh), time: last.t, stormKm: 0, probKm: 0 }, fc: (g.track ? g.track.fc : []).map(p => ({ lat: p.lat, lon: p.lon, kt: p.kt, time: p.t, stormKm: 0, probKm: 0 })) }); });
    return storms.map(s => { const ex = exposure(s), worst = ex[0] ? ex[0].level : null, c = tcClass(s.now.kt), first = ex.filter(x => x.level !== "watch").map(x => x.at).filter(Boolean).sort((a, b) => a - b)[0];
      return { id: "tc:" + norm(s.name || s.id), src: "cyclones", kind: "cyclone", rule: "cyclone", cat: "weather", title: `${c[1]} ${s.name}${worst === "direct" ? ` — storm-force winds forecast at ${ex.filter(x => x.level === "direct").length} site(s)` : worst === "possible" ? " — sites inside the 70 % circle" : worst === "watch" ? " — sites within watch range" : ""}`,
        tier: worst === "direct" ? 3 : worst === "possible" ? 2 : worst === "watch" ? 1 : 0, lat: s.now.lat, lon: s.now.lon, t: s.issue || s.now.time || Date.now(), url: s.src === "JMA" ? "https://www.jma.go.jp/bosai/map.html#contents=typhoon&lang=en" : s.gdacs.report,
        text: `${s.now.kt != null ? Math.round(s.now.kt) + " kt (" + Math.round(s.now.kt * 1.852) + " km/h)" : "wind unknown"}${s.now.hpa ? ", " + s.now.hpa + " hPa" : ""}${s.now.course ? ", moving " + s.now.course + (s.now.speed ? " at " + s.now.speed + " km/h" : "") : ""}${s.now.stormKm ? `, storm-force winds up to ${s.now.stormKm} km` : ""}. Source: ${s.src === "JMA" ? "JMA official forecast" + (s.gdacs ? " with GDACS " + s.gdacs.level + " alert" : "") : "GDACS (JTWC/NOAA advisories)"}.${first ? " Damaging winds first reach a site around " + sgt(first) + " SGT." : ""}`,
        sites: ex.map(x => ({ code: x.code, km: x.km, level: x.level, at: x.at, closestAt: x.closestAt, until: x.until, open: x.open })), citySites: false, extra: { storm: s, cone: s.gdacs && s.gdacs.track ? s.gdacs.track.cone : [], obs: s.gdacs && s.gdacs.track ? s.gdacs.track.obs : [] } }; }); } });

/* ---------- volcanoes: Smithsonian / USGS weekly report merged with NASA EONET open events ---------- */
const vnorm = s => String(s || "").toLowerCase().replace(/\s*volcano\b/g, "").replace(/[^a-z0-9]+/g, "");
register({ id: "volcano", name: "Volcanoes", provider: "Smithsonian GVP / USGS weekly report and NASA EONET", what: "Erupting volcanoes, new activity this week, and sites within 100 km and 250 km", group: "Disasters", every: 30 * 60e3, key: "No (relay)",
  async run(){ const by = {}, list = [], errs = [], key = x => x.vn ? "vn" + x.vn : "n" + vnorm(x.name);
    try{ const d = xmlDoc(await viaRelay("https://volcano.si.edu/news/WeeklyVolcanoRSS.xml"));
      [...d.getElementsByTagName("item")].forEach(it => { const title = tx(it, "title"), m = /^(.*?)\s*\(([^)]*)\)\s*-\s*Report for\s*(.*?)\s+-\s+(.*)$/.exec(title), pt = (tx(it, "point") || "").trim().split(/[\s,]+/).map(Number); if (!(pt.length >= 2 && isFinite(pt[0]))) return;
        let summary = "", sources = ""; try{ const h = new DOMParser().parseFromString(tx(it, "description"), "text/html"); [...h.querySelectorAll("p")].map(p => p.textContent.trim()).filter(Boolean).forEach(t => { if (/^Sources?:/i.test(t)) sources = t.replace(/^Sources?:\s*/i, ""); else summary += (summary ? " " : "") + t; }); }catch(e){}
        const g = /vn_(\d+)/.exec(tx(it, "guid")), v = { name: m ? m[1] : title, country: m ? m[2] : "", period: m ? m[3] : "", fresh: !!(m && /new/i.test(m[4])), lat: pt[0], lon: pt[1], summary, sources, vn: g ? g[1] : "" }; by[key(v)] = v; list.push(v); }); }
    catch(e){ errs.push("Smithsonian: " + e.message); }
    try{ const j = await getJSON("https://eonet.gsfc.nasa.gov/api/v3/events?category=volcanoes&status=open&limit=200");
      (j.events || []).forEach(ev => { const g = (ev.geometry || []).slice(-1)[0] || {}, c = g.coordinates || [], src = (ev.sources || []).find(s => /vn=\d+/.test(s.url || "")), m = /^(.*?)(?:\s+Volcano)?,\s*(.+)$/.exec(ev.title || "");
        const x = { name: m ? m[1] : ev.title, country: m ? m[2] : "", lat: c[1], lon: c[0], vn: src ? /vn=(\d+)/.exec(src.url)[1] : "" }; if (typeof x.lat !== "number") return; if (by[key(x)] || by["n" + vnorm(x.name)]) return; by[key(x)] = x; list.push(Object.assign(x, { listed: true })); }); }
    catch(e){ errs.push("EONET: " + e.message); }
    if (errs.length === 2) throw new Error(errs.join("; "));
    return list.filter(v => inAPAC(v.lat, v.lon)).map(v => { const near = sitesNear(v.lat, v.lon, CFG.ranges.volcanoNearKm), close = near.filter(x => x.km <= CFG.ranges.volcanoCloseKm);
      const tier = close.length ? (v.fresh ? 3 : 2) : near.length ? 1 : 0;
      return { id: "vol:" + (v.vn || vnorm(v.name)), src: "volcano", kind: "volcano", rule: "volcano", cat: "volcanic_hazard", title: `${v.name} volcano (${v.country}) — ${v.fresh ? "new activity this week" : v.listed ? "listed as open by NASA" : "continuing eruption"}`,
        tier, lat: v.lat, lon: v.lon, t: Date.now(), url: v.vn ? "https://volcano.si.edu/volcano.cfm?vn=" + v.vn : "https://volcano.si.edu/reports_weekly.cfm", text: (v.summary || "").slice(0, 900) + (v.sources ? ` Sources: ${v.sources}.` : ""),
        sites: near.map(x => ({ code: x.code, km: x.km })), citySites: false, extra: { hazard: "VOLCANIC", rings: [CFG.ranges.volcanoCloseKm, CFG.ranges.volcanoNearKm], period: v.period } }; }); } });
