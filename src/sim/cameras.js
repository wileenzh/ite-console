// PROTOTYPE: four simulated security cameras at fictional sites, with people who walk, wait, run, fall, gather,
// leave bags and follow each other through doors. Each camera is drawn on a canvas like a CCTV view; the simulator
// hands the behaviour rules the boxes a detector would produce, and keeps one frame a second for picture strips.
// Nothing here is real footage. Swap the box source for a real detector and a VMS frame grabber to go live.
import { STATE, siteBy, setSignals } from "../model.js";
import { emit, save, load } from "../core.js";
import { Analyzer, RULES, PARAMS } from "../vision.js";
import { SimulatedOnGuard, TYPES } from "../integrations/lenel.js";

const W = 640, H = 360;
export const CAMS = [
  { id: "CAM-01", site: "TOK83", name: "Main entrance", type: "entrance", zones: [{ name: "the doorway", kind: "door", poly: [[.41, .40], [.59, .40], [.62, .58], [.38, .58]] }] },
  { id: "CAM-02", site: "TOK83", name: "Perimeter fence, north", type: "fence", zones: [{ name: "the perimeter strip", kind: "restricted", poly: [[0, .48], [1, .40], [1, .66], [0, .74]] }, { name: "the outer gate", kind: "loiter", poly: [[.55, .08], [.9, .06], [.9, .34], [.55, .38]] }] },
  { id: "CAM-03", site: "SIG97", name: "Loading dock", type: "dock", zones: [] },
  { id: "CAM-04", site: "SIG97", name: "Lobby", type: "lobby", zones: [{ name: "the lobby floor", kind: "crowd", poly: [[.22, .42], [.78, .42], [.9, .98], [.1, .98]] }] } ];
export const SCENARIOS = { tailgate: ["Tailgating at the main entrance", "CAM-01"], forced: ["Door forced open at the main entrance", "CAM-01"], intrusion: ["Someone climbs into the perimeter strip", "CAM-02"],
  loiter: ["Someone waits at the outer gate", "CAM-02"], object: ["A bag left at the loading dock", "CAM-03"], running: ["Someone runs across the loading dock", "CAM-03"], down: ["A person falls at the loading dock", "CAM-03"], crowd: ["A crowd gathers in the lobby", "CAM-04"] };
const CLOTHES = ["#4a5563", "#3d4f66", "#55603f", "#6b5a4a", "#4f4a5e", "#5e6b70", "#704f4f"];
let uid = 1;
const sgtHour = () => (new Date().getUTCHours() + 8) % 24;
export const night = () => { const h = sgtHour(); return h < 7 || h >= 19; };

