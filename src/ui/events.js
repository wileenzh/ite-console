// EVENTS — every escalation is one record: its update timers, event notice, who has been told, welfare at each site, and the log.
import { $, esc, sgt, ago, dur, copyText } from "../core.js";
import { EVENTS, SOP_REF, REN, IMMEDIATE, openEvents, timers, setRen, resetTimer, setWelfare, closeEvent, reopenEvent, eventLog, saveEvents, siteBy, contactFor, signalBy, saveReport, audit, PRI } from "../model.js";
import { UI, saveUI, go } from "./state.js";
import { priChip, when, dialog, closeDialog, toast, field, confirmBox } from "./kit.js";
import { escalateForm, notifyComposer, sopDialog } from "./forms.js";
import { draftsForEvent } from "./drafts.js";

export const count = () => { const o = openEvents(); return { n: o.length, over: o.filter(e => timers(e).state === "overdue").length, soon: o.filter(e => timers(e).state === "duesoon").length }; };
const catLabel = c => (SOP_REF[c] || {}).label || c;
export function timerText(ev){ const t = timers(ev);
  if (t.state === "closed") return `closed ${esc(ago(ev.closed && ev.closed.at))}`; if (t.state === "immediate") return "update as it develops"; if (t.state === "awaiting") return "timers start when the event notice is issued";
  const next = Math.min(t.d12, t.d24), which = t.d12 <= t.d24 ? "Manager update" : "Intel / SLT update";
  return next < 0 ? `<span class="late">${which} overdue ${esc(dur(-next))}</span>` : `${which} due in ${t.state === "duesoon" ? `<span class="soon">${esc(dur(next))}</span>` : esc(dur(next))}`; }

export function render(p){ const ev = UI.eventSel && EVENTS.find(e => e.id === UI.eventSel); if (ev) return p.innerHTML = detail(ev);
  const open = openEvents(), closed = EVENTS.filter(e => e.status === "closed").sort((a, b) => b.closed.at - a.closed.at).slice(0, 50), c = count();
  p.innerHTML = `<div class="ph"><h1>Events</h1><button class="btn small primary" data-enew>New escalation</button>
      <div class="sum">${open.length ? `${open.length} open${c.over ? `, <span class="late">${c.over} with an update overdue</span>` : ""}${c.soon ? `, <span class="soon">${c.soon} due within the hour</span>` : ""}. Most urgent first.` : "No open escalations."}</div></div>
    <div class="scroll">${open.map(rowHtml).join("") || `<div class="empty"><b>No open escalations.</b>Escalate from the Inbox, or start one with “New escalation”.</div>`}
      <div class="region"><button class="linkbtn" data-eclosed>${UI.eventShowClosed ? "Hide" : "Show"} closed (${closed.length})</button></div>${UI.eventShowClosed ? closed.map(rowHtml).join("") : ""}</div>`; }
function rowHtml(ev){ const t = timers(ev), w = Object.values(ev.welfare || {}), tier = t.state === "overdue" ? 3 : t.state === "duesoon" ? 2 : ev.status === "closed" ? 0 : PRI[ev.sev].tier;
  return `<button class="row" data-esel="${esc(ev.id)}"><span class="bar t${tier}"></span><span><span class="tt">${priChip(ev.sev)}${esc(ev.title)}</span>
    <div class="mt">${esc(catLabel(ev.cat))}${ev.country ? " · " + esc(ev.country) : ""} · event notice ${esc(REN[ev.ren].toLowerCase())} · opened ${when(ev.created)}</div></span>
    <span class="rt"><b>${timerText(ev)}</b>${ev.sites.length ? `${ev.sites.length} site${ev.sites.length === 1 ? "" : "s"}${w.length ? `, ${w.length} checked` : ""}` : ""}</span></button>`; }

