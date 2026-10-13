// The frame: the workflow rail, the one next action, the map/pane split, sign-in, alarms, notifications, keys.
import { $, $$, esc, clock, dur, sgt, emit, on, save, load } from "../core.js";
import { CFG, saveCfg } from "../config.js";
import { STATE, signIn, signOut, who, openItems, dueAt, openEvents, timers, INBOX, signalBy, PRI } from "../model.js";
import { SOURCES, feedOf, runSource } from "../sources/index.js";
import { roman } from "../sources/quakes.js";
import { UI, saveUI, go } from "./state.js";
import { initMap, draw, invalidate, mapReady } from "./map.js";
import { toast, dialog, closeDialog } from "./kit.js";
import * as Watch from "./watch.js";
import * as Inbox from "./inbox.js";
import * as Events from "./events.js";
import * as Reports from "./reports.js";
import * as Sites from "./sites.js";
import * as Settings from "./settings.js";
import { mountTV } from "./tv.js";
import { openCopilot } from "./copilot.js";
import { openGuide } from "./guide.js";

const WS = { watch: ["Watch", Watch, true, "1"], inbox: ["Inbox", Inbox, true, "2"], events: ["Events", Events, true, "3"], reports: ["Reports", Reports, false, "4"], sites: ["Sites", Sites, true, "5"], settings: ["Settings", Settings, false, "6"] };

/* ---------- rail ---------- */
function rail(){ const ib = Inbox.count(), ev = Events.count(), w = Watch.count();
  const node = (n, tier) => `<span class="node${n ? "" : " zero"}${tier ? " t" + tier : ""}">${n}</span>`;
  const stage = (id, n, tier, flow, title) => `<button class="stage${flow ? " flow" : ""}" data-ws="${id}" aria-current="${UI.ws === id ? "page" : "false"}" title="${esc(title)}">${node(n, tier)}${esc(WS[id][0])}</button>`;
  $("#rail").innerHTML = `<div class="brand"><b>ITE</b><span>PSOC</span></div>
    ${stage("watch", w, w ? 1 : 0, true, `${w} reports touching our sites in the last hour`)}
    ${stage("inbox", ib.n, ib.late ? 3 : ib.n ? 2 : 0, true, `${ib.n} to decide${ib.late ? `, ${ib.late} late` : ""}`)}
    ${stage("events", ev.n, ev.over ? 3 : ev.soon ? 2 : ev.n ? 1 : 0, true, `${ev.n} open escalations${ev.over ? `, ${ev.over} overdue` : ""}`)}
    ${stage("reports", "", 0, true, "Handover, SITREP and saved reports").replace('<span class="node zero"></span>', `<span class="node zero">≡</span>`)}
    <div class="gap"></div>${stage("sites", "", 0, false, "Sites and contacts").replace('<span class="node zero"></span>', `<span class="node zero">◎</span>`)}${stage("settings", "", 0, false, "Settings").replace('<span class="node zero"></span>', `<span class="node zero">⚙</span>`)}
    <button class="stage" data-guide title="Guide (?)"><span class="node zero">?</span>Guide</button>
    <button class="me" data-me title="Signed in as ${esc(who())}">${esc(who().split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase())}</button>`; }

/* ---------- top bar: the single next thing to do ---------- */
function nextAction(){ const now = Date.now(), items = openItems(), evs = openEvents(), late = items.find(i => dueAt(i) < now), over = evs.find(e => timers(e).state === "overdue");
  if (late) return { lead: "Decide now", what: late.title, when: `late ${dur(now - dueAt(late))}`, tier: 3, go: () => go("inbox", { inboxSel: late.id }) };
  if (over){ const t = timers(over); return { lead: "Update overdue", what: over.title, when: `${dur(-Math.min(t.d12, t.d24))} late`, tier: 3, go: () => go("events", { eventSel: over.id }) }; }
  if (items[0]) return { lead: "Next decision", what: items[0].title, when: `due in ${dur(dueAt(items[0]) - now)}`, tier: PRI[items[0].pri].tier, go: () => go("inbox", { inboxSel: items[0].id }) };
  const soon = evs.find(e => timers(e).state === "duesoon"); if (soon){ const t = timers(soon); return { lead: "Update due", what: soon.title, when: `in ${dur(Math.min(t.d12, t.d24))}`, tier: 2, go: () => go("events", { eventSel: soon.id }) }; }
  const aw = evs.find(e => timers(e).state === "awaiting"); if (aw) return { lead: "Waiting", what: `Event notice for “${aw.title}”`, when: "", tier: 1, go: () => go("events", { eventSel: aw.id }) };
  return null; }
