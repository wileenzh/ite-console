// SITES — the estate (fictional, in PULSE's naming convention), each site's contacts, and what is affecting it now.
// Add a site by hand, and look up an address against the estate.
import { $, esc, sgt, ago, km, copyText, getJSON, load } from "../core.js";
import { SITES, SITES_META, CONTACTS, STATE, EVENTS, isLive, isOffice, contactFor, siteBy, audit, siteCountries } from "../model.js";
import { UI, saveUI, go } from "./state.js";
import { dialog, closeDialog, toast, tierWord, priChip, field } from "./kit.js";
import { addManualSite, removeManualSite } from "../sites-import.js";
import { escalateForm } from "./forms.js";
import { pickPoint, mapReady, flyTo, classBand } from "./map.js";

const FIELDS = [["address", "Address"], ["socPhone", "SOC phone"], ["siteSecurityMgr", "Site security manager"], ["securityDG", "Security distribution group"], ["campusMgr", "Campus manager"], ["adminOfficer", "Admin officer"], ["rsom", "Regional security operations manager"], ["vendorRSM", "Vendor RSM"], ["landlord", "Landlord"], ["timeZone", "Time zone"]];
const CLASSES = { all: "All classes", ab: "Class A and B", c: "Class C and C-PE", e: "Edge and other", o: "Offices" };
const STATUSES = { live: "Live (operational, deployment, lockdown)", build: "Construction", other: "Retired and other", all: "All statuses" };
const statusBand = s => isLive(s) || isOffice(s) ? "live" : s.status === "CONSTRUCTION" ? "build" : "other";
const hazardsAt = s => STATE.list.filter(x => x.kind !== "conditions" && x.sites.some(y => y.code === s.code)).sort((a, b) => b.tier - a.tier);
const siteTier = s => Math.max(0, ...hazardsAt(s).map(x => x.tier), (STATE.scores[s.metro] || {}).tier || 0);
const rank = s => statusBand(s) === "live" ? 0 : statusBand(s) === "build" ? 1 : 2;
export const siteFilter = s => (!UI.siteCls || UI.siteCls === "all" || classBand(s.cls) === UI.siteCls) && ((UI.siteSt || "live") === "all" || statusBand(s) === (UI.siteSt || "live"));
function filtered(){ const q = (UI.siteQ || "").trim().toLowerCase();
  return SITES.filter(s => siteFilter(s) && (!q || [s.code, s.city, s.country, s.cls, s.status, s.name].some(v => String(v || "").toLowerCase().includes(q)))).sort((a, b) => siteTier(b) - siteTier(a) || rank(a) - rank(b) || String(a.code).localeCompare(b.code)); }
let found = null, GEO = [], geoDone = null;   // the address being looked at, and the choices for it
document.addEventListener("click", e => { const t = e.target.closest("#dialog [data-geopick]"); if (!t) return; const r = GEO[+t.dataset.geopick]; if (r){ found = r; closeDialog(); if (geoDone) geoDone(); flyTo(r.lat, r.lon, 10); } });

export function render(p){ if (found) return p.innerHTML = place(found); const s = UI.siteSel && siteBy(UI.siteSel); if (s) return p.innerHTML = card(s);
  const list = filtered(), live = SITES.filter(isLive).length;
  p.innerHTML = `<div class="ph"><h1>Sites</h1><button class="btn small" data-sadd>Add a site</button>
      <div class="sum">${SITES.length} sites, ${live} live, ${SITES.filter(isOffice).length} offices. <b>The estate is fictional</b>: codes, classes and contacts follow PULSE's conventions at made-up positions in each metro. Hazards, warnings and every other feed are real.</div></div>
    <form class="filters" data-geo><input class="search" type="search" id="geoQ" placeholder="Find an address: nearest sites and threats" style="flex:1;min-width:200px"><button class="btn small">Find</button></form>
    <p class="help" style="padding:0 16px">What you type is sent to OpenStreetMap's search services. Do not search a real site's address.</p>
    <div class="filters"><input class="search" type="search" placeholder="Code, city, country or class" value="${esc(UI.siteQ || "")}" data-sq style="width:220px">
      <select class="search" data-scls style="width:auto">${Object.entries(CLASSES).map(([k, l]) => `<option value="${k}"${(UI.siteCls || "all") === k ? " selected" : ""}>${l}</option>`).join("")}</select>
      <select class="search" data-sst style="width:auto">${Object.entries(STATUSES).map(([k, l]) => `<option value="${k}"${(UI.siteSt || "live") === k ? " selected" : ""}>${l}</option>`).join("")}</select><span class="help">${list.length} shown</span></div>
    <div class="scroll">${list.slice(0, 400).map(x => { const t = siteTier(x), h = hazardsAt(x); return `<button class="row" data-ssel="${esc(x.code)}"><span class="bar t${t}"></span><span><span class="tt"><i class="sitedot ${classBand(x.cls)}${statusBand(x) === "live" ? "" : " notlive"}" style="margin-right:6px"></i>${esc(x.code)}${x.name && x.name !== x.code ? " — " + esc(x.name) : ""}</span><div class="mt">${esc(x.cls)} · ${esc(x.status.toLowerCase())} · ${esc([x.city, x.country].filter(Boolean).join(", "))}${x.manual ? " · added by hand" : ""}</div></span><span class="rt">${h.length ? `<b>${h.length} hazard${h.length === 1 ? "" : "s"}</b>` : ""}${contactFor(x) ? "contacts" : ""}</span></button>`; }).join("") || `<div class="empty">No sites match.</div>`}</div>`; }