function gauge(left, total){ return Math.max(0, Math.min(100, (left / total) * 100)).toFixed(0); }
function detail(ev){ const t = timers(ev), closed = ev.status === "closed", sig = (ev.signals || []).map(signalBy).filter(Boolean)[0];
  const tm = (label, d, st, total, which) => `<div class="timer ${st}"><div class="l">${label}</div><div class="v">${d < 0 ? "overdue " + dur(-d) : dur(d)}</div><div class="help">${d < 0 ? "was due" : "due"} ${esc(sgt(Date.now() + d))} SGT</div><div class="gauge"><i style="width:${gauge(d, total)}%"></i></div><button class="btn small" data-etimer="${which}">${label.split(" ")[0] === "PSOC" ? "Manager update sent" : "Intel / SLT update sent"}</button></div>`;
  const welfare = ev.sites.map(code => { const s = siteBy(code) || { code }, c = contactFor(s) || {}, w = ev.welfare[code] || {};
    return `<tr${w.status === "impacted" ? ` class="hot"` : ""}><td><button class="linkbtn" data-site="${esc(code)}">${esc(code)}</button><div class="help">${esc(s.city || "")}</div></td><td>${c.socPhone ? `<a href="tel:${esc(String(c.socPhone).replace(/[^\d+]/g, ""))}">${esc(c.socPhone)}</a>` : `<span class="help">no number</span>`}${c.siteSecurityMgr ? `<div class="help">${esc(c.siteSecurityMgr)}</div>` : ""}</td>
      <td><select class="wsel" data-ewel="${esc(code)}"${closed ? " disabled" : ""}>${[["", "Not checked"], ["safe", "Safe, no impact"], ["impacted", "Impacted"], ["noanswer", "No answer"]].map(([v, l]) => `<option value="${v}"${(w.status || "") === v ? " selected" : ""}>${l}</option>`).join("")}</select>${w.at ? `<div class="help">${esc(w.by)} ${esc(ago(w.at))}${w.note ? " — " + esc(w.note) : ""}</div>` : ""}</td></tr>`; }).join("");
  const wv = Object.values(ev.welfare || {}), comms = (ev.comms || []).slice().reverse();
  return `<div class="detail"><button class="back" data-eback>All events</button>
    <h2>${priChip(ev.sev)}${esc(ev.title)}</h2><p class="help">${esc(catLabel(ev.cat))}${ev.country ? " · " + esc(ev.country) : ""} · opened ${esc(sgt(ev.created))} SGT · <button class="linkbtn" data-esop>SOP</button> · <button class="linkbtn" data-eedit>Edit</button>${sig ? ` · <button class="linkbtn" data-ewatch="${esc(sig.key)}">Source report</button>` : ""}</p>
    ${closed ? `<p class="prose"><b>Closed</b> by ${esc(ev.closed.by)} ${esc(sgt(ev.closed.at))} SGT. ${esc(ev.closed.summary || "")}</p>` : `
    <div class="sec"><h3>Updates</h3>${t.state === "immediate" ? `<p class="help">Civil unrest is updated as it develops; there is no countdown.</p><button class="btn small" data-etimer="both">Update sent</button>`
      : t.state === "awaiting" ? `<p class="help">The 12-hour and 24-hour update timers start when the event notice is issued, so nothing counts down while you draft.</p>`
      : `<div class="timers">${tm("PSOC Manager update, every 12 h", t.d12, t.s12, 12 * 3600e3, "12")}${tm("Intel / SLT update, every 24 h", t.d24, t.s24, 24 * 3600e3, "24")}</div>`}
      <div class="ren">Event notice <div class="seg">${Object.entries(REN).map(([k, l]) => `<button data-eren="${k}" aria-pressed="${ev.ren === k}">${esc(l)}</button>`).join("")}</div></div></div>`}
    <div class="sec"><h3>Notify<span class="r">${comms.length ? `${comms.length} sent` : ""}</span></h3>${!closed ? `<button class="btn small" data-enotify>Write the messages</button>` : ""}
      ${comms.length ? `<ul class="log" style="margin-top:8px">${comms.map(c => `<li><time>${esc(sgt(c.at))}</time><span>${esc(c.label)} — ${esc(c.by)}</span></li>`).join("")}</ul>` : `<p class="help">Leadership update, Intelligence Channel post and site stakeholder email, written from this event.</p>`}</div>
    <div class="sec"><h3>Sites and welfare<span class="r">${ev.sites.length ? `${wv.filter(w => w.status).length} of ${ev.sites.length} checked${wv.some(w => w.status === "impacted") ? ` · <span class="late">${wv.filter(w => w.status === "impacted").length} impacted</span>` : ""}` : ""}</span></h3>
      ${ev.sites.length ? `<table class="tbl"><tr><th>Site</th><th>SOC phone</th><th>Welfare</th></tr>${welfare}</table>` : `<p class="help">No sites on this escalation. <button class="linkbtn" data-eedit>Add sites</button></p>`}</div>
    <div class="sec"><h3>Log</h3><ul class="log">${ev.log.slice().reverse().map(l => `<li><time>${esc(sgt(l.t))}</time><span>${esc(l.m)}${l.by && l.by !== "system" ? ` <span class="help">— ${esc(l.by)}</span>` : ""}</span></li>`).join("")}</ul>
      ${!closed ? `<form class="note" data-enote><input placeholder="Add to the log" aria-label="Add to the log"><button class="btn small">Add</button></form>` : ""}</div>
    <div class="actions">${closed ? `<button class="btn" data-ereopen>Reopen</button>` : `<button class="btn" data-eclose>Close the escalation</button>`}</div></div>`; }

