// REPORTS — the shift handover and the SITREP are written from the live picture; edit, copy, print or save.
import { $, esc, sgt, dayLabel, copyText, download, ago } from "../core.js";
import { CFG } from "../config.js";
import { STATE, REPORTS, openEvents, openItems, timers, REN, SOP_REF, saveReport, deleteReport, decided, CITIES, siteBy, who, auditLog, INBOX, dueAt, audit } from "../model.js";
import { READINGS } from "../sources/agencies.js";
import { QARCH } from "../sources/quakes.js";
import { travelData, CC_NAME } from "../sources/people.js";
import { UI, saveUI } from "./state.js";
import { toast, confirmBox } from "./kit.js";

const catLabel = c => (SOP_REF[c] || {}).label || c;
const shiftStart = () => Date.now() - 12 * 3600e3;
export function handover(){ const now = Date.now(), L = [], open = openEvents(), items = openItems(), since = shiftStart();
  L.push(`PSOC SHIFT HANDOVER — ${dayLabel(now)}, ${sgt(now).split(", ").pop()} SGT`, `Outgoing officer: ${who()}`, "");
  L.push(`OPEN ESCALATIONS (${open.length})`); if (!open.length) L.push("  None.");
  open.forEach(ev => { const t = timers(ev), w = Object.values(ev.welfare || {});
    L.push(`  • [${ev.sev}] ${ev.title} — ${catLabel(ev.cat)}${ev.country ? ", " + ev.country : ""}`, `    Event notice ${REN[ev.ren].toLowerCase()}; ${t.state === "awaiting" ? "timers waiting for the notice" : t.state === "immediate" ? "update as it develops" : t.state === "overdue" ? "UPDATE OVERDUE" : `next update ${sgt(now + Math.min(t.d12, t.d24))} SGT`}.`,
      ev.sites.length ? `    Sites: ${ev.sites.slice(0, 10).join(", ")}${ev.sites.length > 10 ? ` +${ev.sites.length - 10}` : ""}; welfare ${w.filter(x => x.status).length}/${ev.sites.length} checked${w.some(x => x.status === "impacted") ? ", IMPACT REPORTED" : ""}.` : "    No sites attached."); });
  L.push("", `WAITING FOR A DECISION (${items.length})`); if (!items.length) L.push("  Inbox clear."); items.forEach(i => L.push(`  • ${i.pri} ${i.title}${dueAt(i) < now ? " — LATE" : ""}`));
  const d = decided(since); L.push("", `DECIDED THIS SHIFT (${d.length})`); if (!d.length) L.push("  None."); d.slice(0, 25).forEach(i => L.push(`  • ${i.decision}: ${i.title}${i.reason ? " (" + i.reason + ")" : ""} — ${i.by}`));
  const hz = STATE.list.filter(s => s.tier >= 2 && (s.sites.length || s.cities.length) && s.kind !== "news"); L.push("", `HAZARDS AT MANAGER LEVEL OR ABOVE TOUCHING SITES (${hz.length})`); if (!hz.length) L.push("  None.");
  hz.slice(0, 20).forEach(s => L.push(`  • ${s.title}${s.sites.length && !/site\(s\)|sites/.test(s.title) ? ` — ${s.sites.length} site(s)` : ""}`));
  const q = QARCH.filter(x => x.t > since && (x.alarm || x.mag >= 5)); if (q.length){ L.push("", "EARTHQUAKES THIS SHIFT"); q.forEach(x => L.push(`  • M${x.mag.toFixed(1)} ${x.place} — nearest ${x.near} ${x.nearKm} km${x.alarm ? ", ALARM" : ""}`)); }
  const tc = (travelData().changes || []).filter(c => c.at > since); if (tc.length){ L.push("", "TRAVEL ADVISORY CHANGES"); tc.forEach(c => L.push(`  • ${CC_NAME[c.cc] || c.cc}: level ${c.from} → ${c.to}`)); }
  Object.values(READINGS).forEach(r => { if (r.rows && r.rows.length){ L.push("", r.name.toUpperCase() + " READINGS"); r.rows.forEach(x => L.push(`  • ${x[0]}: ${x[1]} (${x[2]})`)); } });
  const down = Object.entries(STATE.feeds).filter(([, f]) => f.ok === false).map(([k]) => k); if (down.length) L.push("", `SOURCES NOT RESPONDING: ${down.join(", ")}`);
  L.push("", "ACTIONS FOR THE INCOMING SHIFT"); const acts = open.filter(e => ["overdue", "duesoon"].includes(timers(e).state)).map(e => `  • ${timers(e).state === "overdue" ? "Send the overdue update" : "Update due within the hour"}: ${e.title}`).concat(items.filter(i => dueAt(i) < now).map(i => `  • Decide: ${i.title}`));
  L.push(...(acts.length ? acts : ["  None outstanding."])); return L.join("\n"); }
