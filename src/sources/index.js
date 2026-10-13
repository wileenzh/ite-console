// Every source is registered once: what it is, how often it runs, whether it needs a key, and run().
// run() returns signals (or fills city data) and the runner records health for the Sources page.
import { STATE, setSignals, feedResult, recompute } from "../model.js";
import { CFG } from "../config.js";

export const SOURCES = [];
export function register(s){ SOURCES.push(Object.assign({ every: 10 * 60e3, key: "No", group: "Hazards" }, s)); }
const busy = {};
export async function runSource(s){
  if (busy[s.id]) return; if (s.enabled && !s.enabled()){ feedResult(s.id, { off: true, ok: null, err: s.offWhy ? s.offWhy() : "switched off" }); return; }
  busy[s.id] = true; const t0 = performance.now();
  try{ const out = await s.run(); if (Array.isArray(out)) setSignals(s.id, out); else recompute();
    feedResult(s.id, { off: false, ok: true, err: null, at: Date.now(), ms: Math.round(performance.now() - t0), n: Array.isArray(out) ? out.length : (s.count ? s.count() : null) }); }
  catch(e){ feedResult(s.id, { off: false, ok: false, err: e && e.name === "AbortError" ? "timed out" : (e && e.message) || "failed", at: Date.now(), ms: Math.round(performance.now() - t0) }); }
  finally{ busy[s.id] = false; }
}
export const runAll = () => Promise.all(SOURCES.filter(s => !s.manual).map(runSource));
let started = false;
export function startSchedule(){ if (started) return; started = true;
  SOURCES.forEach((s, i) => { setTimeout(() => runSource(s), 300 + i * 450);                 // staggered so they don't all hit at once
    if (s.worker){ try{ const w = new Worker(URL.createObjectURL(new Blob([`setInterval(() => postMessage(1), ${s.every});`], { type: "application/javascript" }))); w.onmessage = () => runSource(s); return; }catch(e){} }
    setInterval(() => runSource(s), s.every); }); }
export const feedOf = id => STATE.feeds[id] || {};
export { CFG };
