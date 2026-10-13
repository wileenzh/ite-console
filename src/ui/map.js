// One map for every workspace. Each workspace says what to draw; the map draws it and keeps a selection.
import { $, esc, sgt } from "../core.js";
import { SITES, isOffice, isLive, TIER } from "../model.js";

export const cv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
let map = null, base = null, layers = null, siteLayer = null, sel = null, lastFit = "";
const BASES = { night: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", day: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}" };
export function initMap(){ if (map || typeof L === "undefined"){ if (typeof L === "undefined") $("#map").innerHTML = `<div class="empty"><b>The map could not load</b>This network blocks cdnjs.cloudflare.com. Everything else works.</div>`; return; }
  map = L.map("map", { zoomControl: true, worldCopyJump: true, attributionControl: true, preferCanvas: false }).setView([15, 115], 4);
  setBase(); siteLayer = L.layerGroup().addTo(map); layers = L.layerGroup().addTo(map);
  $("#mapcell").insertAdjacentHTML("beforeend", `<div class="maplegend">${TIER.map((t, i) => `<span><i style="background:var(--t${i})"></i>${esc(t.label)}</span>`).join("")}</div>`); }
export function setBase(){ if (!map) return; if (base) map.removeLayer(base); const day = document.documentElement.dataset.theme === "day";
  base = L.tileLayer(BASES[day ? "day" : "night"], { maxZoom: 16, attribution: "Tiles © Esri" }).addTo(map); }
export const mapReady = () => !!map;
export const leafletMap = () => map;
export function invalidate(){ if (map) setTimeout(() => map.invalidateSize(), 30); }
// draw: { signals: [], sites: [codes to emphasise], events: [], selected: key, onPick(key) , fitKey }
export function draw(o){ if (!map) return; layers.clearLayers(); siteLayer.clearLayers(); const hit = new Set(o.hitSites || []), bounds = [];
  SITES.forEach(s => { if (!isFinite(s.lat)) return; const h = hit.has(s.code); if (!h && o.quietSites) return;
    L.marker([s.lat, s.lon], { icon: L.divIcon({ className: "", html: `<div class="sitedot${isOffice(s) ? " off" : ""}${h ? " hit" : ""}"></div>`, iconSize: [h ? 9 : 7, h ? 9 : 7] }), keyboard: false, zIndexOffset: h ? 400 : 0 })
      .bindTooltip(`<b>${esc(s.code)}</b> ${esc(s.city || "")}<br>${esc(s.cls)} · ${esc(s.status)}`, { direction: "top" }).on("click", () => o.onSite && o.onSite(s.code)).addTo(siteLayer); if (h) bounds.push([s.lat, s.lon]); });
  (o.signals || []).forEach(s => { const on = s.key === o.selected;
    if (s.geo && on) try{ L.geoJSON(s.geo, { style: { color: cv(`--t${s.tier}`), weight: 1.5, fillOpacity: .12 } }).addTo(layers); }catch(e){}
    if (s.kind === "cyclone" && s.extra && s.extra.storm && (on || o.tracks)) drawStorm(s, on);
    if (s.kind === "volcano" && on && s.extra && s.extra.rings) s.extra.rings.forEach((r, i) => L.circle([s.lat, s.lon], { radius: r * 1000, color: i ? cv("--t1") : cv("--t3"), weight: 1.2, dashArray: i ? "4 5" : null, fillOpacity: i ? .03 : .08, interactive: false }).addTo(layers));
    if (s.kind === "quake" && on && s.extra) [3, 4, 5].forEach(mmi => { const r = quakeRadius(s.extra.mag, s.extra.depth, mmi); if (r > 1) L.circle([s.lat, s.lon], { radius: r * 1000, color: cv(`--t${mmi - 2}`), weight: 1, fillOpacity: .04, interactive: false }).bindTooltip(`Estimated MMI ${["III", "IV", "V"][mmi - 3]} and above`).addTo(layers); });
    if (!isFinite(s.lat) || !isFinite(s.lon)) return; const sz = 8 + s.tier * 3 + (on ? 4 : 0);
    L.marker([s.lat, s.lon], { icon: L.divIcon({ className: "", html: `<div class="mk t${s.tier}${on ? " sel" : ""}" style="width:${sz}px;height:${sz}px"></div>`, iconSize: [sz, sz] }), zIndexOffset: 1000 + s.tier * 100 + (on ? 2000 : 0), riseOnHover: true })
      .bindTooltip(`<b>${esc(s.title)}</b><br>${esc(TIER[s.tier].label)} · ${esc(sgt(s.t))}`, { direction: "top" }).on("click", () => o.onPick && o.onPick(s.key)).addTo(layers);
    if (on) bounds.push([s.lat, s.lon]); });
  (o.points || []).forEach(p => { L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "", html: `<div class="mk t${p.tier}${p.on ? " sel" : ""}" style="width:14px;height:14px"></div>`, iconSize: [14, 14] }) }).bindTooltip(esc(p.label), { direction: "top" }).on("click", () => p.go && p.go()).addTo(layers); if (p.on) bounds.push([p.lat, p.lon]); });
  if (o.fitKey && o.fitKey !== lastFit){ lastFit = o.fitKey; if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds).pad(.3), { maxZoom: 9, animate: true }); else if (bounds.length) map.setView(bounds[0], Math.max(map.getZoom(), 7), { animate: true }); }
  if (!o.fitKey){ const k = "ov:" + (o.ovKey || ""); if (lastFit !== k){ lastFit = k;      // back to an overview: frame everything listed, or the whole region
      const all = (o.signals || []).filter(s => s.tier >= 1 && isFinite(s.lat) && isFinite(s.lon)).map(s => [s.lat, s.lon]).concat((o.points || []).map(p => [p.lat, p.lon]));
      if (all.length > 1) map.fitBounds(L.latLngBounds(all).pad(.15), { maxZoom: 6, animate: true }); else map.setView(all[0] || [15, 115], all[0] ? 6 : 4, { animate: true }); } } }