function card(s){ const c = contactFor(s) || {}, hz = hazardsAt(s), evs = EVENTS.filter(e => e.status !== "closed" && e.sites.includes(s.code)), off = isOffice(s) ? Object.entries(CONTACTS.offices || {}).find(([k]) => k === s.code || k === s.name) : null;
  const tel = v => `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ""))}">${esc(v)}</a>`, missing = FIELDS.filter(([k]) => !c[k]).map(([, l]) => l);
  return `<div class="detail"><button class="back" data-sback>All sites</button><h2>${esc(s.code)}${s.name && s.name !== s.code ? " — " + esc(s.name) : ""}</h2><p class="help">${esc(s.tier && s.tier !== "Office" ? "Class " + s.tier : s.cls)}${s.type ? " " + esc(s.type.toLowerCase()) : ""} · ${esc(s.status.toLowerCase())} · ${esc([s.city, s.country].filter(Boolean).join(", "))} · ${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}${s.manual ? " · added by hand" : " · fictional"}</p>
    <div class="sec"><h3>Contacts</h3>${off ? `<p class="prose">Building: ${esc(off[1])}</p>` : ""}${FIELDS.some(([k]) => c[k]) ? `<dl class="facts">${FIELDS.filter(([k]) => c[k]).map(([k, l]) => `<dt>${esc(l)}</dt><dd>${k === "socPhone" ? tel(c[k]) : esc(c[k])}</dd>`).join("")}</dl><p class="help">Fictional contacts, in the fields PULSE's site contact list uses. The phone numbers are not real.</p>` : `<p class="help">No contact record for this site.</p>`}</div>
    <div class="sec"><h3>Affecting this site now (${hz.length})</h3>${hz.map(x => `<button class="row" data-swatch="${esc(x.key)}"><span class="bar t${x.tier}"></span><span><span class="tt">${esc(x.title)}</span><div class="mt">${tierWord(x.tier)} · ${esc(ago(x.t))}</div></span><span class="rt">${(() => { const y = x.sites.find(z => z.code === s.code); return y && y.km ? Math.round(y.km) + " km" : ""; })()}</span></button>`).join("") || `<p class="help">Nothing in force.</p>`}</div>
    <div class="sec"><h3>Open escalations (${evs.length})</h3>${evs.map(e => `<button class="row" data-sev="${esc(e.id)}"><span class="bar"></span><span><span class="tt">${priChip(e.sev)}${esc(e.title)}</span></span><span class="rt">${esc((e.welfare[s.code] || {}).status || "welfare not checked")}</span></button>`).join("") || `<p class="help">None.</p>`}</div>
    <div class="actions"><button class="btn" data-strack>Escalate an event here</button><button class="btn" data-scopy="${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}">Copy coordinates</button>${s.manual ? `<button class="btn danger" data-sdel>Remove this site</button>` : ""}</div></div>`; }

/* ---------- an address: nearest sites and live threats nearby ---------- */
async function geocode(q){ try{ const j = await getJSON(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`, 12000);
    const r = (j.features || []).map(f => { const p = f.properties || {}, [lon, lat] = f.geometry.coordinates; return { lat, lon, label: [p.name, [p.housenumber, p.street].filter(Boolean).join(" "), p.city || p.county, p.state, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ") }; });
    if (r.length) return r; }catch(e){}
  const j = await getJSON(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, 12000); return (j || []).map(x => ({ lat: +x.lat, lon: +x.lon, label: x.display_name })); }
function place(f){ const near = SITES.filter(s => isFinite(s.lat)).map(s => ({ s, d: km(f.lat, f.lon, s.lat, s.lon) })).sort((a, b) => a.d - b.d).slice(0, 8);
  const threats = STATE.list.filter(x => x.kind !== "conditions" && x.kind !== "news" && isFinite(x.lat) && km(f.lat, f.lon, x.lat, x.lon) <= 150).sort((a, b) => b.tier - a.tier);
  return `<div class="detail"><button class="back" data-sgeoback>All sites</button><h2>${esc(f.label.split(",")[0])}</h2><p class="help">${esc(f.label)} · ${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}</p>
    <div class="actions"><button class="btn" data-scopy="${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}">Copy coordinates</button><button class="btn" data-sadd="here">Add as a site</button><button class="btn" data-sescgeo>Escalate an event here</button></div>
    <div class="sec"><h3>Nearest sites</h3><table class="tbl"><tr><th>Site</th><th>Class</th><th>Status</th><th>Distance</th></tr>${near.map(({ s, d }) => `<tr><td><button class="linkbtn" data-ssel="${esc(s.code)}">${esc(s.code)}</button><div class="help">${esc(s.city || "")}</div></td><td>${esc(s.cls)}</td><td>${esc(s.status.toLowerCase())}</td><td>${d < 10 ? d.toFixed(1) : Math.round(d)} km</td></tr>`).join("")}</table></div>
    <div class="sec"><h3>Live threats within 150 km (${threats.length})</h3>${threats.map(x => `<button class="row" data-swatch="${esc(x.key)}"><span class="bar t${x.tier}"></span><span><span class="tt">${esc(x.title)}</span><div class="mt">${tierWord(x.tier)} · ${Math.round(km(f.lat, f.lon, x.lat, x.lon))} km · ${esc(ago(x.t))}</div></span></button>`).join("") || `<p class="help">None reported.</p>`}</div></div>`; }

export function mapSpec(){ if (found) return { points: [{ lat: found.lat, lon: found.lon, tier: 1, label: found.label, on: true }], hitSites: [], fitKey: "geo:" + found.lat + found.lon, siteFilter, signals: STATE.list.filter(x => x.kind !== "conditions" && isFinite(x.lat) && km(found.lat, found.lon, x.lat, x.lon) <= 150) };
  const s = UI.siteSel && siteBy(UI.siteSel), hz = s ? hazardsAt(s) : [];
  return { signals: hz, siteFilter, hitSites: s ? [s.code] : filtered().filter(x => siteTier(x) >= 2).map(x => x.code), fitKey: s ? "s:" + s.code : "", onSite: code => go("sites", { siteSel: code }) }; }

function addSiteDialog(pre, rerender){ pre = pre || {};
  dialog("Add a site", `<div class="form">${field("Site code", `<input id="asC" value="${esc(pre.code || "")}" placeholder="e.g. XSG99" autofocus>`)}${field("Name (optional)", `<input id="asN" value="${esc(pre.name || "")}">`)}
    ${field("City", `<input id="asCity" value="${esc(pre.city || "")}">`)}${field("Country", `<input id="asCo" list="asCoL" value="${esc(pre.country || "")}"><datalist id="asCoL">${siteCountries().map(c => `<option>${esc(c)}</option>`).join("")}</datalist>`)}
    ${field("Class", `<select id="asCl">${["CLASS A", "CLASS B", "CLASS C", "C-PE", "EDGE", "OFFICE"].map(c => `<option>${c}</option>`).join("")}</select>`)}${field("Status", `<select id="asSt">${["OPERATIONAL", "DEPLOYMENT", "CONSTRUCTION", "PROPOSED"].map(c => `<option>${c}</option>`).join("")}</select>`)}
    ${field("Latitude", `<input id="asLa" type="number" step="any" value="${pre.lat ?? ""}">`)}${field("Longitude", `<input id="asLo" type="number" step="any" value="${pre.lon ?? ""}">`)}
    <div class="fld" style="justify-content:flex-end">${mapReady() ? `<button class="btn small" id="asPick" type="button">Pick on the map</button>` : ""}</div></div>
    <p class="help">Kept in this browser until you remove it. Use it for exercises or a temporary location.</p>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="asGo">Add site</button>`);
  if ($("#asPick")) $("#asPick").onclick = async () => { $("#scrim").hidden = true; toast("Click the map where the site is", "", null, null, 4000); const ll = await pickPoint(); $("#scrim").hidden = false; if (ll){ $("#asLa").value = ll.lat.toFixed(5); $("#asLo").value = ll.lng.toFixed(5); } };
  $("#asGo").onclick = () => { const code = $("#asC").value.trim().toUpperCase(), lat = parseFloat($("#asLa").value), lon = parseFloat($("#asLo").value);
    if (!code){ $("#asC").focus(); return; } if (!isFinite(lat) || !isFinite(lon)){ toast("Add the coordinates", "Type them or pick the spot on the map.", 2); return; }
    if (SITES.some(s => s.code === code && !s.manual)){ toast("That code is already in use", code, 2); return; }
    addManualSite({ code, name: $("#asN").value.trim(), city: $("#asCity").value.trim(), country: $("#asCo").value.trim(), region: "", cls: $("#asCl").value, status: $("#asSt").value, lat, lon });
    closeDialog(); found = null; UI.siteSel = code; saveUI(); toast("Site added", code, 0); rerender(); }; }

export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-ssel],[data-sback],[data-swatch],[data-sev],[data-strack],[data-sadd],[data-scopy],[data-sdel],[data-sgeoback],[data-sescgeo]"); if (!t) return; const d = t.dataset;
    if (d.ssel){ found = null; UI.siteSel = d.ssel; saveUI(); rerender(); return; } if (d.sback !== undefined){ UI.siteSel = null; saveUI(); rerender(); return; }
    if (d.sgeoback !== undefined){ found = null; rerender(); return; }
    if (d.swatch){ go("watch", { watchSel: d.swatch, watchCity: null, watchMode: "feed" }); return; } if (d.sev){ go("events", { eventSel: d.sev }); return; }
    if (d.strack !== undefined){ const s = siteBy(UI.siteSel); escalateForm({ sites: [s.code], country: s.country, lat: s.lat, lon: s.lon }); return; }
    if (d.sescgeo !== undefined && found){ const near = SITES.filter(s => (isLive(s) || isOffice(s)) && km(found.lat, found.lon, s.lat, s.lon) <= 25).map(s => s.code); escalateForm({ title: found.label.split(",")[0], sites: near, lat: found.lat, lon: found.lon }); return; }
    if (d.scopy){ const ok = await copyText(d.scopy); t.textContent = ok ? "Copied" : "Copy failed"; return; }
    if (d.sadd !== undefined){ addSiteDialog(d.sadd === "here" && found ? { lat: +found.lat.toFixed(5), lon: +found.lon.toFixed(5), city: "" } : null, rerender); return; }
    if (d.sdel !== undefined){ removeManualSite(UI.siteSel); UI.siteSel = null; saveUI(); rerender(); return; }
  };
  p.onsubmit = async e => { if (!e.target.matches("[data-geo]")) return; e.preventDefault(); const q = $("#geoQ").value.trim(); if (!q) return; const b = e.target.querySelector("button"); b.textContent = "Finding…";
    try{ const r = await geocode(q); GEO = r; geoDone = () => { rerender(); }; if (!r.length) toast("No match", q, 2); else if (r.length === 1){ found = r[0]; rerender(); flyTo(found.lat, found.lon, 10); }
      else dialog("Which one?", r.map((x, i) => `<button class="row" data-geopick="${i}" style="width:100%"><span class="bar"></span><span><span class="tt">${esc(x.label)}</span></span></button>`).join(""), `<button class="btn" data-close>Cancel</button>`); }
    catch(err){ toast("Address search is not reachable", "photon.komoot.io and nominatim.openstreetmap.org may be blocked on this network.", 2); } finally{ b.textContent = "Find"; } };
  p.oninput = e => { if (e.target.matches("[data-sq]")){ UI.siteQ = e.target.value; saveUI(); clearTimeout(p._t); p._t = setTimeout(() => { const pos = e.target.selectionStart; rerender(); const i = p.querySelector("[data-sq]"); if (i){ i.focus(); i.setSelectionRange(pos, pos); } }, 200); } };
  p.onchange = e => { if (e.target.matches("[data-scls]")){ UI.siteCls = e.target.value; saveUI(); rerender(); } if (e.target.matches("[data-sst]")){ UI.siteSt = e.target.value; saveUI(); rerender(); } }; }
function pickFile(accept, fn){ const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.onchange = async () => { const f = i.files[0]; if (f) try{ await fn(f); }catch(err){ toast("Could not read " + f.name, err.message, 3); } }; i.click(); }
export { pickFile };
