// SITES — the estate, each site's contacts, and what is affecting it now. Load or link the real estate here,
// add a site by hand, look up an address against the estate, and check the site data.
import { $, esc, sgt, ago, km, copyText, getJSON, load } from "../core.js";
import { SITES, SITES_META, CONTACTS, STATE, EVENTS, isLive, isOffice, contactFor, siteBy, audit, siteCountries } from "../model.js";
import { UI, saveUI, go } from "./state.js";
import { dialog, closeDialog, toast, tierWord, priChip, field } from "./kit.js";
import { readWorkbook, rowsToSites, applySites, readPulseFile, applyPulse, LAST_REPORT, manualSites, addManualSite, removeManualSite, canLink, linkSiteFile, unlinkSiteFile, syncSiteFile } from "../sites-import.js";
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
  const list = filtered(), live = SITES.filter(isLive).length, link = load("siteLink", null);
  p.innerHTML = `<div class="ph"><h1>Sites</h1><button class="btn small" data-sadd>Add a site</button>
      <div class="sum">${SITES.length} sites, ${live} live, ${SITES.filter(isOffice).length} offices. From ${esc(SITES_META.source)}${SITES_META.at ? ", " + esc(ago(SITES_META.at)) : ""}.${SITES_META.demo ? " <b>These are fictional demo sites</b> — load your site file or a PULSE file to use the real estate." : ""}${CONTACTS.at ? ` Contacts for ${Object.keys(CONTACTS.sites).length} sites.` : ""}
        ${link ? ` Linked to <b>${esc(link.name)}</b>${link.synced ? `, checked ${esc(ago(link.synced))}` : ""}.` : ""}</div>
      <div class="actions" style="margin-top:6px"><button class="btn small" data-sload>Load site file</button>${canLink() ? `<button class="btn small" data-slink>${link ? "Sync now" : "Link the site file"}</button>${link ? `<button class="linkbtn" data-sunlink>Unlink</button>` : ""}` : ""}<button class="btn small" data-spulse>Import PULSE file</button>${LAST_REPORT ? `<button class="linkbtn" data-sreport>Site data details</button>` : ""}</div></div>
    <form class="filters" data-geo><input class="search" type="search" id="geoQ" placeholder="Find an address: nearest sites and threats" style="flex:1;min-width:200px"><button class="btn small">Find</button></form>
    <div class="filters"><input class="search" type="search" placeholder="Code, city, country or class" value="${esc(UI.siteQ || "")}" data-sq style="width:220px">
      <select class="search" data-scls style="width:auto">${Object.entries(CLASSES).map(([k, l]) => `<option value="${k}"${(UI.siteCls || "all") === k ? " selected" : ""}>${l}</option>`).join("")}</select>
      <select class="search" data-sst style="width:auto">${Object.entries(STATUSES).map(([k, l]) => `<option value="${k}"${(UI.siteSt || "live") === k ? " selected" : ""}>${l}</option>`).join("")}</select><span class="help">${list.length} shown</span></div>
    <div class="scroll">${list.slice(0, 400).map(x => { const t = siteTier(x), h = hazardsAt(x); return `<button class="row" data-ssel="${esc(x.code)}"><span class="bar t${t}"></span><span><span class="tt"><i class="sitedot ${classBand(x.cls)}${statusBand(x) === "live" ? "" : " notlive"}" style="margin-right:6px"></i>${esc(x.code)}${x.name && x.name !== x.code ? " — " + esc(x.name) : ""}</span><div class="mt">${esc(x.cls)} · ${esc(x.status.toLowerCase())} · ${esc([x.city, x.country].filter(Boolean).join(", "))}${x.manual ? " · added by hand" : ""}</div></span><span class="rt">${h.length ? `<b>${h.length} hazard${h.length === 1 ? "" : "s"}</b>` : ""}${contactFor(x) ? "contacts" : ""}</span></button>`; }).join("") || `<div class="empty">No sites match.</div>`}</div>`; }