export function mapSpec(){ const ev = UI.eventSel && EVENTS.find(e => e.id === UI.eventSel), list = ev ? [ev] : openEvents();
  const pts = list.filter(e => isFinite(e.lat) && e.lat != null).map(e => ({ lat: e.lat, lon: e.lon, tier: PRI[e.sev].tier, label: e.title, on: ev === e, go: () => go("events", { eventSel: e.id }) }));
  const sigs = ev ? (ev.signals || []).map(signalBy).filter(Boolean) : [];
  return { points: pts, signals: sigs, selected: sigs[0] ? sigs[0].key : null, hitSites: list.flatMap(e => e.sites), fitKey: ev ? "e:" + ev.id : "", quietSites: false }; }

export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-esel],[data-eback],[data-enew],[data-eclosed],[data-etimer],[data-eren],[data-enotify],[data-eclose],[data-ereopen],[data-esop],[data-eedit],[data-site],[data-ewatch]"); if (!t) return; const d = t.dataset;
    if (d.esel){ UI.eventSel = d.esel; saveUI(); rerender(); p.scrollTop = 0; return; } if (d.eback !== undefined){ UI.eventSel = null; saveUI(); rerender(); return; }
    if (d.enew !== undefined){ escalateForm({}, { title: "New escalation" }); return; } if (d.eclosed !== undefined){ UI.eventShowClosed = !UI.eventShowClosed; saveUI(); rerender(); return; }
    if (d.site){ go("sites", { siteSel: d.site }); return; } if (d.ewatch){ go("watch", { watchSel: d.ewatch, watchCity: null }); return; }
    const ev = EVENTS.find(x => x.id === UI.eventSel); if (!ev) return;
    if (d.etimer){ resetTimer(ev, d.etimer === "both" ? null : d.etimer); toast(d.etimer === "12" ? "Manager update recorded" : d.etimer === "24" ? "Intel / SLT update recorded" : "Update recorded", "Timer reset.", 0); rerender(); return; }
    if (d.eren){ setRen(ev, d.eren); rerender(); return; } if (d.esop !== undefined){ sopDialog(ev.cat); return; }
    if (d.enotify !== undefined){ ev.firstSignal = (ev.signals || []).map(signalBy).filter(Boolean)[0]; notifyComposer(null, { title: "Notify — " + ev.title, drafts: draftsForEvent(ev),
        onSent: dr => { ev.comms = (ev.comms || []).concat([{ at: Date.now(), by: (STATE_who()), label: dr.label }]); eventLog(ev, dr.label + " sent."); if (/leadership/i.test(dr.label) && timers(ev).state !== "awaiting") resetTimer(ev, "12"); rerender(); } }); return; }
    if (d.eedit !== undefined){ editEvent(ev, rerender); return; }
    if (d.eclose !== undefined){ dialog("Close the escalation", `<p class="prose">${esc(ev.title)}</p>${field("Close-out summary", `<textarea id="ecSum" rows="4" placeholder="What happened, impact to sites and people, what was done"></textarea>`, true)}<p class="help">A close-out report is saved to Reports.</p>`,
        `<button class="btn" data-close>Cancel</button><button class="btn primary" id="ecGo">Close it</button>`); $("#ecGo").onclick = () => { const sm = $("#ecSum").value.trim(); closeEvent(ev, sm); saveReport({ type: "Close-out", title: "Close-out — " + ev.title, text: closeOut(ev) }); closeDialog(); toast("Closed", "Close-out report saved to Reports.", 0); rerender(); }; return; }
    if (d.ereopen !== undefined){ reopenEvent(ev); rerender(); } };
  p.onchange = e => { const t = e.target; if (!t.dataset.ewel) return; const ev = EVENTS.find(x => x.id === UI.eventSel); if (!ev) return; if (!t.value){ delete ev.welfare[t.dataset.ewel]; saveEvents(); rerender(); return; }
    const code = t.dataset.ewel; if (t.value !== "impacted"){ setWelfare(ev, code, t.value); rerender(); return; }
    dialog("Impact at " + code, field("What is the impact?", `<textarea id="wiNote" rows="3" placeholder="People, power, access, damage — and who reported it"></textarea>`, true), `<button class="btn" data-close>Cancel</button><button class="btn primary" id="wiGo">Record impact</button>`, { onClose: rerender });
    $("#wiGo").onclick = () => { setWelfare(ev, code, "impacted", $("#wiNote").value.trim()); closeDialog(); }; };
  p.onsubmit = e => { if (!e.target.matches("[data-enote]")) return; e.preventDefault(); const i = e.target.querySelector("input"), v = i.value.trim(); if (!v) return; const ev = EVENTS.find(x => x.id === UI.eventSel); if (ev){ eventLog(ev, v, "note"); rerender(); } }; }
