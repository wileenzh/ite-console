// INBOX — only what needs a decision, the one due soonest first. Four decisions, one key each.
import { $, esc, sgt, ago, save } from "../core.js";
import { INBOX, PRI, KINDS, openItems, dueAt, decide, signalBy, addManualItem } from "../model.js";
import { UI, saveUI, go } from "./state.js";
import { priChip, dueText, when, dialog, closeDialog, toast, field, tierWord } from "./kit.js";
import { escalateForm, notifyComposer } from "./forms.js";

export const count = () => { const o = openItems(), now = Date.now(); return { n: o.length, late: o.filter(i => dueAt(i) < now).length, top: o[0] }; };
const REASONS = ["Not near our sites", "No impact expected", "Already covered by an open escalation", "Duplicate", "Source error or false alarm"];

export function render(p){ const items = openItems(), now = Date.now(), done = INBOX.filter(i => i.status !== "open").sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0)).slice(0, 40);
  if (UI.inboxSel && !INBOX.some(i => i.id === UI.inboxSel && i.status !== "closed")) UI.inboxSel = items[0] ? items[0].id : null;   // a decided item hands over to the next one
  if (!UI.inboxSel && items[0]) UI.inboxSel = items[0].id;
  const late = items.filter(i => dueAt(i) < now).length, mon = INBOX.filter(i => i.status === "monitor");
  p.innerHTML = `<div class="ph"><h1>Inbox</h1><button class="btn small" data-iadd>Add an item</button>
      <div class="sum">${items.length ? `${items.length} to decide${late ? `, <span class="late">${late} late</span>` : ""}. Decide each one: escalate, notify, monitor or dismiss. <span class="keyhint">Keys: <span class="kbd">J</span>/<span class="kbd">K</span> move, <span class="kbd">E</span> <span class="kbd">N</span> <span class="kbd">M</span> <span class="kbd">D</span> decide.</span>` : "Nothing waiting for a decision."}${mon.length ? ` ${mon.length} being monitored.` : ""}</div></div>
    <div class="scroll" id="ilist">${items.map(i => itemHtml(i, now)).join("") || `<div class="empty"><b>Inbox clear.</b>New items arrive here when a source reports something that touches our sites at manager level or above.</div>`}
      ${mon.length ? `<div class="region">Monitoring</div>${mon.map(i => `<button class="row" data-isel="${esc(i.id)}" aria-selected="${UI.inboxSel === i.id}"><span class="bar"></span><span><span class="tt">${esc(i.title)}</span><div class="mt">Comes back at ${esc(sgt(i.until))} SGT if the source still reports it</div></span><span class="rt">${priChip(i.pri)}</span></button>`).join("")}` : ""}
      <div class="region"><button class="linkbtn" data-idone>${UI.inboxShowDone ? "Hide" : "Show"} recent decisions (${done.length})</button></div>
      ${UI.inboxShowDone ? done.map(i => `<div class="row" style="cursor:default"><span class="bar"></span><span><span class="tt">${esc(i.title)}</span><div class="mt">${esc(i.decision || i.status)}${i.reason ? " — " + esc(i.reason) : ""} · ${esc(i.by || "")} · ${when(i.decidedAt)}</div></span><span class="rt">${i.status === "closed" && i.decision !== "escalate" ? `<button class="linkbtn" data-ireopen="${esc(i.id)}">Reopen</button>` : i.eventId ? `<button class="linkbtn" data-iev="${esc(i.eventId)}">Escalation</button>` : ""}</span></div>`).join("") : ""}</div>`;
  const s = $(`[data-isel="${CSS.escape(UI.inboxSel || "")}"]`, p); if (s && s.scrollIntoView) s.scrollIntoView({ block: "nearest" }); }
function itemHtml(i, now){ const sig = i.sigKey && signalBy(i.sigKey), on = UI.inboxSel === i.id, due = dueAt(i) - now;
  const head = `<button class="row" data-isel="${esc(i.id)}" aria-selected="${on}"><span class="bar t${PRI[i.pri].tier}"></span><span><span class="tt">${priChip(i.pri)}${esc(i.title)}</span>
    <div class="mt">${esc((KINDS[i.kind] || { label: "Manual" }).label)} · raised ${when(i.createdAt)}${sig && sig.sites.length ? ` · ${sig.sites.length} site${sig.sites.length === 1 ? "" : "s"}` : ""}</div></span><span class="rt"><b>${dueText(due)}</b></span></button>`;
  if (!on) return head;
  const sites = sig ? sig.sites.slice(0, 8).map(x => `${esc(x.code)}${x.km ? " " + Math.round(x.km) + " km" : ""}${x.mmi ? " MMI " + x.mmi : x.level ? " " + esc(x.level) : ""}`).join(", ") : "";
  return head + `<div class="detail" style="padding:6px 12px 14px 14px;border-bottom:1px solid var(--rule)">
    ${sig ? `<p class="prose">${esc(sig.text || "")}</p>${sites ? `<p class="help">Sites: ${sites}${sig.sites.length > 8 ? ` and ${sig.sites.length - 8} more` : ""}</p>` : ""}<p class="help">${tierWord(sig.tier)} · ${esc(sig.area || sig.cities.join(", "))} · <button class="linkbtn" data-iwatch="${esc(sig.key)}">Full details</button></p>`
      : i.text ? `<p class="prose">${esc(i.text)}</p>` : `<p class="help">${i.sigKey ? "The source no longer reports this; it may have ended." : "Added by hand."}</p>`}
    <div class="decide"><button class="btn primary" data-idec="escalate"><span>Escalate <kbd>E</kbd></span><small>open an escalation with timers</small></button>
      <button class="btn" data-idec="notify"><span>Notify <kbd>N</kbd></span><small>send a message, no escalation</small></button>
      <button class="btn" data-idec="monitor"><span>Monitor <kbd>M</kbd></span><small>bring it back in 4 hours</small></button>
      <button class="btn" data-idec="dismiss"><span>Dismiss <kbd>D</kbd></span><small>no action needed</small></button></div>
    ${i.log.length > 1 ? `<p class="help">${i.log.slice(-3).map(l => `${esc(sgt(l.t))} ${esc(l.m)}`).join(" · ")}</p>` : ""}</div>`; }