export function sitrep(){ const now = Date.now(), open = openEvents(); const L = ["PSOC APAC | Daily Situation Report", dayLabel(now) + " " + new Date(now).getFullYear(), "", "Executive summary",
  `This report from the Physical Security Operations Center (PSOC) gives an overview of current events in Asia-Pacific for situational awareness. ${open.length ? `${open.length} event${open.length === 1 ? " is" : "s are"} being tracked.` : "No events are being tracked."}`, `Assigned PSOC officer: ${who()}`, "", "Regional events"];
  open.forEach((ev, i) => { const near = ev.sites.slice(0, 5).map(c => { const s = siteBy(c); return s ? `${c} | ${s.cls} | ${s.status}` : c; });
    L.push("", `EVENT ${i + 1} | STATUS: Active`, `Country: ${ev.country || "(confirm)"}`, `Event category: ${catLabel(ev.cat)}`, `Severity: ${ev.sev}`, `Time identified: ${sgt(ev.created)} SGT`, `Description: ${ev.title}. ${ev.log.filter(l => l.kind === "note").slice(-2).map(l => l.m).join(" ")}`.trim(),
      "Closest sites (site | class | status):", ...(near.length ? near.map(x => "  " + x) : ["  (confirm)"]), `Event notice: ${REN[ev.ren]}`); });
  if (!open.length) L.push("No active events.");
  const watch = STATE.list.filter(s => s.tier === 1 && (s.sites.length || s.cities.length) && ["warning", "cyclone", "volcano", "unrest", "disaster"].includes(s.kind)).slice(0, 10);
  if (watch.length){ L.push("", "Under observation"); watch.forEach(s => L.push(`  • ${s.title}`)); } L.push("", "Data source strength: official agency feeds and monitored open sources (confirm per event)."); return L.join("\n"); }

async function claudeDraft(kind, base){ const key = CFG.keys.claude; if (!key) throw new Error("add an Anthropic API key in Settings first");
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1800, system: "You edit security-operations reports for a PSOC. Keep every fact exactly as given; never invent events, sites, times or figures. Improve clarity and order, keep the template headings, write (confirm) where information is missing. Output only the report.", messages: [{ role: "user", content: `Tighten this ${kind} for sending:\n\n${base}` }] }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(r.status === 401 ? "the API key was rejected" : (j.error && j.error.message) || "HTTP " + r.status); audit("Drafted with Claude", kind); return (j.content || []).map(b => b.text || "").join("").trim(); }