function quakeRadius(mag, depth, mmi){ // invert the shaking estimate: distance at which estimated MMI falls to the given level
  const R = Math.pow(10, (mag + 1.5 - mmi) / 2.5); return R > depth ? Math.sqrt(R * R - depth * depth) : 0; }
function drawStorm(s, on){ const st = s.extra.storm, obs = s.extra.obs || [], pts = [st.now].concat(st.fc || []);
  (s.extra.cone || []).forEach(g => { try{ L.geoJSON(g, { style: { color: "#fff", weight: 1, dashArray: "4 4", fillOpacity: .06 } }).addTo(layers); }catch(e){} });
  if (obs.length > 1) L.polyline(obs.map(p => [p.lat, p.lon]), { color: cv("--muted"), weight: on ? 3 : 2 }).bindTooltip("Observed track").addTo(layers);
  if (pts.length > 1) L.polyline(pts.map(p => [p.lat, p.lon]), { color: cv("--signal"), weight: on ? 3 : 2, dashArray: "6 6" }).bindTooltip("Forecast track").addTo(layers);
  if (on) pts.forEach((p, i) => { if (p.probKm) L.circle([p.lat, p.lon], { radius: p.probKm * 1000, color: cv("--muted"), weight: 1, dashArray: "3 5", fillOpacity: .03, interactive: false }).addTo(layers);
    if (p.stormKm) L.circle([p.lat, p.lon], { radius: p.stormKm * 1000, color: cv("--t3"), weight: 1.2, fillColor: cv("--t3"), fillOpacity: i ? .05 : .12 }).bindTooltip(`Storm-force winds up to ${p.stormKm} km${p.time ? " · " + sgt(p.time) : ""}`).addTo(layers);
    if (i) L.circleMarker([p.lat, p.lon], { radius: 3, color: cv("--signal"), weight: 2, fillOpacity: 1 }).bindTooltip(`${p.time ? sgt(p.time) : "+" + p.h + " h"}${p.kt != null ? " · " + Math.round(p.kt) + " kt" : ""}${p.hpa ? " · " + p.hpa + " hPa" : ""}`).addTo(layers); }); }
export function flyTo(lat, lon, z){ if (map && isFinite(lat)) map.setView([lat, lon], z || Math.max(map.getZoom(), 9), { animate: true }); }
export function pickPoint(){ return new Promise(res => { if (!map) return res(null); const c = map.getContainer(); c.style.cursor = "crosshair";
  const done = ll => { map.off("click", fn); c.style.cursor = ""; res(ll); }, fn = e => done(e.latlng); map.on("click", fn); setTimeout(() => { if (c.style.cursor) done(null); }, 60000); }); }
