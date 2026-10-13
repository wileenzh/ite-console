// CAMERAS (prototype) — simulated CCTV at fictional sites, a simulated Lenel OnGuard feed, the behaviour rules that
// flag what needs a look, picture strips, Claude describing a strip on request, and analysis of footage an officer
// uploads (detected in this browser). Detections at manager level reach the Inbox like any other alert.
import { $, esc, sgt, ago, on } from "../core.js";
import { STATE, INBOX, addManualItem, audit } from "../model.js";
import { UI, saveUI, go } from "./state.js";
import { dialog, closeDialog, toast, tierWord, confirmBox, field } from "./kit.js";
import { ENGINE, CAMS, SCENARIOS, startSim, stopSim, runScenario, detById, night } from "../sim/cameras.js";
import { Analyzer, RULES, PARAMS, saveParams, detect, loadDetector } from "../vision.js";
import { llm, llmReady, llmName } from "../llm.js";
import { load, save } from "../core.js";

export const count = () => { const h = Date.now() - 3600e3; return ENGINE.detections.filter(d => d.t > h && d.tier >= 2).length; };
const ZONE_WORD = { restricted: "restricted", door: "door", loiter: "watch for loitering", crowd: "crowd count" };
export function render(p){ if (!ENGINE.running && load("camRun", true) !== false) startSim(); ENGINE.visible = true;
  p.innerHTML = `<div class="ph"><h1>Cameras</h1><div class="seg" role="group" aria-label="Simulation"><button data-camrun="on" aria-pressed="${ENGINE.running}">Running</button><button data-camrun="off" aria-pressed="${!ENGINE.running}">Paused</button></div>
      <div class="sum"><b>Prototype.</b> Four simulated cameras and a simulated Lenel OnGuard door feed at the fictional sites TOK83 and SIG97 — no live feed is connected. The behaviour rules, picture strips, Inbox items and Claude descriptions are the real thing. Behaviour only: no face recognition, no identity.</div></div>
    <div class="filters"><select class="search" id="camScen" style="width:auto" aria-label="Scenario">${Object.entries(SCENARIOS).map(([k, [l]]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select><button class="btn small primary" data-camgo>Run this scenario</button>
      <label class="chk" style="font-size:12.5px;color:var(--muted)"><input type="checkbox" data-camauto${ENGINE.auto ? " checked" : ""}> A random scenario every few minutes</label>
      <button class="btn small" data-camfile>Analyse footage</button><button class="btn small" data-camrules>Rules</button></div>
    <div class="camwrap"><div class="camgrid">${CAMS.map(c => `<figure class="camtile"><div class="camslot" data-slot="${c.id}"></div><figcaption><b>${esc(c.id)}</b> ${esc(c.site)} ${esc(c.name)}${c.zones.length ? ` · <span class="help">${c.zones.map(z => esc(z.name) + " (" + ZONE_WORD[z.kind] + ")").join(", ")}</span>` : ""}</figcaption></figure>`).join("")}</div>
      <aside class="camside" id="camside">${side()}</aside></div>`;
  ENGINE.scenes.forEach(s => { const slot = p.querySelector(`[data-slot="${s.cam.id}"]`); if (slot) slot.appendChild(s.canvas); }); }