const LIVE = { handover: ["Shift handover", handover, "Shift handover"], sitrep: ["Situation report (SITREP)", sitrep, "SITREP"] };
export function render(p){ const sel = UI.reportSel || "handover", live = LIVE[sel], saved = !live && REPORTS.find(r => r.id === sel);
  const text = live ? (UI.reportDraft && UI.reportDraft.k === sel ? UI.reportDraft.text : live[1]()) : saved ? saved.text : "";
  p.innerHTML = `<div class="doc"><nav aria-label="Reports"><h4>Write from the live picture</h4>${Object.entries(LIVE).map(([k, v]) => `<button data-rsel="${k}" aria-current="${sel === k}">${esc(v[0])}<small>${k === "handover" ? "open escalations, decisions, hazards" : "regional events for leadership"}</small></button>`).join("")}
      <h4>Saved (${REPORTS.length})</h4>${REPORTS.slice(0, 80).map(r => `<button data-rsel="${esc(r.id)}" aria-current="${sel === r.id}">${esc(r.title)}<small>${esc(r.type)} · ${esc(r.by)} · ${esc(ago(r.at))}</small></button>`).join("") || `<p class="help" style="padding:0 10px">Saved handovers, SITREPs and close-out reports appear here.</p>`}</nav>
    <article>${live || saved ? `<h2>${esc(live ? live[0] : saved.title)}</h2><p class="help">${live ? `Written ${esc(sgt(Date.now()))} SGT from what the console holds. Edit freely; “Rewrite from live data” starts again.` : `${esc(saved.type)} saved by ${esc(saved.by)} ${esc(sgt(saved.at))} SGT.`}</p>
      <div class="actions" style="margin:8px 0 10px"><button class="btn primary" data-rcopy>Copy</button>${live ? `<button class="btn" data-rsave>Save to reports</button><button class="btn" data-rfresh>Rewrite from live data</button>${CFG.keys.claude ? `<button class="btn" data-rclaude>Tighten with Claude</button>` : ""}` : `<button class="btn danger" data-rdel>Delete</button>`}<button class="btn" data-rdl>Download</button><button class="btn" data-rprint>Print</button></div>
      <textarea class="paper" id="rtext" aria-label="Report text">${esc(text)}</textarea>` : `<div class="empty">Choose a report.</div>`}</article></div>`; }
export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-rsel],[data-rcopy],[data-rsave],[data-rfresh],[data-rdl],[data-rprint],[data-rdel],[data-rclaude]"); if (!t) return; const d = t.dataset, text = () => ($("#rtext") || {}).value || "", sel = UI.reportSel || "handover", live = LIVE[sel];
    if (d.rsel){ UI.reportSel = d.rsel; UI.reportDraft = null; saveUI(); rerender(); return; }
    if (d.rcopy !== undefined){ const ok = await copyText(text()); t.textContent = ok ? "Copied" : "Copy failed"; audit("Copied report", live ? live[0] : sel); return; }
    if (d.rsave !== undefined){ const r = saveReport({ type: live[2], title: `${live[0]} — ${sgt(Date.now())}`, text: text() }); UI.reportDraft = null; UI.reportSel = r.id; saveUI(); toast("Saved to reports", r.title, 0); rerender(); return; }
    if (d.rfresh !== undefined){ UI.reportDraft = null; saveUI(); rerender(); return; }
    if (d.rdl !== undefined){ download(`${(live ? live[0] : "report").replace(/\W+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 16).replace(":", "")}.txt`, text()); return; }
    if (d.rprint !== undefined){ window.print(); return; }
    if (d.rdel !== undefined){ if (await confirmBox("Delete this report?", "It is removed from this browser.", "Delete")){ deleteReport(sel); UI.reportSel = "handover"; saveUI(); rerender(); } return; }
    if (d.rclaude !== undefined){ t.disabled = true; t.textContent = "Working…"; try{ const out = await claudeDraft(live[0], text()); UI.reportDraft = { k: sel, text: out }; saveUI(); rerender(); }catch(err){ toast("Claude could not help", err.message, 2); t.disabled = false; t.textContent = "Tighten with Claude"; } } };
  p.oninput = e => { if (e.target.id === "rtext" && LIVE[UI.reportSel || "handover"]){ UI.reportDraft = { k: UI.reportSel || "handover", text: e.target.value }; saveUI(); } }; }