class Scene {
  constructor(cam, onDet){ this.cam = cam; this.onDet = onDet; this.canvas = document.createElement("canvas"); this.canvas.width = W; this.canvas.height = H; this.ctx = this.canvas.getContext("2d");
    this.agents = []; this.analyzer = new Analyzer(W, H, cam.zones); this.frames = []; this.flags = []; this.spawnIn = 2 + Math.random() * 4; this.lastFrame = 0; }
  // a person follows a path of points; a point may hold { wait, fall, drop, loiter }
  person(path, speed = 46, opts = {}){ const a = Object.assign({ id: "P" + uid++, cls: "person", x: path[0][0] * W, y: path[0][1] * H, path: path.slice(1).map(p => ({ x: p[0] * W, y: p[1] * H, ...(p[2] || {}) })), speed, wait: 0, down: false, color: CLOTHES[uid % CLOTHES.length] }, opts); this.agents.push(a); return a; }
  bag(x, y, ttl){ this.agents.push({ id: "B" + uid++, cls: "bag", x, y, path: [], speed: 0, wait: ttl, still: true }); }
  routine(){ const T = this.cam.type, r = Math.random();
    if (T === "entrance") r < .5 ? this.person([[-.05, .9], [.5, .62], [.5, .5, { gone: true }]], 42) : this.person([[.5, .5], [.5, .62], [1.05, .88]], 42);
    if (T === "fence") this.person(r < .5 ? [[-.05, .24], [1.05, .14]] : [[1.05, .16], [-.05, .27]], 40);
    if (T === "dock") this.person(r < .5 ? [[-.05, .78], [1.05, .72]] : [[1.05, .86], [-.05, .8]], 44);
    if (T === "lobby") this.person(r < .5 ? [[-.05, .7], [.5, .66], [1.05, .62]] : [[.5, .4], [.5, .7], [-.05, .9]], 40); }
  update(dt){ if ((this.spawnIn -= dt) <= 0){ this.routine(); this.spawnIn = 7 + Math.random() * 9; }
    this.agents.forEach(a => { if (a.wait > 0){ a.wait -= dt; if (a.loiter){ a.x += (Math.random() - .5) * 6 * dt; a.y += (Math.random() - .5) * 3 * dt; } if (a.wait <= 0){ a.loiter = false; if (a.getUp) a.down = false; if (a.still) a.gone = true; } return; }
      const p = a.path[0]; if (!p){ a.gone = true; return; } const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy), step = a.speed * dt * (0.55 + .75 * a.y / H);
      if (d <= step){ a.x = p.x; a.y = p.y; a.path.shift(); if (p.gone) a.gone = true; if (p.wait){ a.wait = p.wait; a.loiter = !!p.loiter; } if (p.fall){ a.down = true; a.getUp = true; } if (p.drop){ this.bag(a.x + 14, a.y, p.drop); a.carry = false; } if (p.grant) p.grant(); }
      else { a.x += dx / d * step; a.y += dy / d * step; } });
    this.agents = this.agents.filter(a => !a.gone && a.x > -60 && a.x < W + 60); }
  boxes(){ return this.agents.map(a => { const s = .55 + .75 * a.y / H, j = () => (Math.random() - .5) * 2;
    if (a.cls === "bag") return { id: a.id, cls: "bag", box: [a.x - 8 * s + j(), a.y - 13 * s + j(), 16 * s, 13 * s], score: .9 };
    return a.down ? { id: a.id, cls: "person", box: [a.x - 36 * s + j(), a.y - 22 * s + j(), 72 * s, 22 * s], score: .88 } : { id: a.id, cls: "person", box: [a.x - 14 * s + j(), a.y - 78 * s + j(), 28 * s, 78 * s], score: .93 }; }); }
  analyse(t){ const dets = this.boxes(); this.lastDets = dets; this.analyzer.step(t, dets).forEach(ev => { this.flags.push({ until: t + 6000, box: ev.box, label: ev.label }); this.onDet(this, ev, t); }); }
  draw(t){ const c = this.ctx, T = this.cam.type, dark = night(); c.save();
    // the scene
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3a3f44"); g.addColorStop(1, "#24282c"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(255,255,255,.06)"; for (let y = 140; y < H; y += 26){ c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    if (T === "entrance"){ c.fillStyle = "#4b5157"; c.fillRect(0, 0, W, 150); c.fillStyle = "#1d2a33"; c.fillRect(262, 40, 116, 112); c.strokeStyle = "#8aa0ad"; c.lineWidth = 2; c.strokeRect(262, 40, 116, 112); c.beginPath(); c.moveTo(320, 40); c.lineTo(320, 152); c.stroke();
      c.fillStyle = "#222"; c.fillRect(388, 96, 12, 18); c.fillStyle = "#3fa34d"; c.fillRect(391, 99, 6, 4); c.fillStyle = "#cfd6db"; c.font = "11px sans-serif"; c.fillText("RECEPTION", 288, 32); }
    if (T === "fence"){ c.fillStyle = "#2f3438"; c.fillRect(0, 0, W, 150); c.fillStyle = "#4b5157"; c.beginPath(); c.moveTo(0, 268); c.lineTo(W, 240); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      c.strokeStyle = "#9aa5ad"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 172); c.lineTo(W, 144); c.stroke(); for (let x = 0; x <= W; x += 40){ const y = 172 - x * 28 / W; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 46); c.stroke(); }
      c.beginPath(); c.moveTo(0, 126); c.lineTo(W, 98); c.stroke(); c.strokeStyle = "rgba(154,165,173,.35)"; for (let x = 0; x < W; x += 10){ const y = 172 - x * 28 / W; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10, y - 46); c.stroke(); } }
    if (T === "dock"){ c.fillStyle = "#1f2326"; c.fillRect(0, 0, W, 170); c.fillStyle = "#c8a032"; for (let x = 0; x < W; x += 36){ c.fillRect(x, 170, 18, 6); }
      c.fillStyle = "#2a3035"; [40, 250, 460].forEach(x => { c.fillRect(x, 30, 150, 134); c.strokeStyle = "#5c666e"; c.strokeRect(x, 30, 150, 134); for (let y = 44; y < 164; y += 12){ c.beginPath(); c.moveTo(x, y); c.lineTo(x + 150, y); c.stroke(); } }); }
    if (T === "lobby"){ c.fillStyle = "#454b50"; c.fillRect(0, 0, W, 130); c.fillStyle = "#5b544a"; c.fillRect(230, 108, 180, 34); c.fillStyle = "#cfd6db"; c.font = "11px sans-serif"; c.fillText("LIFTS", 560, 40); c.strokeStyle = "#8aa0ad"; c.strokeRect(540, 50, 70, 80); }
    // people and bags, far ones first
    this.agents.slice().sort((a, b) => a.y - b.y).forEach(a => { const s = .55 + .75 * a.y / H; c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(a.x, a.y, 12 * s, 4 * s, 0, 0, 7); c.fill();
      if (a.cls === "bag"){ c.fillStyle = "#2b2b2b"; c.fillRect(a.x - 8 * s, a.y - 13 * s, 16 * s, 13 * s); c.strokeStyle = "#555"; c.strokeRect(a.x - 8 * s, a.y - 13 * s, 16 * s, 13 * s); return; }
      if (a.down){ c.fillStyle = a.color; c.beginPath(); c.roundRect(a.x - 30 * s, a.y - 16 * s, 52 * s, 14 * s, 6 * s); c.fill(); c.fillStyle = "#b9b3aa"; c.beginPath(); c.arc(a.x + 28 * s, a.y - 10 * s, 7 * s, 0, 7); c.fill(); return; }
      c.fillStyle = a.color; c.beginPath(); c.roundRect(a.x - 10 * s, a.y - 62 * s, 20 * s, 40 * s, 7 * s); c.fill(); c.fillRect(a.x - 8 * s, a.y - 24 * s, 6 * s, 24 * s); c.fillRect(a.x + 2 * s, a.y - 24 * s, 6 * s, 24 * s);
      c.fillStyle = "#b9b3aa"; c.beginPath(); c.arc(a.x, a.y - 70 * s, 8 * s, 0, 7); c.fill(); if (a.carry){ c.fillStyle = "#2b2b2b"; c.fillRect(a.x + 10 * s, a.y - 40 * s, 12 * s, 11 * s); } });
    if (dark){ c.globalCompositeOperation = "saturation"; c.fillStyle = "#000"; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over"; c.fillStyle = "rgba(0,10,20,.35)"; c.fillRect(0, 0, W, H); }
    // zones, boxes and flags: what the rules see
    this.cam.zones.forEach(z => { c.setLineDash([6, 5]); c.lineWidth = 1.5; c.strokeStyle = z.kind === "restricted" ? "rgba(231,76,60,.9)" : z.kind === "door" ? "rgba(90,169,230,.9)" : "rgba(216,178,74,.85)"; c.beginPath(); z.poly.forEach(([x, y], i) => i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H)); c.closePath(); c.stroke(); c.setLineDash([]); });
    (this.lastDets || []).forEach(d => { c.strokeStyle = d.cls === "bag" ? "rgba(240,180,60,.95)" : "rgba(90,210,230,.9)"; c.lineWidth = 1.2; c.strokeRect(...d.box); });
    this.flags = this.flags.filter(f => f.until > t); this.flags.forEach(f => { if (!f.box) return; c.strokeStyle = "#ff4d4d"; c.lineWidth = 2.5; c.strokeRect(f.box[0] - 3, f.box[1] - 3, f.box[2] + 6, f.box[3] + 6); c.fillStyle = "#ff4d4d"; c.font = "bold 12px sans-serif"; c.fillText(f.label.toUpperCase(), Math.max(4, f.box[0] - 3), Math.max(14, f.box[1] - 8)); });
    // the CCTV header
    c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, 0, W, 20); c.fillStyle = "#e8edf0"; c.font = "12px monospace"; const ts = new Date(t + 8 * 3600e3).toISOString().slice(0, 19).replace("T", " ");
    c.fillText(`${this.cam.id}  ${this.cam.site} ${this.cam.name.toUpperCase()}  ${ts} SGT${dark ? "  IR" : ""}`, 6, 14); c.fillStyle = "#ff5a5a"; c.fillText("● SIMULATED", W - 100, 14);
    c.restore(); }
  capture(t){ if (t - this.lastFrame < 1000) return; this.lastFrame = t; const s = document.createElement("canvas"); s.width = 320; s.height = 180; s.getContext("2d").drawImage(this.canvas, 0, 0, 320, 180);
    this.frames.push({ t, url: s.toDataURL("image/jpeg", .62) }); this.frames = this.frames.slice(-8); }
}