let NEXT = null;
function top(){ NEXT = nextAction(); const ok = SOURCES.filter(s => feedOf(s.id).ok).length, bad = SOURCES.filter(s => feedOf(s.id).ok === false).length;
  const q = feedOf("usgs"), qDown = q.failSince && Date.now() - q.failSince > 60e3;   // the earthquake alarm depends on this one feed
  $("#top").innerHTML = `${qDown ? `<button class="feeddown" data-qretry title="${esc(q.err || "")}"><b>Earthquake feed down since ${esc(sgt(q.failSince).split(", ").pop())} SGT</b> — the alarm cannot fire. Retry now</button>` : ""}${NEXT ? `<button class="next" data-next><span class="lead">${esc(NEXT.lead)}</span><span class="what">${esc(NEXT.what)}</span><span class="when tierword t${NEXT.tier}">${esc(NEXT.when)}</span></button>`
      : `<div class="next calm"><span class="lead">All clear</span><span class="what">Nothing is waiting for you. New decisions appear in the Inbox.</span></div>`}
    <div class="tools"><button class="chipbtn opt${bad ? " warn" : ""}" data-ws="settings" data-sec="sources" title="Data sources">${ok}/${SOURCES.length} sources</button>
      <button class="chipbtn${CFG.notify.sound ? " on" : ""}" data-sound title="The earthquake alarm siren">Siren ${CFG.notify.sound ? "on" : "off"}</button><button class="chipbtn opt" data-testalarm title="Show the alarm and sound the siren once, to check the volume">Test</button>
      <button class="chipbtn opt" data-ask title="Ask Claude about the live picture">Copilot</button><button class="chipbtn opt${CFG.notify.desktop ? " on" : ""}" data-desk title="Desktop notifications when the console is behind another window">Desktop alerts ${CFG.notify.desktop ? "on" : "off"}</button></div>
    <div class="clocks"><b id="clk">${clock(Date.now())}</b><small>SGT</small><small id="clku">${new Date().toISOString().slice(11, 16)} UTC</small></div>`; }

/* ---------- the work area ---------- */
let rendering = false;
export function render(){ if (rendering) return; rendering = true; try{
  const [, mod, hasMap] = WS[UI.ws] || WS.watch, pane = $("#pane"), a = document.activeElement, typing = a && pane.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
  $("#work").classList.toggle("full", !hasMap); rail(); top();
  if (!typing){ const st = pane.querySelector(".scroll"), sc = st ? st.scrollTop : 0, pst = pane.scrollTop; mod.render(pane); const st2 = pane.querySelector(".scroll"); if (st2) st2.scrollTop = sc; pane.scrollTop = pst; mod.bind(pane, render); }
  if (UI.ws !== "watch") mountTV(null);
  drawMap(); }
  catch(e){ console.error(e); $("#pane").innerHTML = `<div class="empty"><b>This view hit an error.</b>${esc(e.message)}<br>The rest of the console still works.</div>`; }
  finally{ rendering = false; } }
function drawMap(){ const [, mod, hasMap] = WS[UI.ws] || WS.watch;
  if (hasMap && mapReady()) draw(Object.assign({ onPick: key => { go("watch", { watchSel: key, watchCity: null }); }, onSite: code => go("sites", { siteSel: code }), ovKey: UI.ws + ":" + (UI.ws === "watch" ? UI.watchMode : "") }, mod.mapSpec ? mod.mapSpec() : {})); }
on("map", drawMap);
// live data refreshes every view except the Settings pages that hold no live data (they would lose what is being typed)
let raf = 0; const soon = () => { if (UI.ws === "settings" && UI.setSel && UI.setSel !== "sources"){ rail(); top(); return; } cancelAnimationFrame(raf); raf = requestAnimationFrame(render); };
on("data", soon); on("sites", soon); on("ttp", soon); on("feeds", () => { top(); if (UI.ws === "settings") soon(); });
on("route", () => { render(); invalidate(); $("#pane").scrollTop = 0; });