export function act(decision, item){ item = item || INBOX.find(i => i.id === UI.inboxSel && i.status === "open"); if (!item) return; const sig = item.sigKey && signalBy(item.sigKey);
  if (decision === "escalate") return escalateForm({ signal: sig, title: item.title, sev: item.pri === "P4" ? "P3" : item.pri }, { item });
  if (decision === "notify"){ if (sig) return notifyComposer(sig, { item, title: "Notify — " + item.title }); decide(item, "notify"); return; }
  if (decision === "monitor") return dialog("Monitor", `<p class="prose">${esc(item.title)}</p><p class="help">It leaves the Inbox and comes back after this time if the source still reports it.</p><div class="actions">${[1, 4, 12, 24].map(h => `<button class="btn${h === 4 ? " primary" : ""}" data-mh="${h}">${h} hour${h > 1 ? "s" : ""}</button>`).join("")}</div>`, "", {});
  if (decision === "dismiss") return dialog("Dismiss", `<p class="prose">${esc(item.title)}</p><div class="actions" style="flex-direction:column;align-items:stretch">${REASONS.map(r => `<button class="btn" data-dr="${esc(r)}">${esc(r)}</button>`).join("")}</div>${field("Or another reason", `<input id="drOther" placeholder="Reason">`)}`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="drGo">Dismiss</button>`); }
document.addEventListener("click", e => { const t = e.target.closest("#dialog [data-mh], #dialog [data-dr], #dialog #drGo"); if (!t) return; const item = INBOX.find(i => i.id === UI.inboxSel); if (!item) return;
  const list = openItems(), at = list.findIndex(i => i.id === item.id), nxt = list[at + 1] || list[at - 1]; UI.inboxSel = nxt ? nxt.id : null; saveUI();   // move on to the next decision
  if (t.dataset.mh){ decide(item, "monitor", { hours: +t.dataset.mh }); closeDialog(); toast("Monitoring for " + t.dataset.mh + " h", item.title, 1); }
  else { const r = t.dataset.dr || ($("#drOther") || {}).value || ""; decide(item, "dismiss", { reason: r.trim() }); closeDialog(); toast("Dismissed", item.title); } });

export function mapSpec(){ const items = openItems(), sel = INBOX.find(i => i.id === UI.inboxSel), sigs = items.map(i => i.sigKey && signalBy(i.sigKey)).filter(Boolean), s = sel && sel.sigKey && signalBy(sel.sigKey);
  return { signals: s && !sigs.includes(s) ? sigs.concat(s) : sigs, selected: s ? s.key : null, hitSites: s ? s.sites.map(x => x.code) : [], fitKey: s ? "i:" + s.key : "", onPick: key => { const it = items.find(i => i.sigKey === key); if (it){ UI.inboxSel = it.id; saveUI(); } } }; }
export function keys(e){ const items = openItems(), i = items.findIndex(x => x.id === UI.inboxSel);
  if (e.key === "j" || e.key === "ArrowDown"){ const n = items[Math.min(items.length - 1, i + 1)]; if (n){ UI.inboxSel = n.id; saveUI(); return true; } }
  if (e.key === "k" || e.key === "ArrowUp"){ const n = items[Math.max(0, i - 1)]; if (n){ UI.inboxSel = n.id; saveUI(); return true; } }
  const m = { e: "escalate", n: "notify", m: "monitor", d: "dismiss" }[e.key]; if (m && i >= 0){ act(m); return "handled"; } return false; }
export function bind(p, rerender){ p.onclick = e => { const t = e.target.closest("[data-isel],[data-idec],[data-iadd],[data-idone],[data-ireopen],[data-iwatch],[data-iev]"); if (!t) return; const d = t.dataset;
  if (d.isel){ UI.inboxSel = d.isel; saveUI(); rerender(); return; } if (d.idec){ act(d.idec); return; } if (d.idone !== undefined){ UI.inboxShowDone = !UI.inboxShowDone; saveUI(); rerender(); return; }
  if (d.iwatch){ go("watch", { watchSel: d.iwatch, watchCity: null }); return; } if (d.iev){ go("events", { eventSel: d.iev }); return; }
  if (d.ireopen){ const it = INBOX.find(x => x.id === d.ireopen); if (it){ it.status = "open"; it.createdAt = Date.now(); it.log.push({ t: Date.now(), m: "Reopened" }); decideSave(); UI.inboxSel = it.id; rerender(); } return; }
  if (d.iadd !== undefined){ dialog("Add an item to the Inbox", `<div class="form">${field("What needs a decision", `<input id="maT" placeholder="e.g. Call from site security: power outage at XSG11">`, true)}${field("Priority", `<select id="maP"><option>P1</option><option>P2</option><option selected>P3</option><option>P4</option></select>`)}${field("Details", `<textarea id="maX" rows="3"></textarea>`, true)}</div>`,
      `<button class="btn" data-close>Cancel</button><button class="btn primary" id="maGo">Add</button>`); $("#maGo").onclick = () => { const t2 = $("#maT").value.trim(); if (!t2) return; const it = addManualItem({ title: t2, pri: $("#maP").value, text: $("#maX").value.trim() }); UI.inboxSel = it.id; closeDialog(); }; } }; }
const decideSave = () => save("inbox", INBOX);
