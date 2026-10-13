// WATCH — everything the sources report, on one map and in one feed. Hazard type is a filter, not a tab.
import { $, esc, sgt, ago, safeUrl, copyText, trunc } from "../core.js";
import { STATE, KINDS, CITIES, REGIONS, INBOX, METRO, HISTORY, isLiveKey, siteBy, airFor, signalBy, addManualItem, wmo, who, audit } from "../model.js";
import { briefFor } from "./brief.js";
import { mountTV } from "./tv.js";
import { summaryHtml } from "./summary.js";
import { emit, load, save } from "../core.js";
import { MODEL_NAME, outlook, outlookCached } from "../sources/conditions.js";
import { CFG } from "../config.js";
import { roman, magLabel, mmiWord, QSTATE, saveQ } from "../sources/quakes.js";
import { tcClass } from "../sources/hazards.js";
import { SOURCES } from "../sources/index.js";
import { UI, saveUI, go } from "./state.js";
import { tierWord, when, toast, dialog } from "./kit.js";
import { escalateForm, notifyComposer } from "./forms.js";

const touches = s => s.sites.length || s.cities.length || s.alarm;
const srcName = id => (SOURCES.find(s => s.id === id) || {}).name || id;
const srcLine = s => { const k = KINDS[s.kind].label, n = srcName(s.src); return n.toLowerCase().includes(k.toLowerCase().replace(/e?s$/, "")) ? n : k + " · " + n; };
const nearKm = s => s.sites.length ? Math.min(...s.sites.map(x => x.km || 0)) : s.near ? s.near.km : 1e9;
const strength = s => s.kind === "quake" ? (s.extra.topMMI || 0) * 10 + s.extra.mag : s.tier * 10;
const SORTS = { tier: ["Most serious first", null], new: ["Newest first", (a, b) => (b.t || 0) - (a.t || 0)], near: ["Nearest to a site first", (a, b) => nearKm(a) - nearKm(b)], strong: ["Strongest shaking at a site first", (a, b) => strength(b) - strength(a)] };
export function visible(){ const q = UI.q.trim().toLowerCase(), sort = (SORTS[UI.watchSort] || SORTS.tier)[1];
  const out = STATE.list.filter(s => (UI.watchAll || touches(s)) && (!UI.watchKinds.length || UI.watchKinds.includes(s.kind)) && (!q || (s.title + " " + (s.area || "") + " " + s.cities.join(" ")).toLowerCase().includes(q)));
  return sort ? out.slice().sort(sort) : out; }
export function count(){ const h = Date.now() - 3600e3; return STATE.list.filter(s => touches(s) && s.tier >= 1 && (s.t || 0) > h).length; }