/* ---------- earthquake alarm ---------- */
let queue = [], audioCtx = null, siren = null;
function sirenOn(){ if (!CFG.notify.sound) return; try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const o = audioCtx.createOscillator(), g = audioCtx.createGain(), l = audioCtx.createOscillator(), lg = audioCtx.createGain();
  o.type = "sawtooth"; o.frequency.value = 700; l.frequency.value = 1.6; lg.gain.value = 260; l.connect(lg).connect(o.frequency); g.gain.value = .18; o.connect(g).connect(audioCtx.destination); o.start(); l.start(); siren = [o, l]; }catch(e){} }
function sirenOff(){ if (siren) siren.forEach(x => { try{ x.stop(); }catch(e){} }); siren = null; }
on("alarm", s => { queue.push(s); if (queue.length === 1) showAlarm(); desktop(`M${s.extra.mag.toFixed(1)} earthquake — ${s.extra.place}`, s.text, "eq:" + s.id); });
function showAlarm(){ const s = queue[0], el = $("#alarm"); if (!s){ el.hidden = true; sirenOff(); return; } const e = s.extra;
  el.innerHTML = `<div><div class="tierword" style="color:#fff;font-size:14px">${s.test ? "Test alarm — nothing has happened" : s.alarm === "global" ? "Major earthquake" : "Earthquake near our sites"}</div><div class="m">M${e.mag.toFixed(1)}</div><div class="p">${esc(e.place || "")}</div>
    <div class="d">Depth ${Math.round(e.depth)} km · ${esc(sgt(s.t))} SGT${e.topSite ? ` · strongest estimated shaking MMI ${roman(e.topMMI)} at ${esc(e.topSite)}, ${Math.round(e.topKm)} km` : ""}${e.tsunami ? " · <b>tsunami flag</b>" : ""}${queue.length > 1 ? ` · ${queue.length - 1} more waiting` : ""}</div>
    <button class="btn" id="alAck">${s.test ? "End the test" : "Acknowledge and decide"}</button> <button class="btn ghost" id="alSil">Silence</button></div>`;
  el.hidden = false; sirenOff(); sirenOn();
  $("#alSil").onclick = e => { sirenOff(); e.target.textContent = "Silenced"; e.target.disabled = true; }; $("#alAck").onclick = () => { sirenOff(); queue.shift(); if (s.test){ showAlarm(); toast("Test finished", CFG.notify.sound ? "If you didn't hear the siren, check the computer's volume." : "The siren is off. Turn it on from the top bar to hear it.", 0); return; } const it = INBOX.find(i => i.key === "sig:" + s.key && i.status === "open"); if (it) go("inbox", { inboxSel: it.id }); else go("watch", { watchSel: s.key, watchCity: null }); showAlarm(); }; }

/* ---------- desktop notifications ---------- */
const told = new Set(load("told", [])); function desktop(title, body, tag){ if (!CFG.notify.desktop || typeof Notification === "undefined" || Notification.permission !== "granted" || told.has(tag)) return; told.add(tag); save("told", [...told].slice(-500));
  try{ const n = new Notification("ITE — " + title, { body: body || "", tag, requireInteraction: /^eq:/.test(tag) }); n.onclick = () => { window.focus(); n.close(); }; }catch(e){} }
let fresh = [], freshT = null;                       // new items arrive in bursts (a source run); tell the officer once per burst
function chime(){ if (!CFG.notify.chime) return; try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.12, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + .5); o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + .5); }catch(e){} }
on("inbox:new", i => { if (i.pri !== "P1" && !(i.pri === "P2" && CFG.notify.level !== "P1")) return; fresh.push(i); clearTimeout(freshT); freshT = setTimeout(() => { const b = fresh; fresh = [];
  const top1 = b.slice().sort((x, y) => x.pri.localeCompare(y.pri))[0], tier = PRI[top1.pri].tier; chime();
  if (b.length === 1){ desktop(`${top1.pri}: ${top1.title}`, "Needs a decision in the Inbox.", "in:" + top1.id); if (!document.hidden && UI.ws !== "inbox") toast(`${top1.pri} — needs a decision`, top1.title, tier, () => go("inbox", { inboxSel: top1.id })); return; }
  desktop(`${b.length} new items need a decision`, `First: ${top1.pri} ${top1.title}`, "inb:" + top1.id);
  if (!document.hidden && UI.ws !== "inbox") toast(`${b.length} new items need a decision`, `First: ${top1.pri} ${top1.title}`, tier, () => go("inbox", { inboxSel: top1.id })); }, 1500); });