/* ---------- the engine: scenes, the simulated OnGuard feed, detections → signals → the Inbox ---------- */
export const ENGINE = { running: false, scenes: [], detections: [], access: [], onguard: new SimulatedOnGuard(), visible: false };
const DET = [], ACC = [], denied = {};
function siteOf(code){ return siteBy(code) || {}; }
function publish(){ const now = Date.now();
  const sig = DET.filter(d => now - d.t < 2 * 3600e3).map(d => { const s = siteOf(d.cam.site); return { id: "cam:" + d.id, src: "cameras", kind: "security", rule: "security", cat: "operational_security", title: `${d.cam.site} ${d.cam.name}: ${d.label}`, tier: d.tier,
    lat: s.lat, lon: s.lon, t: d.t, text: `${d.text} ${d.cam.id}, simulated camera.`, sites: [{ code: d.cam.site, km: 0 }], citySites: false, extra: { detId: d.id, cam: d.cam.id, simulated: true } }; });
  const acc = ACC.filter(e => now - e.time < 2 * 3600e3 && e.signal).map(e => { const s = siteOf(e.site); return { id: "og:" + e.id, src: "lenel", kind: "security", rule: "security", cat: "operational_security", title: `${e.site}: ${e.type} — ${e.device.replace(e.site + " ", "")}`, tier: e.signal,
    lat: s.lat, lon: s.lon, t: e.time, text: e.text + " Simulated OnGuard event.", sites: [{ code: e.site, km: 0 }], citySites: false, extra: { access: e.id, simulated: true } }; });
  setSignals("cameras", sig); setSignals("lenel", acc); emit("cameras"); }
