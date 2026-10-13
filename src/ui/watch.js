// WATCH — everything the sources report, on one map and in one feed. Hazard type is a filter, not a tab.
import { $, esc, sgt, ago, safeUrl, copyText, trunc } from "../core.js";
import { STATE, KINDS, CITIES, REGIONS, INBOX, METRO, siteBy, airFor, signalBy, addManualItem } from "../model.js";
import { MODEL_NAME } from "../sources/conditions.js";
import { roman, magLabel, QSTATE, saveQ } from "../sources/quakes.js";
import { tcClass } from "../sources/hazards.js";
import { SOURCES } from "../sources/index.js";
import { UI, saveUI, go } from "./state.js";
import { tierWord, when, toast } from "./kit.js";
import { escalateForm, notifyComposer } from "./forms.js";

const touches = s => s.sites.length || s.cities.length || s.alarm;
const srcName = id => (SOURCES.find(s => s.id === id) || {}).name || id;
const srcLine = s => { const k = KINDS[s.kind].label, n = srcName(s.src); return n.toLowerCase().includes(k.toLowerCase().replace(/e?s$/, "")) ? n : k + " · " + n; };
export function visible(){ const q = UI.q.trim().toLowerCase();
  return STATE.list.filter(s => (UI.watchAll || touches(s)) && (!UI.watchKinds.length || UI.watchKinds.includes(s.kind)) && (!q || (s.title + " " + (s.area || "") + " " + s.cities.join(" ")).toLowerCase().includes(q))); }
export function count(){ const h = Date.now() - 3600e3; return STATE.list.filter(s => touches(s) && s.tier >= 1 && (s.t || 0) > h).length; }