/* ---------- sign-in ---------- */
function gate(after){ const g = $("#gate"); g.hidden = false;
  g.innerHTML = `<form id="gf"><h1>ITE</h1><p>PSOC operational console. Your name is recorded against every decision, escalation and report.</p><label for="gn" class="help">Your name</label><input id="gn" autocomplete="name" required value="${esc(load("lastName", ""))}"><button class="btn primary" style="width:100%;padding:10px">Start the shift</button>
    <p class="help" style="margin-top:14px">Everything stays in this browser. Turn the earthquake siren on from the top bar once you're in.</p></form>`;
  $("#gn").focus(); $("#gf").onsubmit = e => { e.preventDefault(); const n = $("#gn").value.trim(); if (!n) return; save("lastName", n); signIn(n); g.hidden = true; after(); }; }

/* ---------- keys ---------- */
document.addEventListener("keydown", e => { if (e.ctrlKey || e.metaKey || e.altKey || !$("#gate").hidden || !$("#scrim").hidden || !$("#alarm").hidden) return; const a = document.activeElement; if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  if (e.key === "?"){ e.preventDefault(); openGuide(); return; }
  const w = Object.entries(WS).find(([, v]) => v[3] === e.key); if (w){ e.preventDefault(); go(w[0]); return; }
  if (UI.ws === "inbox"){ const r = Inbox.keys(e); if (r){ e.preventDefault(); if (r === true) render(); } } });
export function testAlarm(){ const s = { key: "test", id: "test", test: true, alarm: "near-site", t: Date.now(), text: "", extra: { mag: 6.8, place: "TEST — this is a test of the earthquake alarm", depth: 10, topSite: null } };
  queue.push(s); if (queue.length === 1) showAlarm(); }
document.addEventListener("click", e => { const t = e.target.closest("[data-ws],[data-next],[data-sound],[data-desk],[data-me],[data-qretry],[data-testalarm],[data-ask],[data-guide]"); if (!t) return; const d = t.dataset;
  if (d.ask !== undefined){ openCopilot(); return; } if (d.guide !== undefined){ openGuide(); return; }
  if (d.qretry !== undefined){ t.textContent = "Retrying…"; runSource(SOURCES.find(x => x.id === "usgs")).then(top); return; }
  if (d.testalarm !== undefined){ testAlarm(); return; }
  if (d.ws){ go(d.ws, d.sec ? { setSel: d.sec } : null); return; } if (d.next !== undefined && NEXT){ NEXT.go(); return; }
  if (d.sound !== undefined){ CFG.notify.sound = !CFG.notify.sound; saveCfg(); if (CFG.notify.sound){ try{ audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); }catch(err){} } top(); return; }
  if (d.desk !== undefined){ CFG.notify.desktop = !CFG.notify.desktop; saveCfg(); if (CFG.notify.desktop && typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().then(top); top(); return; }
  if (d.me !== undefined){ dialog("Signed in", `<p class="prose">You are <b>${esc(who())}</b>. Decisions and reports are recorded under this name.</p>`, `<button class="btn" data-close>Close</button><button class="btn danger" id="soGo">Sign out</button>`); $("#soGo").onclick = () => { signOut(); closeDialog(); location.reload(); }; } });

export function start(){ const boot = () => { $("#app").hidden = false; initMap(); render(); invalidate();
    setInterval(() => { const c = $("#clk"); if (c){ c.textContent = clock(Date.now()); $("#clku").textContent = new Date().toISOString().slice(11, 16) + " UTC"; } }, 1000);
    setInterval(() => { const evs = openEvents(); evs.filter(e => timers(e).state === "overdue").forEach(e => desktop("Update overdue: " + e.title, "", "ov:" + e.id + ":" + e.last12 + ":" + e.last24)); soon(); }, 30e3); };
  if (STATE.me) boot(); else gate(boot); }