function strip(d, big){ return `<div class="strip${big ? " big" : ""}">${d.strip.map((u, i) => `<img src="${u}" alt="${esc(d.cam.id)} frame ${i + 1} of ${d.strip.length}">`).join("")}</div>`; }
function side(){ const dets = ENGINE.detections.slice(0, 14), acc = ENGINE.access.slice(0, 18);
  return `<h3 class="ttp-sub">Flagged by the rules (${ENGINE.detections.length})</h3>${dets.map(d => { const it = INBOX.find(i => i.key === "sig:cam:" + d.id);
      return `<div class="det"><div class="dh"><span class="bar t${d.tier}"></span><b>${esc(d.label)}</b><span class="help">${esc(d.cam.id)} · ${esc(d.cam.site)} ${esc(d.cam.name)} · ${esc(ago(d.t))}</span></div>${strip(d)}
        <div class="actions"><button class="linkbtn" data-camopen="${esc(d.id)}">Open</button>${it ? `<button class="linkbtn" data-caminbox="${esc(it.id)}">${it.status === "open" ? "Decide in the Inbox" : "In the Inbox: " + esc(it.decision || it.status)}</button>` : ""}${llmReady() ? `<button class="linkbtn" data-camdesc="${esc(d.id)}">Describe with Claude</button>` : ""}</div>${d.desc ? `<p class="prose small">${esc(d.desc)}</p>` : ""}</div>`; }).join("") || `<p class="help">Nothing flagged yet. Run a scenario, or wait for one.</p>`}
    <h3 class="ttp-sub" style="margin-top:14px">Lenel OnGuard door events (simulated)</h3><ul class="acc">${acc.map(e => `<li class="s${e.signal || 0}"><time>${esc(sgt(e.time).split(", ").pop())}</time><span>${esc(e.type)}</span><span class="help">${esc(e.device)}${e.badge ? " · " + esc(e.badge) : ""}</span></li>`).join("") || `<li class="help">Waiting for events…</li>`}</ul>`; }
on("cameras", () => { if (UI.ws !== "cameras") return; const s = $("#camside"); if (s && !s.contains(document.activeElement)) s.innerHTML = side(); });

function openDet(d){ dialog(`${d.label} — ${d.cam.id} ${d.cam.site} ${d.cam.name}`, `<p class="prose">${esc(d.text)} Flagged ${esc(sgt(d.t))} SGT.</p>${strip(d, true)}<p class="help">One frame a second around the moment the rule was met. Simulated footage.</p>
    <div id="descBox">${d.desc ? `<p class="prose">${esc(d.desc)}</p><p class="help">Described by ${esc(d.descBy || "Claude")}. Check it against the frames.</p>` : ""}</div>`,
    `${llmReady() ? `<button class="btn" id="dDesc">Describe with Claude</button>` : ""}<button class="btn" data-close>Close</button>`, { wide: true });
  if ($("#dDesc")) $("#dDesc").onclick = () => describe(d, $("#dDesc")); }
// Claude looks at the strip: behaviour only, never identity. Frames leave the browser only after the officer agrees.
async function describe(d, btn){ if (!await confirmBox("Send the picture strip to the language model?", `${d.strip.length} frames go to ${esc(llmName())}. In this prototype they are simulated. With real cameras this needs approval under the camera privacy policy.`, "Send")) return;
  if (btn){ btn.disabled = true; btn.textContent = "Looking…"; }
  try{ const imgs = d.strip.map(u => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: u.split(",")[1] } }));
    d.desc = await llm({ system: "You review CCTV picture strips for a physical security operations center. Describe only behaviour: movement, posture, objects, and position relative to doors, fences and marked zones. Never describe faces or identifying features, and never guess identity, age, gender or ethnicity. Be brief and factual.",
      messages: [{ role: "user", content: imgs.concat([{ type: "text", text: `Consecutive frames about one second apart from ${d.cam.id}, ${d.cam.name}. The rule "${d.label}" was met: ${d.text} In 3 to 5 sentences: what happens, whether it matches the rule, your confidence (low, medium or high), and one next step for the PSOC officer.` }]) }], max: 500 });
    d.descBy = llmName(); audit("Camera strip described", d.cam.id + " " + d.label); }
  catch(e){ toast("Could not describe the strip", e.message, 2); }
  const box = $("#descBox"); if (box && d.desc) box.innerHTML = `<p class="prose">${esc(d.desc)}</p><p class="help">Described by ${esc(d.descBy)}. Check it against the frames.</p>`; if (btn){ btn.disabled = false; btn.textContent = "Describe with Claude"; }
  const s = $("#camside"); if (s) s.innerHTML = side(); }