export function render(p){ draw(p); mountTV(p.querySelector("#tvbox")); }
function draw(p){ const sel = UI.watchSel && signalBy(UI.watchSel);
  if (UI.watchCity) return p.innerHTML = cityDetail(UI.watchCity);
  if (sel) return p.innerHTML = detail(sel);
  const base = STATE.list.filter(s => UI.watchAll || touches(s)), kinds = Object.keys(KINDS).filter(k => base.some(s => s.kind === k)), list = visible();
  const mode = MODES[UI.watchMode] ? UI.watchMode : "feed";
  p.innerHTML = `<div class="ph"><h1>Watch</h1><div class="seg" role="group" aria-label="View">${Object.entries(MODES).map(([k, l]) => `<button data-wmode="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div>
      <div class="sum">${mode === "cities" ? `Conditions in ${CITIES.length} cities: weather now, next 48 hours, air, river, and hazards in force.` : mode === "history" ? `Everything that touched our sites in the last 7 days, kept after it ends so a missed alert isn't a lost one.` : mode === "tv" || mode === "summary" ? "" : `${list.length} ${UI.watchAll ? "reports" : "reports touching our sites"} from ${Object.values(STATE.feeds).filter(f => f.ok).length} working sources. Anything that needs a decision is already in the Inbox.`}</div></div>
    ${mode === "cities" ? citiesHtml() : mode === "history" ? historyHtml() : mode === "tv" ? tvHtml() : mode === "summary" ? summaryHtml() : `<div class="filters">${kinds.map(k => `<button class="fchip" data-wkind="${k}" aria-pressed="${UI.watchKinds.includes(k)}">${esc(KINDS[k].label)}<b>${base.filter(s => s.kind === k).length}</b></button>`).join("")}</div>
    <div class="filters"><input class="search" type="search" placeholder="Search the feed" value="${esc(UI.q)}" data-wq><select class="search" data-wsort aria-label="Sort" style="width:auto">${Object.entries(SORTS).map(([k, [l]]) => `<option value="${k}"${(UI.watchSort || "tier") === k ? " selected" : ""}>${l}</option>`).join("")}</select><label class="chk" style="font-size:12.5px;color:var(--muted)"><input type="checkbox" data-wall${UI.watchAll ? " checked" : ""}> Include reports that don't touch our sites</label></div>
    <div class="scroll">${list.slice(0, 300).map(rowHtml).join("") || `<div class="empty"><b>Nothing is touching our sites right now.</b>${STATE.list.length ? `${STATE.list.length} reports elsewhere — tick “Include reports that don't touch our sites” to see them.` : "Sources are loading."}</div>`}${allClear()}</div>`}`; }
// agencies that answered and have nothing in force: a missed warning and a quiet agency look the same unless said
function allClear(){ if (UI.watchKinds.length && !UI.watchKinds.includes("warning")) return ""; const quiet = SOURCES.filter(x => x.group === "Official warnings" && (STATE.feeds[x.id] || {}).ok && !STATE.list.some(sg => sg.src === x.id));
  return quiet.length ? `<p class="help" style="padding:10px 16px">Checked and clear: ${quiet.map(x => esc(x.name)).join(", ")}.</p>` : ""; }
const MODES = { feed: "Feed", summary: "Summary", cities: "Cities", history: "History", tv: "Live TV" };
const NOTES = load("notes", {});    // officers' notes on any report, by report key
const CSORT = { region: "By region", tier: "Most serious first", hot: "Hottest first", rain: "Most rain first", air: "Worst air first" };
function historyHtml(){ const q = UI.q.trim().toLowerCase(), list = HISTORY.filter(h => (!UI.watchKinds.length || UI.watchKinds.includes(h.kind)) && (!q || (h.title + " " + h.area + " " + h.cities.join(" ")).toLowerCase().includes(q)));
  return `<div class="filters"><input class="search" type="search" placeholder="Search the history" value="${esc(UI.q)}" data-wq></div>
    <div class="scroll">${list.slice(0, 400).map(h => { const live = isLiveKey(h.key);
      return `<button class="row" data-whist="${esc(h.key)}"><span class="bar t${h.tier}"></span><span><span class="tt">${esc(h.title)}</span>
        <div class="mt">${esc((KINDS[h.kind] || { label: h.kind }).label)} · first seen ${esc(sgt(h.first))} SGT${h.cities.length ? " · " + esc(h.cities.join(", ")) : h.area ? " · " + esc(trunc(h.area, 40)) : ""}</div></span>
        <span class="rt">${live ? "<b>in force</b>" : `ended ${esc(ago(h.last))}`}${h.sites ? `${h.sites} site${h.sites === 1 ? "" : "s"}` : ""}</span></button>`; }).join("") || `<div class="empty"><b>Nothing recorded yet.</b>Reports that touch our sites are kept here for 7 days.</div>`}</div>`; }
function rowHtml(s){ const item = INBOX.find(i => i.key === "sig:" + s.key);
  return `<button class="row" data-wsel="${esc(s.key)}" aria-selected="${UI.watchSel === s.key}"><span class="bar t${s.tier}"></span><span><span class="tt">${esc(s.title)}</span>
    <div class="mt">${esc(srcLine(s))}${s.cities.length ? " · " + esc(s.cities.slice(0, 3).join(", ")) : s.area ? " · " + esc(trunc(s.area, 40)) : ""} · ${when(s.t)}</div></span>
    <span class="rt">${s.sites.length ? `<b>${s.sites.length} site${s.sites.length === 1 ? "" : "s"}</b>` : ""}${item ? (item.status === "open" ? "in Inbox" : item.decision) : ""}</span></button>`; }

function detail(s){ const e = s.extra || {}, item = INBOX.find(i => i.key === "sig:" + s.key), facts = [["Level", tierWord(s.tier)], ["Source", `${esc(srcName(s.src))}${e.agency ? " — " + esc(e.agency) : ""}`], ["Reported", `${esc(sgt(s.t))} SGT (${esc(ago(s.t))})`]];
  if (s.end) facts.push(["Until", esc(sgt(s.end)) + " SGT"]); if (s.area) facts.push(["Area", esc(s.area)]); if (s.cities.length) facts.push(["Cities", esc(s.cities.join(", "))]);
  if (s.kind === "quake"){ facts.push(["Magnitude", `M${e.mag.toFixed(1)} (${magLabel(e.mag)}), depth ${Math.round(e.depth)} km`]); if (e.topSite) facts.push(["Strongest at a site", `MMI ${roman(e.topMMI)} (${mmiWord(e.topMMI)}) at ${esc(e.topSite)}, ${Math.round(e.topKm)} km — estimated`]);
    facts.push(["Tsunami", e.tsunami ? "<b>flag set by USGS</b>" : "no flag"]); if (e.alert) facts.push(["PAGER", esc(e.alert)]); if (e.emsc) facts.push(["EMSC", `M${e.emsc.mag.toFixed(1)}`]); if (s.alarm) facts.push(["Alarm", s.alarm === "global" ? "global magnitude threshold" : "near-site threshold"]); }
  if (s.kind === "cyclone"){ const st = e.storm, c = tcClass(st.now.kt); facts.push(["Class", `${c[1]}${st.number ? " (No. " + esc(st.number) + ")" : ""}`]); if (st.now.hpa) facts.push(["Pressure", st.now.hpa + " hPa"]); }
  const siteRows = s.sites.slice(0, 60).map(x => { const st = siteBy(x.code) || {}; return `<tr${x.level === "direct" || (x.mmi >= 4) ? ` class="hot"` : ""}><td><button class="linkbtn" data-site="${esc(x.code)}">${esc(x.code)}</button></td><td>${esc(st.city || "")}</td><td>${x.km ? Math.round(x.km) + " km" : "in area"}</td><td>${x.mmi ? "MMI " + roman(x.mmi) : x.level ? esc(x.level) + (x.at ? " from " + esc(sgt(x.at)) : "") : ""}</td></tr>`; }).join("");
  const qs = s.kind === "quake" ? (QSTATE[s.id] || {}) : null;
  return `<div class="detail"><button class="back" data-wback>Back to the feed</button><h2>${esc(s.title)}</h2>
    <dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>
    ${s.text ? `<p class="prose">${esc(s.text)}</p>` : ""}${e.instruction ? `<p class="prose"><b>Agency advice:</b> ${esc(e.instruction)}</p>` : ""}
    <div class="actions">${item && item.status === "open" ? `<button class="btn primary" data-goinbox="${esc(item.id)}">Decide in the Inbox</button>` : `<button class="btn primary" data-wesc>Escalate</button>`}
      <button class="btn" data-wnotify>Notify</button><button class="btn" data-wbrief>Copy brief</button>${!item ? `<button class="btn" data-wadd>Add to Inbox</button>` : ""}${s.url ? `<a class="btn" style="text-decoration:none" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">Open the source</a>` : ""}</div>
    ${item && item.status !== "open" ? `<p class="help">Inbox: ${esc(item.decision)} by ${esc(item.by || "")} ${esc(ago(item.decidedAt))}${item.reason ? " — " + esc(item.reason) : ""}.</p>` : ""}
    ${qs ? `<div class="sec"><h3>Welfare at sites</h3><p class="help">Tick sites where personnel felt shaking or reported damage; the welfare update wording follows.</p>
      <table class="tbl"><tr><th>Site</th><th>Shaking felt</th><th>Damage</th></tr>${s.sites.slice(0, 20).map(x => `<tr><td>${esc(x.code)}</td><td><input type="checkbox" data-qshake="${esc(x.code)}"${(qs.shaking || []).includes(x.code) ? " checked" : ""}></td><td><input type="checkbox" data-qdmg="${esc(x.code)}"${(qs.damage || []).includes(x.code) ? " checked" : ""}></td></tr>`).join("")}</table></div>` : ""}
    ${/^gdelt/.test(s.src) ? `<p class="help">News coverage found by GDELT, classified from the headline: not an official or verified report. Open the article and corroborate before acting. Article counts reflect news volume, not crowd size.</p>` : s.src === "acled" ? `<p class="help">ACLED researched event, published weekly; it describes what happened, not what is planned.</p>` : ""}
    ${s.kind === "cyclone" ? stormTiming(s) : ""}
    <div class="sec"><h3>Notes</h3>${(NOTES[s.key] || []).map(n => `<p class="prose"><span class="help">${esc(sgt(n.t))} · ${esc(n.by)}</span><br>${esc(n.m)}</p>`).join("")}<form class="note" data-wnote><input placeholder="Add a note to this report" aria-label="Add a note"><button class="btn small">Add</button></form></div>
    <div class="sec"><h3>Sites ${s.sites.length ? `(${s.sites.length})` : ""}</h3>${s.kind === "cyclone" && s.sites.length ? `<p class="help">Timing for each site is above.</p>` : siteRows ? `<table class="tbl"><tr><th>Site</th><th>City</th><th>Distance</th><th></th></tr>${siteRows}</table>` : `<p class="help">No tracked site in range.${s.near ? ` Nearest: ${esc(s.near.code)}, ${Math.round(s.near.km)} km.` : ""}</p>`}</div></div>`; }

// per site: when damaging winds arrive and leave, and when the centre is closest (hourly along the forecast track)
const RISK = { direct: ["In the path", 3], possible: ["May be affected", 2], watch: ["Worth watching", 1] };
function stormTiming(s){ const t = x => x ? esc(sgt(x)) : "—", rows = s.sites.slice(0, 60);
  if (!rows.length) return ""; const first = rows.filter(x => x.level !== "watch" && x.at).sort((a, b) => a.at - b.at)[0];
  const pts = [s.extra.storm.now].concat(s.extra.storm.fc || []), last = Math.max(0, ...pts.map(p => p.h || 0)), h = Math.min(UI.tcHour || 0, last);
  const play = last ? `<div class="tcplay"><label for="tcR" class="help">Forecast position: <b id="tcL">${h ? "+" + h + " h, " + esc(sgt(Date.now() + h * 3600e3)) + " SGT" : "now"}</b></label><input type="range" id="tcR" min="0" max="${last}" step="1" value="${h}" data-tcr></div>` : "";
  return `<div class="sec"><h3>What to expect at our sites</h3>${play}${first ? `<p class="prose">Damaging winds first reach <b>${esc(first.code)}</b> around <b>${t(first.at)} SGT</b>. Times follow the official forecast track hour by hour and move as each new advisory is issued.</p>` : `<p class="help">No site is forecast inside the damaging-wind area; sites listed are within watch range.</p>`}
    <table class="tbl"><tr><th>Site</th><th>Risk</th><th>Damaging winds (SGT)</th><th>Closest</th><th>Closest at (SGT)</th></tr>${rows.map(x => { const st = siteBy(x.code) || {}, r = RISK[x.level] || [x.level, 0];
      return `<tr${x.level === "direct" ? ` class="hot"` : ""}><td><button class="linkbtn" data-site="${esc(x.code)}">${esc(x.code)}</button><div class="help">${esc(st.city || "")}</div></td><td><span class="tierword t${r[1]}">${esc(r[0])}</span></td><td>${x.level === "watch" ? "—" : t(x.at) + (x.open ? " to the end of the forecast" : x.until && x.until !== x.at ? " to " + t(x.until) : "")}</td><td>${Math.round(x.km)} km</td><td>${t(x.closestAt)}</td></tr>`; }).join("")}</table></div>`; }
function cityOrder(){ const k = UI.citySort || "region", sc = n => STATE.scores[n] || { tier: 0, parts: {} }, w = n => STATE.city.wx[n] || {}, a = n => airFor(n) || {};
  const f = { tier: (x, y) => sc(y.name).tier - sc(x.name).tier, hot: (x, y) => ((w(y.name).current || {}).temperature_2m ?? -99) - ((w(x.name).current || {}).temperature_2m ?? -99),
    rain: (x, y) => ((w(y.name).daily || {}).precipitation_sum || [0])[0] - ((w(x.name).daily || {}).precipitation_sum || [0])[0], air: (x, y) => (a(y.name).aqi ?? -1) - (a(x.name).aqi ?? -1) }[k];
  return f ? CITIES.slice().sort(f) : null; }
function citiesHtml(){ const cell = (p, cls) => p ? `<span class="c t${p.tier} ${cls}" title="${esc(p.text)}">${esc(p.value)}</span>` : `<span class="c ${cls}">—</span>`;
  return `<div class="filters"><select class="search" data-csort aria-label="Order" style="width:auto">${Object.entries(CSORT).map(([k, l]) => `<option value="${k}"${(UI.citySort || "region") === k ? " selected" : ""}>${l}</option>`).join("")}</select></div><div class="scroll"><div class="cityhead"><span></span><span>City</span><span>Weather</span><span>Next 48 h</span><span>Air</span><span class="x4">River</span><span class="x5">Hazards</span></div>
    ${(cityOrder() ? [[null, cityOrder()]] : REGIONS.map(r => [r, CITIES.filter(c => c.region === r)])).map(([r, list]) => `${r ? `<div class="region">${esc(r)}</div>` : ""}${list.map(c => { const sc = STATE.scores[c.name] || { tier: 0, parts: {} }, P = sc.parts;
      return `<button class="city" data-wcity="${esc(c.name)}"><span class="bar t${sc.tier}"></span><span class="n">${esc(c.name)}</span>${cell(P.weather, "")}${cell(P.forecast, "")}${cell(P.air, "")}${cell(P.river, "x4")}${P.hazards && P.hazards.list.length ? `<span class="c t${P.hazards.tier} x5">${P.hazards.list.length} in force</span>` : `<span class="c x5">none</span>`}</button>`; }).join("")}`).join("")}</div>`; }
const SEASON = { dust: { cities: ["Tokyo", "Osaka", "Seoul", "Busan"], months: [2, 3, 4], text: "Spring Asian dust (kosa / hwangsa), March to May, often mixed with PM2.5 from across the region. It is PM10-led, so read PM10 alongside the AQI." },
  smoke: { cities: ["Sydney", "Melbourne", "Canberra", "Perth", "Auckland"], months: [11, 0, 1], text: "Bushfire smoke and inland dust, December to February." } };
const localTime = tz => { try{ return new Date().toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }) + " " + (new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date()).find(x => x.type === "timeZoneName") || {}).value; }catch(e){ return ""; } };
function cityDetail(name){ const c = CITIES.find(x => x.name === name), sc = STATE.scores[name] || { tier: 0, parts: {} }, P = sc.parts, w = STATE.city.wx[name], a = airFor(name), sigs = STATE.list.filter(s => s.cities.includes(name) && s.kind !== "conditions");
  const row = (l, p, extra) => `<tr><td>${esc(l)}</td><td>${p ? tierWord(p.tier) : "—"}</td><td>${p ? esc(p.value) : "no data"}</td><td>${p ? esc(p.text) : ""}${extra || ""}</td></tr>`;
  const sites = METRO[name] || [], byCls = sites.reduce((o, x) => (o[x.cls] = (o[x.cls] || 0) + 1, o), {}), m = new Date().getMonth();
  const seas = Object.values(SEASON).filter(x => x.cities.includes(name)).map(x => `<p class="help">${x.months.includes(m) ? "<b>In season now:</b> " : "Seasonal: "}${esc(x.text)}</p>`).join("");
  const airX = a ? `${a.model ? " · modelled, no station at this point" : ` · station ${a.url ? `<a href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener">${esc(a.station || "WAQI")}</a>` : esc(a.station || "")}`}${a.pm25 != null ? ` · PM2.5 ${Math.round(a.pm25)} µg/m³` : ""}${a.pm10 != null ? ` · PM10 ${Math.round(a.pm10)} µg/m³` : ""}${a.fmax != null ? ` · forecast peak AQI ${a.fmax}` : ""}` : "";
  return `<div class="detail"><button class="back" data-wcityback>Back to cities</button><h2>${esc(name)}</h2><p class="help">${tierWord(sc.tier)} · ${esc(c ? c.region : "")}${c && c.tz ? ` · local time ${esc(localTime(c.tz))}` : ""}</p>
    <table class="tbl"><tr><th>Condition</th><th>Level</th><th>Now</th><th>Why</th></tr>${row("Weather now", P.weather, w ? ` · model ${esc(MODEL_NAME[w.model] || w.model)}` : "")}${row("Next 48 hours", P.forecast)}${row("Air quality", P.air, airX)}${row("River flow", P.river)}</table>
    ${seas}<p class="help">Model readings are for triage. Warnings and heat-stress indices come from the national agency, which is the figure of record for an event notice.</p>
    <div class="sec"><h3>Next 7 days${outlookCached(name) ? "" : `<span class="r"><button class="linkbtn" data-woutlook="${esc(name)}">Show</button></span>`}</h3><div id="outlook">${outlookCached(name) ? outlookHtml(outlookCached(name)) : ""}</div></div>
    <div class="sec"><h3>Hazards in force (${sigs.length})</h3>${sigs.map(rowHtml).join("") || `<p class="help">None.</p>`}</div>
    <div class="sec"><h3>Sites in ${esc(name)} (${sites.length})</h3>${Object.keys(byCls).length ? `<p class="help">${Object.entries(byCls).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${esc(k.replace("CLASS ", "Class "))} ${v}`).join(" · ")}</p>` : ""}<p class="help">${sites.map(x => `<button class="linkbtn" data-site="${esc(x.code)}">${esc(x.code)}</button>`).join(", ") || "None."}</p></div></div>`; }
function outlookHtml(d){ const D0 = d.daily || {}, D = new Proxy(D0, { get: (o, k) => o[k] || [] }), F = CFG.fc, W = CFG.wx, t = (v, warn, bad) => v >= bad ? 3 : v >= warn ? 2 : 0, r = v => v == null ? "—" : Math.round(v);
  return `<table class="tbl"><tr><th>Day</th><th>Weather</th><th>High / low</th><th>Rain</th><th>Chance</th><th>Gusts</th></tr>${D.time.map((day, i) => { const hi = D.temperature_2m_max[i], rain = D.precipitation_sum[i], g = D.wind_gusts_10m_max[i];
    return `<tr><td>${esc(new Date(day + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }))}</td><td>${D.weather_code[i] != null ? esc(wmo(D.weather_code[i])) : "—"}</td><td><span class="tierword t${t(hi, W.hotWarn, W.hotBad)}">${r(hi)}°</span> / ${r(D.temperature_2m_min[i])}°</td><td><span class="tierword t${t(rain, F.rainWarn, F.rainBad)}">${rain != null ? rain.toFixed(1) : "—"} mm</span></td><td>${D.precipitation_probability_max[i] ?? "—"} %</td><td><span class="tierword t${t(g, F.gustWarn, F.gustBad)}">${g != null ? Math.round(g) : "—"} km/h</span></td></tr>`; }).join("")}</table>
    <p class="help">Open-Meteo, ${d.auto ? "best available model" : "national model"}. Coloured by the same thresholds as the city board.</p>`; }

export function mapSpec(){ const s = UI.watchSel && signalBy(UI.watchSel);
  if (UI.watchMode === "cities" && !s){ const c = UI.watchCity && CITIES.find(x => x.name === UI.watchCity);
    return { points: CITIES.map(x => ({ lat: x.lat, lon: x.lon, tier: (STATE.scores[x.name] || {}).tier || 0, label: x.name, on: c === x, go: () => go("watch", { watchCity: x.name }) })),
      signals: c ? STATE.list.filter(x => x.cities.includes(c.name) && x.kind !== "news") : [], hitSites: c ? (METRO[c.name] || []).map(x => x.code) : [], fitKey: c ? "c:" + c.name : "" }; }
  const list = visible(), rings = [];
  if (s && s.kind === "cyclone" && UI.tcHour){ const st = s.extra.storm, pts = [st.now].concat(st.fc || []), h = UI.tcHour, i = pts.findIndex(p => (p.h || 0) >= h), b = pts[Math.max(0, i)], a = pts[Math.max(0, i - 1)] || b, f = b.h === a.h ? 0 : (h - (a.h || 0)) / ((b.h || 0) - (a.h || 0));
    if (i >= 0){ const L = (x, y) => (x || 0) + ((y || 0) - (x || 0)) * f; rings.push({ lat: L(a.lat, b.lat), lon: L(a.lon, b.lon), km: L(a.stormKm, b.stormKm) || 30, label: `Forecast +${h} h: damaging winds` }); } }
  return { signals: list.slice(0, 400), selected: UI.watchSel, hitSites: s ? s.sites.map(x => x.code) : [], fitKey: s ? "w:" + s.key : "", tracks: true, rings }; }

export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-wsel],[data-wback],[data-wkind],[data-wmode],[data-wesc],[data-wnotify],[data-wadd],[data-goinbox],[data-wcity],[data-wcityback],[data-site],[data-wbrief],[data-whist],[data-tv],[data-woutlook],[data-wkindgo]"); if (!t) return; const d = t.dataset;
    if (d.wsel){ UI.watchSel = d.wsel; UI.watchCity = null; saveUI(); rerender(); p.scrollTop = 0; return; }
    if (d.wback !== undefined){ UI.watchSel = null; saveUI(); rerender(); return; }
    if (d.wkind){ const k = d.wkind; UI.watchKinds = UI.watchKinds.includes(k) ? UI.watchKinds.filter(x => x !== k) : UI.watchKinds.concat(k); saveUI(); rerender(); return; }
    if (d.wmode){ UI.watchMode = d.wmode; UI.watchSel = null; UI.watchCity = null; saveUI(); rerender(); return; }
    if (d.wcity){ UI.watchCity = d.wcity; saveUI(); rerender(); return; } if (d.wcityback !== undefined){ UI.watchCity = null; saveUI(); rerender(); return; }
    if (d.goinbox){ go("inbox", { inboxSel: d.goinbox }); return; } if (d.site){ go("sites", { siteSel: d.site }); return; }
    if (d.wkindgo){ UI.watchMode = "feed"; UI.watchKinds = [d.wkindgo]; UI.watchSel = null; saveUI(); rerender(); return; }
    if (d.woutlook){ const c = CITIES.find(x => x.name === d.woutlook), box = p.querySelector("#outlook"); t.textContent = "Loading…";
      try{ const o = await outlook(c); if (box) box.innerHTML = outlookHtml(o); t.remove(); }catch(err){ if (box) box.innerHTML = `<p class="help">The outlook could not load (${esc(err.message)}).</p>`; t.textContent = "Try again"; } return; }
    if (d.whist){ if (isLiveKey(d.whist)){ UI.watchSel = d.whist; UI.watchMode = "feed"; saveUI(); rerender(); return; } const h = HISTORY.find(x => x.key === d.whist); if (!h) return;
      dialog(h.title, `<dl class="facts"><dt>Type</dt><dd>${esc((KINDS[h.kind] || { label: h.kind }).label)}</dd><dt>Source</dt><dd>${esc(srcName(h.src))}</dd><dt>Highest level</dt><dd>${tierWord(h.tier)}</dd><dt>First seen</dt><dd>${esc(sgt(h.first))} SGT</dd><dt>Last seen</dt><dd>${esc(sgt(h.last))} SGT</dd>${h.area || h.cities.length ? `<dt>Where</dt><dd>${esc(h.area || h.cities.join(", "))}</dd>` : ""}<dt>Sites</dt><dd>${h.sites}</dd></dl><p class="help">The source no longer reports this.</p>`,
        `${h.url ? `<a class="btn" style="text-decoration:none" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener">Open the source</a>` : ""}<button class="btn" data-close>Close</button>`); return; }
    const s = signalBy(UI.watchSel); if (!s) return;
    if (d.wesc !== undefined) escalateForm({ signal: s, sev: s.tier >= 3 ? "P1" : s.tier === 2 ? "P2" : "P3" });
    if (d.wnotify !== undefined) notifyComposer(s, { title: "Notify — " + s.title });
    if (d.wbrief !== undefined){ const ok = await copyText(briefFor(s)); t.textContent = ok ? "Copied" : "Copy failed"; }
    if (d.wadd !== undefined){ const i = addManualItem({ title: s.title, tier: s.tier, pri: s.tier >= 3 ? "P1" : s.tier === 2 ? "P2" : "P3", kind: s.kind }); i.key = "sig:" + s.key; i.sigKey = s.key; toast("Added to the Inbox", s.title, s.tier); rerender(); } };
  p.oninput = e => { if (e.target.matches("[data-wq]")){ UI.q = e.target.value; saveUI(); clearTimeout(p._t); p._t = setTimeout(() => { const pos = e.target.selectionStart; rerender(); const i = p.querySelector("[data-wq]"); if (i){ i.focus(); i.setSelectionRange(pos, pos); } }, 250); } };
  p.onsubmit = e => { if (!e.target.matches("[data-wnote]")) return; e.preventDefault(); const i = e.target.querySelector("input"), v = i.value.trim(); if (!v || !UI.watchSel) return;
    (NOTES[UI.watchSel] = NOTES[UI.watchSel] || []).push({ t: Date.now(), by: who(), m: v }); save("notes", NOTES); audit("Note added", (signalBy(UI.watchSel) || {}).title || UI.watchSel, v); rerender(); };
  if (!p._tcr) p._tcr = true, p.addEventListener("input", e => { if (!e.target.matches("[data-tcr]")) return; UI.tcHour = +e.target.value; saveUI(); const l = p.querySelector("#tcL"); if (l) l.textContent = UI.tcHour ? `+${UI.tcHour} h, ${sgt(Date.now() + UI.tcHour * 3600e3)} SGT` : "now"; emit("map"); });
  p.onchange = e => { const t = e.target; if (t.matches("[data-wall]")){ UI.watchAll = t.checked; saveUI(); rerender(); } if (t.matches("[data-csort]")){ UI.citySort = t.value; saveUI(); rerender(); } if (t.matches("[data-wsort]")){ UI.watchSort = t.value; saveUI(); rerender(); }
    const s = signalBy(UI.watchSel); if (s && (t.dataset.qshake || t.dataset.qdmg)){ const st = QSTATE[s.id] = QSTATE[s.id] || {}, k = t.dataset.qshake ? "shaking" : "damage", c = t.dataset.qshake || t.dataset.qdmg;
      st[k] = (st[k] || []).filter(x => x !== c).concat(t.checked ? [c] : []); saveQ(); } }; }

function tvHtml(){ return `<div class="tvbox" id="tvbox"></div>`; }
