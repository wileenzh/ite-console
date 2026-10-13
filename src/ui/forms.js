// The escalation form (from Watch, Inbox or Events) and the notify composer.
import { $, $$, esc, copyText } from "../core.js";
import { CFG } from "../config.js";
import { SOP_REF, SITES, siteBy, siteCountries, isLive, isOffice, createEvent, decide, catFor, audit, eventLog, CITIES } from "../model.js";
import { dialog, closeDialog, toast, field } from "./kit.js";
import { draftsForSignal, mailto, asHtml } from "./drafts.js";
import { pickPoint, mapReady } from "./map.js";
import { go } from "./state.js";
import { ccFor } from "../sources/people.js";
import { TTP, ttpName, cadenceFor } from "../ttp.js";

const countryOfSites = codes => { const c = codes.map(x => (siteBy(x) || {}).country).filter(Boolean); return c.sort((a, b) => c.filter(v => v === b).length - c.filter(v => v === a).length)[0] || ""; };
export function escalateForm(pre = {}, opts = {}){
  const sig = pre.signal || null, chosen = new Set(pre.sites || (sig ? sig.sites.map(x => x.code) : [])), cat = pre.cat || (sig ? catFor(sig) : "weather");
  let country = pre.country || countryOfSites([...chosen]) || (sig && sig.cc ? (siteCountries().find(c => ccFor(c) === sig.cc) || "") : ""), showAll = false;
  const body = `<div class="form">
    ${field("What is happening", `<input id="efTitle" value="${esc(pre.title || (sig ? sig.title : ""))}" placeholder="e.g. Heavy flooding in Bangkok" autofocus>`, true)}
    ${field("Category", `<select id="efCat">${Object.entries(SOP_REF).map(([k, v]) => `<option value="${k}"${k === cat ? " selected" : ""}>${esc(v.label)}</option>`).join("")}</select>`)}
    ${field("Severity", `<select id="efSev">${["P1", "P2", "P3", "P4"].map(p => `<option${p === (pre.sev || "P3") ? " selected" : ""}>${p}</option>`).join("")}</select>`)}
    ${field("Country", `<select id="efCountry"><option value="">Choose…</option>${siteCountries().map(c => `<option${c === country ? " selected" : ""}>${esc(c)}</option>`).join("")}</select>`)}
    ${field("Event notice", `<select id="efRen"><option value="assess">Under assessment — timers wait for it</option><option value="issued">Issued — start the update timers now</option><option value="none">Not required</option></select>`)}
    <div class="fld wide">Affected sites <span id="efCount"></span><div class="filters" style="padding:4px 0"><input class="search" id="efFilter" placeholder="Filter by code or city"><label class="chk"><input type="checkbox" id="efAll"> all countries</label><button class="linkbtn" id="efNone" type="button">Clear</button></div><div class="checks" id="efSites" style="max-height:200px;overflow:auto"></div></div>
    ${field("Latitude", `<input id="efLat" type="number" step="any" value="${pre.lat ?? (sig && isFinite(sig.lat) ? sig.lat : "")}">`)}${field("Longitude", `<input id="efLon" type="number" step="any" value="${pre.lon ?? (sig && isFinite(sig.lon) ? sig.lon : "")}">`)}
    <div class="fld" style="justify-content:flex-end">${mapReady() ? `<button class="btn small" id="efPick" type="button">Pick on the map</button>` : ""}</div></div>
    <p class="help" id="efSop"></p>`;
  dialog(opts.title || "Escalate", body, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="efGo">Open escalation</button>`, { wide: true });
  const drawSites = () => { const q = $("#efFilter").value.trim().toLowerCase(), c = $("#efCountry").value;
    const list = SITES.filter(s => (isLive(s) || isOffice(s) || chosen.has(s.code)) && (showAll || !c || s.country === c || chosen.has(s.code)) && (!q || (s.code + " " + s.city).toLowerCase().includes(q))).slice(0, 400);
    $("#efSites").innerHTML = list.map(s => `<label class="chk"><input type="checkbox" value="${esc(s.code)}"${chosen.has(s.code) ? " checked" : ""}> <span><b>${esc(s.code)}</b> <span class="help">${esc(s.city || "")}${isOffice(s) ? " · office" : ""}</span></span></label>`).join("") || `<div class="help">No sites match.</div>`;
    $("#efCount").textContent = `— ${chosen.size} selected`; };
  const sop = () => { const k = $("#efCat").value, c = cadenceFor(k), t = SOP_REF[k] || {};
    $("#efSop").innerHTML = `${k === "protest" ? "Updates as it develops; no countdown. " : t.ttp ? `Updates: PSOC Manager every ${c.m} h, Intel / SLT every ${c.i} h (${esc(ttpName())}). ` : ""}<button class="linkbtn" type="button" id="efSopBtn">${esc(t.label || "")} procedure</button>`; $("#efSopBtn").onclick = () => sopDialog($("#efCat").value); };
  drawSites(); sop(); $("#efCat").onchange = sop; $("#efCountry").onchange = drawSites; $("#efFilter").oninput = drawSites; $("#efAll").onchange = e => { showAll = e.target.checked; drawSites(); };
  $("#efNone").onclick = () => { chosen.clear(); drawSites(); }; $("#efSites").onchange = e => { const i = e.target; if (i.checked) chosen.add(i.value); else chosen.delete(i.value); $("#efCount").textContent = `— ${chosen.size} selected`; };
  if ($("#efPick")) $("#efPick").onclick = async () => { const d = $("#scrim"); d.hidden = true; toast("Click the map where the event is", "", null, null, 4000); const ll = await pickPoint(); d.hidden = false; if (ll){ $("#efLat").value = ll.lat.toFixed(5); $("#efLon").value = ll.lng.toFixed(5); } };
  $("#efGo").onclick = () => { const title = $("#efTitle").value.trim(); if (!title){ $("#efTitle").focus(); return; } const lat = parseFloat($("#efLat").value), lon = parseFloat($("#efLon").value);
    const ev = createEvent({ title, cat: $("#efCat").value, sev: $("#efSev").value, country: $("#efCountry").value, sites: [...chosen], lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null, ren: $("#efRen").value, signals: sig ? [sig.key] : [], from: opts.item ? opts.item.id : null });
    if (opts.item) decide(opts.item, "escalate", { eventId: ev.id }); closeDialog(); toast("Escalation opened", ev.title, 2); go("events", { eventSel: ev.id }); }; }

export function sopDialog(cat){ const s = SOP_REF[cat] || {};
  dialog((s.label || cat) + (s.ttp ? " — " + ttpName() : " — procedure"), `<div class="ttp-body">${s.html || "No procedure recorded for this category."}</div>
    <p class="help">${s.ttp ? `From ${esc(TTP.file || "the PULSE file")}${TTP.meta.date ? ", dated " + esc(TTP.meta.date) : ""}. Kept in this browser only.` : "This is a placeholder. Import a PULSE file under Sites to load your REN TTP; it stays in this browser."}</p>`, `<button class="btn" data-close>Close</button>`, { wide: true }); }

export function notifyComposer(sig, opts = {}){ const ds = opts.drafts || draftsForSignal(sig);
  dialog(opts.title || "Notify", `<p class="help">Edit, then copy into the channel or open it in your email app. Nothing is sent from the console.</p>${ds.map((d, i) => `<details class="draft"${i ? "" : " open"}><summary>${esc(d.label)}<span class="s">${d.to ? "to " + esc(d.to) : ""}</span></summary>
      <textarea data-dtext="${i}">${esc(d.text)}</textarea><div class="actions"><button class="btn small" data-dcopy="${i}">Copy</button>${d.to !== undefined ? `<a class="btn small" style="text-decoration:none" data-dmail="${i}" href="#">Email…</a>` : ""}${opts.onSent ? `<button class="btn small" data-dsent="${i}">Mark as sent</button>` : ""}</div></details>`).join("")}`,
    `<button class="btn" data-close>Close</button>${opts.item ? `<button class="btn primary" id="ncDone">Mark the item notified</button>` : ""}`, { wide: true });
  const text = i => $(`[data-dtext="${i}"]`).value;
  $("#dialog").onclick = async e => { const t = e.target.closest("[data-dcopy],[data-dmail],[data-dsent]"); if (!t) return; const i = +(t.dataset.dcopy ?? t.dataset.dmail ?? t.dataset.dsent), d = Object.assign({}, ds[i], { text: text(i) });
    if (t.dataset.dcopy != null){ const ok = await copyText(d.text, asHtml(d.text)); t.textContent = ok ? "Copied" : "Copy failed"; audit("Copied message", d.label, sig ? sig.title : ""); }
    if (t.dataset.dmail != null){ e.preventDefault(); location.href = mailto(d); audit("Opened email", d.label, sig ? sig.title : ""); }
    if (t.dataset.dsent != null && opts.onSent){ opts.onSent(d); t.textContent = "Recorded"; t.disabled = true; } };
  if ($("#ncDone")) $("#ncDone").onclick = () => { decide(opts.item, "notify"); closeDialog(); toast("Marked notified", opts.item.title, 0); }; }