/* ---------- uploaded footage: frames sampled once a second, people and bags detected here, the same rules ---------- */
function analyseDialog(){ dialog("Analyse footage", `<p class="prose">Choose a video clip or a set of pictures. Every second of the clip is checked for people and bags by a detector that runs in this browser, then the behaviour rules run. Nothing is uploaded.</p>
    <input type="file" id="afFile" accept="video/*,image/*" multiple><div id="afStage" style="margin-top:10px"></div>`, `<button class="btn" data-close>Close</button>`, { wide: true });
  $("#afFile").onchange = async e => { const files = [...e.target.files]; if (!files.length) return; const stage = $("#afStage"), cv = document.createElement("canvas"), x = cv.getContext("2d"), zone = [];
    const frames = [], isVid = files[0].type.startsWith("video/");
    if (isVid){ const v = document.createElement("video"); v.muted = true; v.src = URL.createObjectURL(files[0]); await new Promise((ok, bad) => { v.onloadedmetadata = ok; v.onerror = () => bad(new Error("this video format can't be read here")); });
      const n = Math.min(90, Math.floor(v.duration)); for (let i = 0; i <= n; i++) frames.push(async () => { v.currentTime = i; await new Promise(r => v.onseeked = r); return v; }); cv.width = 640; cv.height = Math.round(640 * v.videoHeight / v.videoWidth) || 360; }
    else { const imgs = await Promise.all(files.map(f => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.src = URL.createObjectURL(f); }))); imgs.forEach(im => frames.push(async () => im)); cv.width = 640; cv.height = Math.round(640 * imgs[0].naturalHeight / imgs[0].naturalWidth) || 360; }
    const paint = async i => { const src = await frames[i](); x.drawImage(src, 0, 0, cv.width, cv.height); };
    await paint(0); stage.innerHTML = `<p class="help">Optional: click points on the picture to mark a restricted area, then Analyse. ${frames.length} frame${frames.length === 1 ? "" : "s"} to check.</p>`; cv.className = "afcanvas"; stage.appendChild(cv);
    const drawZone = () => { if (zone.length < 2) return; x.strokeStyle = "#e74c3c"; x.setLineDash([6, 5]); x.lineWidth = 2; x.beginPath(); zone.forEach(([a, b], i) => i ? x.lineTo(a * cv.width, b * cv.height) : x.moveTo(a * cv.width, b * cv.height)); x.closePath(); x.stroke(); x.setLineDash([]); };
    cv.onclick = async ev => { const r = cv.getBoundingClientRect(); zone.push([(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]); await paint(0); drawZone(); };
    stage.insertAdjacentHTML("beforeend", `<div class="actions"><button class="btn primary" id="afGo">Analyse</button><button class="btn" id="afClear">Clear the area</button></div><div id="afOut"></div>`);
    $("#afClear").onclick = async () => { zone.length = 0; await paint(0); };
    $("#afGo").onclick = async () => { const out = $("#afOut"), btn = $("#afGo"); btn.disabled = true; out.innerHTML = `<p class="help">Loading the detector…</p>`;
      try{ await loadDetector(); }catch(err){ out.innerHTML = `<p class="prose">The detector could not load here (${esc(err.message)}). It needs the model files from storage.googleapis.com, or a copy on the PSOC server. The simulated cameras still work.</p>`; btn.disabled = false; return; }
      const an = new Analyzer(cv.width, cv.height, zone.length > 2 ? [{ name: "the marked area", kind: "restricted", poly: zone.slice() }] : []), shots = [], found = [];
      for (let i = 0; i < frames.length; i++){ await paint(i); const dets = await detect(cv); x.lineWidth = 2; dets.forEach(dd => { x.strokeStyle = dd.cls === "bag" ? "#f0b43c" : "#5ad2e6"; x.strokeRect(...dd.box); }); drawZone();
        const s = document.createElement("canvas"); s.width = 320; s.height = Math.round(320 * cv.height / cv.width); s.getContext("2d").drawImage(cv, 0, 0, s.width, s.height); shots.push(s.toDataURL("image/jpeg", .62));
        an.step(i * 1000, dets).forEach(ev => found.push(Object.assign({}, ev, { at: i, strip: shots.slice(-5) })));
        out.innerHTML = `<p class="help">Checked ${i + 1} of ${frames.length} seconds · ${dets.filter(d => d.cls === "person").length} people in view · ${found.length} flagged</p>`; }
      out.innerHTML = found.length ? found.map((f, k) => `<div class="det"><div class="dh"><span class="bar t${f.tier}"></span><b>${esc(f.label)}</b><span class="help">at ${f.at} s</span></div><p class="prose small">${esc(f.text)}</p><div class="strip">${f.strip.map(u => `<img src="${u}" alt="frame">`).join("")}</div><div class="actions"><button class="linkbtn" data-afadd="${k}">Add to the Inbox</button></div></div>`).join("")
        : `<p class="prose">Nothing met a rule in ${frames.length} seconds of footage. ${an.tracks.size ? "" : "No people were detected."}</p>`;
      out.onclick = ev2 => { const b = ev2.target.closest("[data-afadd]"); if (!b) return; const f = found[+b.dataset.afadd]; addManualItem({ title: `Uploaded footage: ${f.label} at ${f.at} s`, tier: f.tier, pri: f.tier >= 3 ? "P1" : f.tier === 2 ? "P2" : "P3", kind: "security", text: f.text + ` From ${files[0].name}.` }); b.textContent = "Added"; b.disabled = true; };
      audit("Footage analysed", files[0].name, `${frames.length} s, ${found.length} flagged`); btn.disabled = false; }; }; }

