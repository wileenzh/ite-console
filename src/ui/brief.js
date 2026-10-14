// "Copy brief for handover": a short plain-text summary of any report, ready for Teams, email or the shift log.
import { sgt } from "../core.js";
import { siteBy, KINDS, TIER } from "../model.js";
import { roman, magLabel } from "../sources/quakes.js";
import { tcClass } from "../sources/hazards.js";

const RISK = { direct: "In the path", possible: "May be affected", watch: "Worth watching" };
const hhmm = t => t ? sgt(t) + " SGT" : "—";
export function briefFor(s){ const e = s.extra || {}, L = [];
  L.push(`${s.title}`, `${KINDS[s.kind].label} · ${TIER[s.tier].label} · reported ${sgt(s.t)} SGT${s.end ? ", until " + sgt(s.end) + " SGT" : ""}`);
  if (s.area || s.cities.length) L.push(`Where: ${s.area || s.cities.join(", ")}`);
  if (s.kind === "quake") L.push(`M${e.mag.toFixed(1)} (${magLabel(e.mag)}), depth ${Math.round(e.depth)} km.${e.topSite ? ` Strongest estimated shaking at a site: MMI ${roman(e.topMMI)} at ${e.topSite}, ${Math.round(e.topKm)} km.` : ""} ${e.tsunami ? "USGS tsunami flag set." : "No tsunami flag."}${e.alert ? " PAGER " + e.alert + "." : ""}`);
  if (s.kind === "cyclone" && e.storm){ const n = e.storm.now, c = tcClass(n.kt); L.push(`${c[1]}${n.kt != null ? `, ${Math.round(n.kt)} kt (${Math.round(n.kt * 1.852)} km/h)` : ""}${n.hpa ? `, ${n.hpa} hPa` : ""}${n.course ? `, moving ${n.course}${n.speed ? " at " + n.speed + " km/h" : ""}` : ""}.`); }
  if (s.text && s.kind !== "quake") L.push(s.text);
  if (s.sites.length){ L.push("", `Sites (${s.sites.length}):`);
    s.sites.slice(0, 25).forEach(x => { const st = siteBy(x.code) || {}, place = [st.city, st.cls].filter(Boolean).join(", ");
      L.push(`  • ${x.code}${place ? " (" + place + ")" : ""}${x.km ? ` — ${Math.round(x.km)} km` : ""}${x.mmi ? `, est. MMI ${roman(x.mmi)}` : ""}${x.level ? `, ${RISK[x.level] || x.level}${x.level !== "watch" && x.at ? `, damaging winds from ${hhmm(x.at)}${x.open ? " to the end of the forecast" : x.until && x.until !== x.at ? " to " + hhmm(x.until) : ""}` : ""}${x.closestAt ? `, closest ${hhmm(x.closestAt)}` : ""}` : ""}`); });
    if (s.sites.length > 25) L.push(`  and ${s.sites.length - 25} more`); }
  else if (s.near) L.push(`Nearest site: ${s.near.code}, ${Math.round(s.near.km)} km.`);
  if (s.url) L.push("", `Source: ${s.url}`);
  return L.join("\n"); }