function card(s){ const c = contactFor(s) || {}, hz = hazardsAt(s), evs = EVENTS.filter(e => e.status !== "closed" && e.sites.includes(s.code)), off = isOffice(s) ? Object.entries(CONTACTS.offices || {}).find(([k]) => k === s.code || k === s.name) : null;
  const tel = v => `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ""))}">${esc(v)}</a>`, missing = FIELDS.filter(([k]) => !c[k]).map(([, l]) => l);
  return `<div class="detail"><button class="back" data-sback>All sites</button><h2>${esc(s.code)}${s.name && s.name !== s.code ? " — " + esc(s.name) : ""}</h2><p class="help">${esc(s.cls)} · ${esc(s.status.toLowerCase())} · ${esc([s.city, s.country].filter(Boolean).join(", "))} · ${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}${s.manual ? " · added by hand" : ""}</p>
    <div class="sec"><h3>Contacts</h3>${off ? `<p class="prose">Building: ${esc(off[1])}</p>` : ""}${FIELDS.some(([k]) => c[k]) ? `<dl class="facts">${FIELDS.filter(([k]) => c[k]).map(([k, l]) => `<dt>${esc(l)}</dt><dd>${k === "socPhone" ? tel(c[k]) : esc(c[k])}</dd>`).join("")}</dl>${CONTACTS.file ? `<p class="help">From ${esc(CONTACTS.file)}, imported ${esc(sgt(CONTACTS.at))} SGT.${missing.length && missing.length < FIELDS.length ? " Not in the contact list: " + esc(missing.join(", ").toLowerCase()) + "." : ""}</p>` : ""}` : `<p class="help">No contact record for this site. Import a PULSE file to bring in addresses, SOC phones and security contacts.</p>`}</div>
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

function reportDialog(){ const r = LAST_REPORT; if (!r) return; const kv = o => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join("");
  dialog("Site data details", `<p class="help">${esc(r.source)}, read ${esc(sgt(r.at))} SGT.</p>
    <dl class="facts"><dt>Rows read</dt><dd>${r.rows ?? "—"}</dd><dt>Placed on the map</dt><dd>${r.added}</dd><dt>Planned, proposed or cancelled</dt><dd>${r.planning} (not added)</dd><dt>No coordinates</dt><dd>${r.noCoords}</dd><dt>Duplicates or blank</dt><dd>${r.skipped}</dd>${r.removed != null ? `<dt>Since the last load</dt><dd>${r.added} in the file; ${r.removed} removed from the console</dd>` : ""}</dl>
    <div class="sec"><h3>Checks</h3>${(r.fixes || []).map(x => `<p class="prose"><b>Corrected:</b> ${esc(x)}</p>`).join("")}${(r.outliers || []).length ? `<p class="prose"><b>Far from the other sites in their city — check these:</b> ${esc(r.outliers.join("; "))}</p>` : `<p class="help">No site sits far from the other sites filed under its city.</p>`}</div>
    <div class="cols2"><div class="sec"><h3>By class</h3><table class="tbl">${kv(r.byClass)}</table></div><div class="sec"><h3>By status</h3><table class="tbl">${kv(r.byStatus)}</table></div></div>
    <div class="sec"><h3>Field coverage</h3><table class="tbl"><tr><th>Field</th><th>Rows with a value</th></tr>${(r.coverage || []).map(([f, n, t]) => `<tr><td>${esc(f)}</td><td>${n} of ${t} (${t ? Math.round(n / t * 100) : 0} %)</td></tr>`).join("")}</table></div>`, `<button class="btn" data-close>Close</button>`, { wide: true }); }

function addSiteDialog(pre, rerender){ pre = pre || {};
  dialog("Add a site", `<div class="form">${field("Site code", `<input id="asC" value="${esc(pre.code || "")}" placeholder="e.g. XSG99" autofocus>`)}${field("Name (optional)", `<input id="asN" value="${esc(pre.name || "")}">`)}
    ${field("City", `<input id="asCity" value="${esc(pre.city || "")}">`)}${field("Country", `<input id="asCo" list="asCoL" value="${esc(pre.country || "")}"><datalist id="asCoL">${siteCountries().map(c => `<option>${esc(c)}</option>`).join("")}</datalist>`)}
    ${field("Class", `<select id="asCl">${["CLASS A", "CLASS B", "CLASS C", "C-PE", "EDGE", "OFFICE"].map(c => `<option>${c}</option>`).join("")}</select>`)}${field("Status", `<select id="asSt">${["OPERATIONAL", "DEPLOYMENT", "CONSTRUCTION", "PROPOSED"].map(c => `<option>${c}</option>`).join("")}</select>`)}
    ${field("Latitude", `<input id="asLa" type="number" step="any" value="${pre.lat ?? ""}">`)}${field("Longitude", `<input id="asLo" type="number" step="any" value="${pre.lon ?? ""}">`)}
    <div class="fld" style="justify-content:flex-end">${mapReady() ? `<button class="btn small" id="asPick" type="button">Pick on the map</button>` : ""}</div></div>
    <p class="help">Kept in this browser and re-added after every site file load, until you remove it.</p>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="asGo">Add site</button>`);
  if ($("#asPick")) $("#asPick").onclick = async () => { $("#scrim").hidden = true; toast("Click the map where the site is", "", null, null, 4000); const ll = await pickPoint(); $("#scrim").hidden = false; if (ll){ $("#asLa").value = ll.lat.toFixed(5); $("#asLo").value = ll.lng.toFixed(5); } };
  $("#asGo").onclick = () => { const code = $("#asC").value.trim().toUpperCase(), lat = parseFloat($("#asLa").value), lon = parseFloat($("#asLo").value);
    if (!code){ $("#asC").focus(); return; } if (!isFinite(lat) || !isFinite(lon)){ toast("Add the coordinates", "Type them or pick the spot on the map.", 2); return; }
    if (SITES.some(s => s.code === code && !s.manual)){ toast("That code is already in the site file", code, 2); return; }
    addManualSite({ code, name: $("#asN").value.trim(), city: $("#asCity").value.trim(), country: $("#asCo").value.trim(), region: "", cls: $("#asCl").value, status: $("#asSt").value, lat, lon });
    closeDialog(); found = null; UI.siteSel = code; saveUI(); toast("Site added", code, 0); rerender(); }; }

export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-ssel],[data-sback],[data-sload],[data-spulse],[data-swatch],[data-sev],[data-strack],[data-sadd],[data-sreport],[data-slink],[data-sunlink],[data-scopy],[data-sdel],[data-sgeoback],[data-sescgeo]"); if (!t) return; const d = t.dataset;
    if (d.ssel){ found = null; UI.siteSel = d.ssel; saveUI(); rerender(); return; } if (d.sback !== undefined){ UI.siteSel = null; saveUI(); rerender(); return; }
    if (d.sgeoback !== undefined){ found = null; rerender(); return; }
    if (d.swatch){ go("watch", { watchSel: d.swatch, watchCity: null, watchMode: "feed" }); return; } if (d.sev){ go("events", { eventSel: d.sev }); return; }
    if (d.strack !== undefined){ const s = siteBy(UI.siteSel); escalateForm({ sites: [s.code], country: s.country, lat: s.lat, lon: s.lon }); return; }
    if (d.sescgeo !== undefined && found){ const near = SITES.filter(s => (isLive(s) || isOffice(s)) && km(found.lat, found.lon, s.lat, s.lon) <= 25).map(s => s.code); escalateForm({ title: found.label.split(",")[0], sites: near, lat: found.lat, lon: found.lon }); return; }
    if (d.scopy){ const ok = await copyText(d.scopy); t.textContent = ok ? "Copied" : "Copy failed"; return; }
    if (d.sadd !== undefined){ addSiteDialog(d.sadd === "here" && found ? { lat: +found.lat.toFixed(5), lon: +found.lon.toFixed(5), city: "" } : null, rerender); return; }
    if (d.sdel !== undefined){ removeManualSite(UI.siteSel); UI.siteSel = null; saveUI(); rerender(); return; }
    if (d.sreport !== undefined){ reportDialog(); return; }
    if (d.sunlink !== undefined){ await unlinkSiteFile(); toast("Site file unlinked", "The sites already loaded stay.", 0); rerender(); return; }
    if (d.slink !== undefined){ try{ const linked = load("siteLink", null), r = linked ? await syncSiteFile(true) : await linkSiteFile();
        if (r && r.needsPermission) toast("Allow the console to read the file", "Your browser asked for permission; try Sync now again.", 2); else if (r) toast("Site file synced", `${r.added ? r.added.length : 0} added, ${r.removed ? r.removed.length : 0} removed.`, 0); rerender(); }
      catch(err){ if (err && err.name !== "AbortError") toast("Could not read the site file", err.message, 3); } return; }
    if (d.sload !== undefined) return pickFile(".xlsx,.xls,.csv", async f => { const wb = await readWorkbook(f), { sites, report } = rowsToSites(wb.rows);
      if (!sites.length) throw new Error("no usable rows (each needs a site name and coordinates)");
      dialog("Load " + f.name, `<p class="prose">${sites.length} sites read from sheet “${esc(wb.sheet)}”. ${report.planning} planned, proposed or cancelled rows skipped; ${report.noCoords} without coordinates skipped; ${report.skipped} duplicates or blank.${report.fixes.length ? ` ${report.fixes.length} city name${report.fixes.length === 1 ? "" : "s"} corrected from the coordinates.` : ""}${report.outliers.length ? ` <b>${report.outliers.length} site${report.outliers.length === 1 ? " sits" : "s sit"} far from the others in the same city</b> — see Site data details after loading.` : ""}</p><label class="chk"><input type="checkbox" id="slKeep" checked> Keep the offices already loaded</label><p class="help">This replaces the current site list in this browser. Sites added by hand are kept.</p>`,
        `<button class="btn" data-close>Cancel</button><button class="btn primary" id="slGo">Replace the site list</button>`); $("#slGo").onclick = () => { applySites(sites, f.name, $("#slKeep").checked, report); closeDialog(); toast("Sites loaded", sites.length + " sites from " + f.name, 0); rerender(); }; });
    if (d.spulse !== undefined) return pickFile(".html,.htm", async f => { const fd = await readPulseFile(f), mask = v => v.slice(0, 4) + "…" + v.slice(-3);
      dialog("Import from " + f.name, `<p class="help">Read in this browser only. Nothing is uploaded or written into the console's files.</p>
        ${fd.rows ? `<label class="chk"><input type="checkbox" id="piRows" checked> Site list — ${fd.rows.length} rows (planned, proposed and cancelled are skipped)</label>` : ""}${fd.offices.length ? `<label class="chk"><input type="checkbox" id="piOff" checked> Offices — ${fd.offices.length}</label>` : ""}
        ${fd.dci ? `<label class="chk"><input type="checkbox" id="piDci" checked> Site contacts — ${Object.keys(fd.dci).length} sites</label>` : ""}
        ${fd.ttp ? `<label class="chk"><input type="checkbox" id="piTtp" checked> REN TTP${fd.ttp.meta && fd.ttp.meta.version ? " v" + esc(fd.ttp.meta.version) : ""} — ${Object.keys(fd.ttp.ttp || {}).length} categories: triggers, update cadence, close criteria and PSOC actions</label>` : fd.ttpErr ? `<p class="help">The REN TTP could not be read: ${esc(fd.ttpErr)}.</p>` : ""}${fd.watch ? `<label class="chk"><input type="checkbox" id="piWatch" checked> PSOC watch desk contacts</label>` : ""}
        ${Object.keys(fd.keys).length ? `<h3 style="font:600 13px var(--cond);color:var(--muted);margin:14px 0 4px">Keys in the file — off unless you are allowed to use them here</h3>${Object.entries(fd.keys).map(([k, v]) => `<label class="chk"><input type="checkbox" id="piKey_${k}"> ${k.toUpperCase()} ${esc(mask(v))}</label>`).join("")}` : ""}`,
        `<button class="btn" data-close>Cancel</button><button class="btn primary" id="piGo">Import</button>`);
      $("#piGo").onclick = () => { const on = id => !!($("#" + id) && $("#" + id).checked); const done = applyPulse(fd, { rows: on("piRows"), offices: on("piOff"), dci: on("piDci"), watch: on("piWatch"), ttp: on("piTtp"), key_cwa: on("piKey_cwa"), key_kma: on("piKey_kma"), key_waqi: on("piKey_waqi") });
        closeDialog(); toast("Imported", done.join(", ") || "nothing selected", 0); rerender(); }; }); };
  p.onsubmit = async e => { if (!e.target.matches("[data-geo]")) return; e.preventDefault(); const q = $("#geoQ").value.trim(); if (!q) return; const b = e.target.querySelector("button"); b.textContent = "Finding…";
    try{ const r = await geocode(q); GEO = r; geoDone = () => { rerender(); }; if (!r.length) toast("No match", q, 2); else if (r.length === 1){ found = r[0]; rerender(); flyTo(found.lat, found.lon, 10); }
      else dialog("Which one?", r.map((x, i) => `<button class="row" data-geopick="${i}" style="width:100%"><span class="bar"></span><span><span class="tt">${esc(x.label)}</span></span></button>`).join(""), `<button class="btn" data-close>Cancel</button>`); }
    catch(err){ toast("Address search is not reachable", "photon.komoot.io and nominatim.openstreetmap.org may be blocked on this network.", 2); } finally{ b.textContent = "Find"; } };
  p.oninput = e => { if (e.target.matches("[data-sq]")){ UI.siteQ = e.target.value; saveUI(); clearTimeout(p._t); p._t = setTimeout(() => { const pos = e.target.selectionStart; rerender(); const i = p.querySelector("[data-sq]"); if (i){ i.focus(); i.setSelectionRange(pos, pos); } }, 200); } };
  p.onchange = e => { if (e.target.matches("[data-scls]")){ UI.siteCls = e.target.value; saveUI(); rerender(); } if (e.target.matches("[data-sst]")){ UI.siteSt = e.target.value; saveUI(); rerender(); } }; }
function pickFile(accept, fn){ const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.onchange = async () => { const f = i.files[0]; if (f) try{ await fn(f); }catch(err){ toast("Could not read " + f.name, err.message, 3); } }; i.click(); }
export { pickFile };
// a linked site file is re-checked every 15 minutes (only when the browser already allows reading it)
setInterval(async () => { if (!load("siteLink", null)) return; try{ const r = await syncSiteFile(false); if (r && r.added && (r.added.length || r.removed.length)) toast("Site file re-synced", `${r.added.length} added, ${r.removed.length} removed.`, 0); }catch(e){} }, 15 * 60e3);