export function render(p){ const sel = UI.watchSel && signalBy(UI.watchSel);
  if (UI.watchCity) return p.innerHTML = cityDetail(UI.watchCity);
  if (sel) return p.innerHTML = detail(sel);
  const base = STATE.list.filter(s => UI.watchAll || touches(s)), kinds = Object.keys(KINDS).filter(k => base.some(s => s.kind === k)), list = visible();
  p.innerHTML = `<div class="ph"><h1>Watch</h1><div class="seg" role="group" aria-label="View"><button data-wmode="feed" aria-pressed="${UI.watchMode !== "cities"}">Feed</button><button data-wmode="cities" aria-pressed="${UI.watchMode === "cities"}">Cities</button></div>
      <div class="sum">${UI.watchMode === "cities" ? `Conditions in ${CITIES.length} cities: weather now, next 48 hours, air, river, and hazards in force.` : `${list.length} ${UI.watchAll ? "reports" : "reports touching our sites"} from ${Object.values(STATE.feeds).filter(f => f.ok).length} working sources. Anything that needs a decision is already in the Inbox.`}</div></div>
    ${UI.watchMode === "cities" ? citiesHtml() : `<div class="filters">${kinds.map(k => `<button class="fchip" data-wkind="${k}" aria-pressed="${UI.watchKinds.includes(k)}">${esc(KINDS[k].label)}<b>${base.filter(s => s.kind === k).length}</b></button>`).join("")}</div>
    <div class="filters"><input class="search" type="search" placeholder="Search the feed" value="${esc(UI.q)}" data-wq><label class="chk" style="font-size:12.5px;color:var(--muted)"><input type="checkbox" data-wall${UI.watchAll ? " checked" : ""}> Include reports that don't touch our sites</label></div>
    <div class="scroll">${list.slice(0, 300).map(rowHtml).join("") || `<div class="empty"><b>Nothing is touching our sites right now.</b>${STATE.list.length ? `${STATE.list.length} reports elsewhere — tick “Include reports that don't touch our sites” to see them.` : "Sources are loading."}</div>`}</div>`}`; }
function rowHtml(s){ const item = INBOX.find(i => i.key === "sig:" + s.key);
  return `<button class="row" data-wsel="${esc(s.key)}" aria-selected="${UI.watchSel === s.key}"><span class="bar t${s.tier}"></span><span><span class="tt">${esc(s.title)}</span>
    <div class="mt">${esc(srcLine(s))}${s.cities.length ? " · " + esc(s.cities.slice(0, 3).join(", ")) : s.area ? " · " + esc(trunc(s.area, 40)) : ""} · ${when(s.t)}</div></span>
    <span class="rt">${s.sites.length ? `<b>${s.sites.length} site${s.sites.length === 1 ? "" : "s"}</b>` : ""}${item ? (item.status === "open" ? "in Inbox" : item.decision) : ""}</span></button>`; }

function detail(s){ const e = s.extra || {}, item = INBOX.find(i => i.key === "sig:" + s.key), facts = [["Level", tierWord(s.tier)], ["Source", `${esc(srcName(s.src))}${e.agency ? " — " + esc(e.agency) : ""}`], ["Reported", `${esc(sgt(s.t))} SGT (${esc(ago(s.t))})`]];
  if (s.end) facts.push(["Until", esc(sgt(s.end)) + " SGT"]); if (s.area) facts.push(["Area", esc(s.area)]); if (s.cities.length) facts.push(["Cities", esc(s.cities.join(", "))]);
  if (s.kind === "quake"){ facts.push(["Magnitude", `M${e.mag.toFixed(1)} (${magLabel(e.mag)}), depth ${Math.round(e.depth)} km`]); if (e.topSite) facts.push(["Strongest at a site", `MMI ${roman(e.topMMI)} at ${esc(e.topSite)}, ${Math.round(e.topKm)} km`]);
    facts.push(["Tsunami", e.tsunami ? "<b>flag set by USGS</b>" : "no flag"]); if (e.alert) facts.push(["PAGER", esc(e.alert)]); if (e.emsc) facts.push(["EMSC", `M${e.emsc.mag.toFixed(1)}`]); if (s.alarm) facts.push(["Alarm", s.alarm === "global" ? "global magnitude threshold" : "near-site threshold"]); }
  if (s.kind === "cyclone"){ const st = e.storm, c = tcClass(st.now.kt); facts.push(["Class", `${c[1]}${st.number ? " (No. " + esc(st.number) + ")" : ""}`]); if (st.now.hpa) facts.push(["Pressure", st.now.hpa + " hPa"]); }
  const siteRows = s.sites.slice(0, 60).map(x => { const st = siteBy(x.code) || {}; return `<tr${x.level === "direct" || (x.mmi >= 4) ? ` class="hot"` : ""}><td><button class="linkbtn" data-site="${esc(x.code)}">${esc(x.code)}</button></td><td>${esc(st.city || "")}</td><td>${x.km ? Math.round(x.km) + " km" : "in area"}</td><td>${x.mmi ? "MMI " + roman(x.mmi) : x.level ? esc(x.level) + (x.at ? " from " + esc(sgt(x.at)) : "") : ""}</td></tr>`; }).join("");
  const qs = s.kind === "quake" ? (QSTATE[s.id] || {}) : null;
  return `<div class="detail"><button class="back" data-wback>Back to the feed</button><h2>${esc(s.title)}</h2>
    <dl class="facts">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>
    ${s.text ? `<p class="prose">${esc(s.text)}</p>` : ""}${e.instruction ? `<p class="prose"><b>Agency advice:</b> ${esc(e.instruction)}</p>` : ""}
    <div class="actions">${item && item.status === "open" ? `<button class="btn primary" data-goinbox="${esc(item.id)}">Decide in the Inbox</button>` : `<button class="btn primary" data-wesc>Escalate</button>`}
      <button class="btn" data-wnotify>Notify</button>${!item ? `<button class="btn" data-wadd>Add to Inbox</button>` : ""}${s.url ? `<a class="btn" style="text-decoration:none" href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">Open the source</a>` : ""}</div>
    ${item && item.status !== "open" ? `<p class="help">Inbox: ${esc(item.decision)} by ${esc(item.by || "")} ${esc(ago(item.decidedAt))}${item.reason ? " — " + esc(item.reason) : ""}.</p>` : ""}
    ${qs ? `<div class="sec"><h3>Welfare at sites</h3><p class="help">Tick sites where personnel felt shaking or reported damage; the welfare update wording follows.</p>
      <table class="tbl"><tr><th>Site</th><th>Shaking felt</th><th>Damage</th></tr>${s.sites.slice(0, 20).map(x => `<tr><td>${esc(x.code)}</td><td><input type="checkbox" data-qshake="${esc(x.code)}"${(qs.shaking || []).includes(x.code) ? " checked" : ""}></td><td><input type="checkbox" data-qdmg="${esc(x.code)}"${(qs.damage || []).includes(x.code) ? " checked" : ""}></td></tr>`).join("")}</table></div>` : ""}
    <div class="sec"><h3>Sites ${s.sites.length ? `(${s.sites.length})` : ""}</h3>${siteRows ? `<table class="tbl"><tr><th>Site</th><th>City</th><th>Distance</th><th></th></tr>${siteRows}</table>` : `<p class="help">No tracked site in range.${s.near ? ` Nearest: ${esc(s.near.code)}, ${Math.round(s.near.km)} km.` : ""}</p>`}</div></div>`; }

function citiesHtml(){ const cell = (p, cls) => p ? `<span class="c t${p.tier} ${cls}" title="${esc(p.text)}">${esc(p.value)}</span>` : `<span class="c ${cls}">—</span>`;
  return `<div class="scroll"><div class="cityhead"><span></span><span>City</span><span>Weather</span><span>Next 48 h</span><span>Air</span><span class="x4">River</span><span class="x5">Hazards</span></div>
    ${REGIONS.map(r => `<div class="region">${esc(r)}</div>${CITIES.filter(c => c.region === r).map(c => { const sc = STATE.scores[c.name] || { tier: 0, parts: {} }, P = sc.parts;
      return `<button class="city" data-wcity="${esc(c.name)}"><span class="bar t${sc.tier}"></span><span class="n">${esc(c.name)}</span>${cell(P.weather, "")}${cell(P.forecast, "")}${cell(P.air, "")}${cell(P.river, "x4")}${P.hazards && P.hazards.list.length ? `<span class="c t${P.hazards.tier} x5">${P.hazards.list.length} in force</span>` : `<span class="c x5">none</span>`}</button>`; }).join("")}`).join("")}</div>`; }
function cityDetail(name){ const c = CITIES.find(x => x.name === name), sc = STATE.scores[name] || { tier: 0, parts: {} }, P = sc.parts, w = STATE.city.wx[name], a = airFor(name), sigs = STATE.list.filter(s => s.cities.includes(name) && s.kind !== "conditions");
  const row = (l, p, extra) => `<tr><td>${esc(l)}</td><td>${p ? tierWord(p.tier) : "—"}</td><td>${p ? esc(p.value) : "no data"}</td><td>${p ? esc(p.text) : ""}${extra || ""}</td></tr>`;
  return `<div class="detail"><button class="back" data-wcityback>Back to cities</button><h2>${esc(name)}</h2><p class="help">${tierWord(sc.tier)} · ${esc(c ? c.region : "")}</p>
    <table class="tbl"><tr><th>Condition</th><th>Level</th><th>Now</th><th>Why</th></tr>${row("Weather now", P.weather, w ? ` · model ${esc(MODEL_NAME[w.model] || w.model)}` : "")}${row("Next 48 hours", P.forecast)}${row("Air quality", P.air)}${row("River flow", P.river)}</table>
    <div class="sec"><h3>Hazards in force (${sigs.length})</h3>${sigs.map(rowHtml).join("") || `<p class="help">None.</p>`}</div>
    <div class="sec"><h3>Sites in ${esc(name)} (${(METRO[name] || []).length})</h3><p class="help">${(METRO[name] || []).map(x => `<button class="linkbtn" data-site="${esc(x.code)}">${esc(x.code)}</button>`).join(", ") || "None."}</p></div></div>`; }

export function mapSpec(){ const s = UI.watchSel && signalBy(UI.watchSel);
  if (UI.watchMode === "cities" && !s){ const c = UI.watchCity && CITIES.find(x => x.name === UI.watchCity);
    return { points: CITIES.map(x => ({ lat: x.lat, lon: x.lon, tier: (STATE.scores[x.name] || {}).tier || 0, label: x.name, on: c === x, go: () => go("watch", { watchCity: x.name }) })),
      signals: c ? STATE.list.filter(x => x.cities.includes(c.name) && x.kind !== "news") : [], hitSites: c ? (METRO[c.name] || []).map(x => x.code) : [], fitKey: c ? "c:" + c.name : "" }; }
  const list = visible();
  return { signals: list.slice(0, 400), selected: UI.watchSel, hitSites: s ? s.sites.map(x => x.code) : [], fitKey: s ? "w:" + s.key : "", tracks: true }; }

export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-wsel],[data-wback],[data-wkind],[data-wmode],[data-wesc],[data-wnotify],[data-wadd],[data-goinbox],[data-wcity],[data-wcityback],[data-site]"); if (!t) return; const d = t.dataset;
    if (d.wsel){ UI.watchSel = d.wsel; UI.watchCity = null; saveUI(); rerender(); p.scrollTop = 0; return; }
    if (d.wback !== undefined){ UI.watchSel = null; saveUI(); rerender(); return; }
    if (d.wkind){ const k = d.wkind; UI.watchKinds = UI.watchKinds.includes(k) ? UI.watchKinds.filter(x => x !== k) : UI.watchKinds.concat(k); saveUI(); rerender(); return; }
    if (d.wmode){ UI.watchMode = d.wmode; UI.watchSel = null; UI.watchCity = null; saveUI(); rerender(); return; }
    if (d.wcity){ UI.watchCity = d.wcity; saveUI(); rerender(); return; } if (d.wcityback !== undefined){ UI.watchCity = null; saveUI(); rerender(); return; }
    if (d.goinbox){ go("inbox", { inboxSel: d.goinbox }); return; } if (d.site){ go("sites", { siteSel: d.site }); return; }
    const s = signalBy(UI.watchSel); if (!s) return;
    if (d.wesc !== undefined) escalateForm({ signal: s, sev: s.tier >= 3 ? "P1" : s.tier === 2 ? "P2" : "P3" });
    if (d.wnotify !== undefined) notifyComposer(s, { title: "Notify — " + s.title });
    if (d.wadd !== undefined){ const i = addManualItem({ title: s.title, tier: s.tier, pri: s.tier >= 3 ? "P1" : s.tier === 2 ? "P2" : "P3", kind: s.kind }); i.key = "sig:" + s.key; i.sigKey = s.key; toast("Added to the Inbox", s.title, s.tier); rerender(); } };
  p.oninput = e => { if (e.target.matches("[data-wq]")){ UI.q = e.target.value; saveUI(); clearTimeout(p._t); p._t = setTimeout(() => { const pos = e.target.selectionStart; rerender(); const i = p.querySelector("[data-wq]"); if (i){ i.focus(); i.setSelectionRange(pos, pos); } }, 250); } };
  p.onchange = e => { const t = e.target; if (t.matches("[data-wall]")){ UI.watchAll = t.checked; saveUI(); rerender(); }
    const s = signalBy(UI.watchSel); if (s && (t.dataset.qshake || t.dataset.qdmg)){ const st = QSTATE[s.id] = QSTATE[s.id] || {}, k = t.dataset.qshake ? "shaking" : "damage", c = t.dataset.qshake || t.dataset.qdmg;
      st[k] = (st[k] || []).filter(x => x !== c).concat(t.checked ? [c] : []); saveQ(); } }; }
