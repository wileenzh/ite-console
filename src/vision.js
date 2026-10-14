// Behaviour rules for camera footage. Input per frame: detected people and bags as boxes; output: the moments a rule
// is met. Behaviour only — no faces, no identity, no matching a person across cameras.
// The same rules run on the simulated cameras (boxes come from the simulator) and on footage an officer uploads
// (boxes come from the COCO-SSD detector, running in this browser; nothing is uploaded anywhere).
import { load, save, loadVendor } from "./core.js";

export const RULES = { intrusion: ["Person in a restricted zone", 2], loiter: ["Loitering", 1], running: ["Running", 1], down: ["Person down", 3], crowd: ["Crowd forming", 1],
  object: ["Object left behind", 2], tailgate: ["Tailgating at a door", 2], forced: ["Door forced open", 3], held: ["Door held open", 2] };
const DEF = { loiterSec: 30, runSpeed: .2, downSec: 4, crowdN: 6, objectSec: 20, tailgateSec: 4 };
export const PARAMS = Object.assign({}, DEF, load("visionParams", {}));
export const saveParams = () => save("visionParams", PARAMS);
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){ const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

export class Analyzer {
  // zones: [{ name, kind: "restricted" | "loiter" | "crowd" | "door", poly: [[x, y] 0–1 …] }]
  constructor(W, H, zones = []){ this.W = W; this.H = H; this.zones = zones; this.tracks = new Map(); this.fired = new Set(); this.grants = []; this.crowdAt = {}; this.next = 1; }
  grant(t){ this.grants.push({ t, people: new Set(), done: false }); this.grants = this.grants.filter(g => t - g.t < 30e3); }
  // dets: [{ id?, cls: "person" | "bag", box: [x, y, w, h], score }] in pixels; t in ms
  step(t, dets){ const out = [], W = this.W, H = this.H, P = PARAMS;
    dets.forEach(d => { const fx = (d.box[0] + d.box[2] / 2) / W, fy = (d.box[1] + d.box[3]) / H; let tr = d.id != null ? this.tracks.get(d.id) : null;
      if (!tr && d.id == null){ let best = null; this.tracks.forEach(x => { if (x.cls !== d.cls || x.last === t) return; const p = x.pts.at(-1), dist = Math.hypot(p.x - fx, p.y - fy); if (dist < .09 && (!best || dist < best.dist)) best = { x, dist }; }); tr = best && best.x; }
      if (!tr){ const id = d.id != null ? d.id : (d.cls === "person" ? "P" : "B") + this.next++; tr = { id, cls: d.cls, pts: [], first: t, downSince: null }; this.tracks.set(id, tr); }
      tr.last = t; tr.box = d.box; tr.pts.push({ t, x: fx, y: fy, w: d.box[2], h: d.box[3] }); tr.pts = tr.pts.filter(p => t - p.t < 90e3); });
    this.tracks.forEach((tr, id) => { if (t - tr.last > 5000) this.tracks.delete(id); });
    const live = [...this.tracks.values()].filter(x => x.last === t), people = live.filter(x => x.cls === "person"), fire = (rule, tr, text, key) => { const k = rule + ":" + (key || tr.id); if (this.fired.has(k)) return; this.fired.add(k);
      out.push({ rule, label: RULES[rule][0], tier: RULES[rule][1], track: tr ? tr.id : null, box: tr ? tr.box : null, text }); };
    const zones = k => this.zones.filter(z => z.kind === k);
    people.forEach(tr => { const p = tr.pts.at(-1), age = (t - tr.first) / 1000;
      zones("restricted").forEach(z => { if (inPoly(p.x, p.y, z.poly)) fire("intrusion", tr, `A person is inside ${z.name}.`, tr.id + z.name); });
      const lz = zones("loiter"); if (age >= P.loiterSec && (!lz.length || lz.some(z => inPoly(p.x, p.y, z.poly)))){ const win = tr.pts.filter(q => t - q.t <= P.loiterSec * 1000), cx = win.reduce((a, q) => a + q.x, 0) / win.length, cy = win.reduce((a, q) => a + q.y, 0) / win.length;
        if (win.every(q => Math.hypot(q.x - cx, q.y - cy) < .06)) fire("loiter", tr, `A person has stayed in one spot for over ${P.loiterSec} seconds.`); }
      const back = tr.pts.filter(q => t - q.t <= 1500); if (back.length >= 2){ const a = back[0], b = back.at(-1), dt = (b.t - a.t) / 1000; if (dt > .4 && Math.hypot(b.x - a.x, b.y - a.y) / dt > P.runSpeed) fire("running", tr, "A person is moving at running pace."); }
      if (p.w > p.h * 1.3){ tr.downSince = tr.downSince || t; if ((t - tr.downSince) / 1000 >= P.downSec) fire("down", tr, `A person has been on the ground for over ${P.downSec} seconds.`); } else tr.downSince = null;
      zones("door").forEach(z => { if (inPoly(p.x, p.y, z.poly)) this.grants.forEach(g => { if (t - g.t <= P.tailgateSec * 1000) g.people.add(tr.id); }); }); });
    this.grants.forEach((g, i) => { if (!g.done && g.people.size >= 2){ g.done = true; const tr = this.tracks.get([...g.people].at(-1)); fire("tailgate", tr, `${g.people.size} people went through the door on one badge.`, "g" + g.t); } });
    (zones("crowd").length ? zones("crowd") : [{ name: "the view", poly: [[0, 0], [1, 0], [1, 1], [0, 1]] }]).forEach(z => { const n = people.filter(tr => { const p = tr.pts.at(-1); return inPoly(p.x, p.y, z.poly); }).length;
      if (n >= P.crowdN && (!this.crowdAt[z.name] || t - this.crowdAt[z.name] > 120e3)){ this.crowdAt[z.name] = t; fire("crowd", people[0], `${n} people are gathered in ${z.name}.`, "c" + t); } });
    live.filter(x => x.cls === "bag").forEach(tr => { const age = (t - tr.first) / 1000, p = tr.pts.at(-1); if (age < P.objectSec) return;
      const still = tr.pts.filter(q => t - q.t <= P.objectSec * 1000).every(q => Math.hypot(q.x - p.x, q.y - p.y) < .02), alone = !people.some(o => { const q = o.pts.at(-1); return Math.hypot(q.x - p.x, q.y - p.y) < .1; });
      if (still && alone) fire("object", tr, `An object has been left unattended for over ${P.objectSec} seconds.`); });
    return out; }
}

/* ---------- the detector for uploaded footage: COCO-SSD, self-hosted library, runs in this browser ---------- */
let model = null;
export async function loadDetector(){ if (model) return model;
  // TensorFlow.js assigns a global through Function() when the global is missing, which the console's security policy
  // (no eval) refuses; declaring it first keeps the policy strict.
  if (!("regeneratorRuntime" in window)) window.regeneratorRuntime = undefined;
  await loadVendor("tf"); await loadVendor("cocossd");
  model = await window.cocoSsd.load({ base: "lite_mobilenet_v2" }); return model; }
const BAGS = new Set(["backpack", "handbag", "suitcase"]);
export async function detect(img){ const preds = await (await loadDetector()).detect(img, 30, .45);
  return preds.filter(p => p.class === "person" || BAGS.has(p.class)).map(p => ({ cls: p.class === "person" ? "person" : "bag", box: p.bbox, score: p.score })); }