function rulesDialog(){ const P = PARAMS;
  dialog("Camera rules", `<div class="form">${field("Loitering after (seconds)", `<input type="number" id="rp1" value="${P.loiterSec}" min="10">`)}${field("Running pace (frame widths a second)", `<input type="number" step="0.02" id="rp2" value="${P.runSpeed}">`)}
    ${field("Person down after (seconds)", `<input type="number" id="rp3" value="${P.downSec}" min="1">`)}${field("Crowd from (people)", `<input type="number" id="rp4" value="${P.crowdN}" min="3">`)}
    ${field("Object left after (seconds)", `<input type="number" id="rp5" value="${P.objectSec}" min="5">`)}${field("Tailgating window after a badge (seconds)", `<input type="number" id="rp6" value="${P.tailgateSec}" min="1">`)}</div>
    <p class="help">Levels: ${Object.values(RULES).map(([l, t]) => `${esc(l)} — ${["normal", "monitor", "manager trigger", "escalate"][t]}`).join("; ")}. Manager trigger and above reach the Inbox.</p>`,
    `<button class="btn" data-close>Cancel</button><button class="btn primary" id="rpGo">Save</button>`);
  $("#rpGo").onclick = () => { Object.assign(PARAMS, { loiterSec: +$("#rp1").value || 30, runSpeed: +$("#rp2").value || .2, downSec: +$("#rp3").value || 4, crowdN: +$("#rp4").value || 6, objectSec: +$("#rp5").value || 20, tailgateSec: +$("#rp6").value || 4 }); saveParams(); closeDialog(); toast("Rules saved", "", 0); }; }

export function bind(p, rerender){ p.onclick = async e => { const t = e.target.closest("[data-camrun],[data-camgo],[data-camfile],[data-camrules],[data-camopen],[data-caminbox],[data-camdesc]"); if (!t) return; const d = t.dataset;
    if (d.camrun){ d.camrun === "on" ? startSim() : stopSim(); rerender(); return; }
    if (d.camgo !== undefined){ if (!ENGINE.running) startSim(); const k = $("#camScen").value; runScenario(k); toast("Scenario started", SCENARIOS[k][0], 0); audit("Camera scenario run", SCENARIOS[k][0]); return; }
    if (d.camfile !== undefined){ analyseDialog(); return; } if (d.camrules !== undefined){ rulesDialog(); return; }
    if (d.camopen){ const x = detById(d.camopen); if (x) openDet(x); return; } if (d.caminbox){ go("inbox", { inboxSel: d.caminbox }); return; }
    if (d.camdesc){ const x = detById(d.camdesc); if (x) describe(x, t); } };
  p.onchange = e => { if (e.target.matches("[data-camauto]")){ ENGINE.auto = e.target.checked; save("camAuto", ENGINE.auto); } }; }
export const leave = () => { ENGINE.visible = false; };
export { detById };