import { who as STATE_who } from "../model.js";
function editEvent(ev, rerender){ escalateForm({ title: ev.title, cat: ev.cat, sev: ev.sev, country: ev.country, sites: ev.sites, lat: ev.lat, lon: ev.lon }, { title: "Edit escalation" });
  const go2 = $("#efGo"); go2.textContent = "Save changes"; go2.onclick = () => { const lat = parseFloat($("#efLat").value), lon = parseFloat($("#efLon").value);
    Object.assign(ev, { title: $("#efTitle").value.trim() || ev.title, cat: $("#efCat").value, sev: $("#efSev").value, country: $("#efCountry").value, sites: [...$("#efSites").querySelectorAll("input:checked")].map(i => i.value).concat(ev.sites.filter(c => !$(`#efSites input[value="${CSS.escape(c)}"]`))), lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null });
    eventLog(ev, "Details edited."); audit("Escalation edited", ev.title); closeDialog(); rerender(); }; }
export function closeOut(ev){ const w = Object.entries(ev.welfare || {});
  return [`CLOSE-OUT — ${ev.title}`, `${catLabel(ev.cat)} · ${ev.sev} · ${ev.country || ""}`, `Opened ${sgt(ev.created)} SGT, closed ${sgt(ev.closed.at)} SGT by ${ev.closed.by}.`, "", "Summary", ev.closed.summary || "(none recorded)", "",
    `Sites (${ev.sites.length}): ${ev.sites.join(", ") || "none"}`, w.length ? "Welfare: " + w.map(([c, x]) => `${c} ${x.status}${x.note ? " (" + x.note + ")" : ""}`).join("; ") : "Welfare: none recorded", "",
    "Messages sent", ...(ev.comms || []).map(c => `- ${sgt(c.at)} ${c.label} (${c.by})`), "", "Log", ...ev.log.map(l => `- ${sgt(l.t)} ${l.m}${l.by && l.by !== "system" ? " — " + l.by : ""}`)].join("\n"); }