function onDet(scene, ev, t){ const d = { id: "d" + t.toString(36) + uid++, cam: scene.cam, rule: ev.rule, label: ev.label, tier: ev.tier, text: ev.text, t, strip: scene.frames.slice(-5).map(f => f.url) };
  DET.unshift(d); DET.splice(40); setTimeout(() => { scene.capture(Date.now() + 1000); const f = scene.frames.at(-1); if (f) d.strip.push(f.url); emit("cameras"); }, 1100); publish(); }
function onAccess(e){ ACC.unshift(e); ACC.splice(80); const sc = ENGINE.scenes.find(s => s.cam.id === e.cam);
  if (e.kind === "granted" && sc) sc.analyzer.grant(Date.now());
  if (e.kind === "forced") e.signal = 3; if (e.kind === "held") e.signal = 2; if (e.kind === "offline" || e.kind === "commloss") e.signal = 1;
  if (e.kind === "denied"){ const k = e.device, list = (denied[k] = (denied[k] || []).filter(x => Date.now() - x < 120e3)); list.push(Date.now()); if (list.length === 3){ e.signal = 1; e.type = "Access denied 3 times in 2 minutes"; e.text = `Access denied 3 times in 2 minutes at ${e.device}.`; } }
  if (e.signal) publish(); else emit("cameras"); }
