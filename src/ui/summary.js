// Watch › Summary: PULSE's operational picture at a glance — six counts and four small charts, nothing to configure.
import { esc, sgt } from "../core.js";
import { CFG } from "../config.js";
import { STATE, SITES, HISTORY, REGIONS, isLive, isOffice, openEvents, timers } from "../model.js";
import { classBand } from "./map.js";

const bars = (rows, unit = "") => { const max = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="bars">${rows.map(([l, v, tier]) => `<div class="b"><span class="l">${esc(l)}</span><span class="track"><i class="${tier != null ? "t" + tier : ""}" style="width:${(v / max * 100).toFixed(1)}%"></i></span><span class="v">${v}${unit}</span></div>`).join("")}</div>`; };
export function summaryHtml(){ const now = Date.now(), day = now - 864e5, live = SITES.filter(s => isLive(s) || isOffice(s));
  const quakes = STATE.list.filter(s => s.kind === "quake" && s.t > day), alarm = quakes.filter(q => q.alarm), inRange = new Set(alarm.flatMap(q => q.sites.map(x => x.code)));
  const storms = STATE.list.filter(s => s.kind === "cyclone"), adv = HISTORY.filter(h => h.kind === "warning" && h.first > day), evs = openEvents(), over = evs.filter(e => timers(e).state === "overdue");
  const tile = (n, l, hot, go) => `<button class="kpi${hot ? " hot" : ""}" ${go}><b>${n}</b><span>${esc(l)}</span></button>`;
  const cls = [["A and B", "ab"], ["C and C-PE", "c"], ["Edge", "e"], ["Offices", "o"]].map(([l, k]) => [l, live.filter(s => classBand(s.cls) === k).length]);
  const reg = REGIONS.map(r => [r, live.filter(s => (s.region || "") === r).length]);
  const close = alarm.map(q => [q.title.replace(/^M/, "M"), q.near ? Math.round(q.near.km) : 0]).sort((a, b) => a[1] - b[1]).slice(0, 6);
  const hours = Array.from({ length: 24 }, (_, i) => { const a = now - (24 - i) * 3600e3, b = a + 3600e3, h = quakes.filter(q => q.t >= a && q.t < b); return [h.length, Math.max(0, ...h.map(q => q.extra.mag))]; });
  const hmax = Math.max(1, ...hours.map(h => h[0]));
  return `<div class="summary"><div class="kpis">
      ${tile(live.length, "sites tracked (live and offices)", false, `data-ws="sites"`)}
      ${tile(evs.length, over.length ? `open escalations, ${over.length} overdue` : "open escalations", over.length > 0, `data-ws="events"`)}
      ${tile(quakes.length, "earthquakes in the last 24 h", alarm.length > 0, `data-wkindgo="quake"`)}
      ${tile(inRange.size, "sites in alarm range", inRange.size > 0, `data-wkindgo="quake"`)}
      ${tile(storms.length, "active tropical cyclones", storms.some(s => s.tier >= 2), `data-wkindgo="cyclone"`)}
      ${tile(adv.length, "official warnings in 24 h", adv.some(a => a.tier >= 2), `data-wkindgo="warning"`)}</div>
    <div class="charts"><section><h3>Estate by class</h3>${bars(cls)}</section><section><h3>Sites by region</h3>${bars(reg)}</section>
      <section><h3>Closest site to each alarm quake, 24 h</h3>${close.length ? bars(close.map(([l, v]) => [l, v, v <= CFG.quake.nearKm / 2 ? 3 : 2]), " km") : `<p class="help">No alarm quakes in the last 24 hours.</p>`}</section>
      <section><h3>Seismic activity, last 24 h</h3><div class="spark" title="Earthquakes per hour; colour shows the strongest that hour">${hours.map(([n, m]) => `<i class="t${m >= CFG.quake.globalMag ? 3 : m >= CFG.quake.nearMag ? 2 : m >= 4 ? 1 : 0}" style="height:${(n / hmax * 100).toFixed(0)}%" title="${n} quake${n === 1 ? "" : "s"}${n ? ", strongest M" + m.toFixed(1) : ""}"></i>`).join("")}</div>
        <div class="help" style="display:flex;justify-content:space-between"><span>${esc(sgt(now - 864e5).split(", ").pop())}</span><span>now</span></div></section></div></div>`; }