ENGINE.detections = DET; ENGINE.access = ACC;

export function runScenario(k){ const [, camId] = SCENARIOS[k], sc = ENGINE.scenes.find(s => s.cam.id === camId); if (!sc) return; const og = ENGINE.onguard, door = og.door(camId);
  if (k === "tailgate"){ sc.person([[-.05, .92], [.5, .62, { grant: () => og.emit("granted", door) }], [.5, .48], [.5, .45, { gone: true }]], 52); setTimeout(() => sc.person([[-.05, .95], [.5, .64], [.5, .48], [.5, .45, { gone: true }]], 60), 900); }
  if (k === "forced"){ og.emit("forced", door); sc.person([[1.05, .9], [.5, .6], [.5, .47, { gone: true }]], 70); setTimeout(() => og.emit("held", door), 30e3); }
  if (k === "intrusion") sc.person([[-.05, .22], [.3, .2], [.34, .38], [.36, .56, { wait: 14 }], [.6, .54], [.62, .36], [1.05, .14]], 40);
  if (k === "loiter") sc.person([[1.05, .14], [.72, .2, { wait: PARAMS_LOITER() + 15, loiter: true }], [-.05, .27]], 40);
  if (k === "object") sc.person([[-.05, .8], [.62, .76, { drop: 70 }], [1.05, .72]], 44, { carry: true });
  if (k === "running") sc.person([[-.05, .86], [1.05, .78]], 230);
  if (k === "down") sc.person([[-.05, .84], [.45, .8, { fall: true, wait: 24 }], [1.05, .76]], 44);
  if (k === "crowd") for (let i = 0; i < 8; i++){ const tx = .3 + Math.random() * .4, ty = .55 + Math.random() * .3; setTimeout(() => sc.person([[i % 2 ? -.05 : 1.05, .6 + Math.random() * .3], [tx, ty, { wait: 34 - i }], [i % 2 ? 1.05 : -.05, .9]], 50), i * 700); } }
const PARAMS_LOITER = () => PARAMS.loiterSec;

let raf = 0, tick = 0, autoAt = 0;
function loop(){ const t = Date.now(), dt = Math.min(.25, (t - (loop.last || t)) / 1000); loop.last = t;
  ENGINE.scenes.forEach(s => { s.update(dt); if (t - (s.lastAn || 0) >= 250){ s.lastAn = t; s.analyse(t); } if (ENGINE.visible || t - (s.lastDraw || 0) >= 500){ s.lastDraw = t; s.draw(t); s.capture(t); } });
  if (ENGINE.auto && t > autoAt){ if (autoAt) runScenario(Object.keys(SCENARIOS)[Math.floor(Math.random() * 8)]); autoAt = t + (150 + Math.random() * 120) * 1000; } }
export function startSim(){ if (ENGINE.running) return; ENGINE.running = true; ENGINE.auto = load("camAuto", true); if (!ENGINE.scenes.length) ENGINE.scenes = CAMS.map(c => new Scene(c, onDet));
  ENGINE.onguard.connect(onAccess); tick = setInterval(loop, 100); save("camRun", true); }
export function stopSim(){ ENGINE.running = false; clearInterval(tick); ENGINE.onguard.disconnect(); save("camRun", false); }
export const detById = id => DET.find(d => d.id === id);
export { RULES, TYPES };
