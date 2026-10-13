// Messages the PSOC sends: the Intelligence Channel post, the leadership update, the stakeholder email.
// Written from what the console knows; anything it cannot know is left as (confirm).
import { sgt, compass, bearing, km } from "../core.js";
import { CFG } from "../config.js";
import { siteBy, contactFor, SOP_REF, REN, KINDS, catFor, CITIES, SITES, cad } from "../model.js";
import { leadershipUpdate, welfareUpdate } from "../sources/quakes.js";

const catLabel = c => (SOP_REF[c] || {}).label || c;
const siteLine = (codes, lat, lon) => codes.slice(0, 12).map(c => { const s = siteBy(c); if (!s) return c; const d = isFinite(lat) ? ` (${Math.round(km(lat, lon, s.lat, s.lon))} km)` : ""; return `${c}${s.city ? " " + s.city : ""}${d}`; }).join(", ") + (codes.length > 12 ? ` and ${codes.length - 12} more` : "");
const placeOf = o => o.area || (o.cities && o.cities[0]) || o.country || "(confirm location)";

export function draftsForSignal(sig){ const codes = sig.sites.map(x => x.code), out = [];
  if (sig.kind === "quake") out.push({ id: "leadership", label: "Leadership update", text: leadershipUpdate(sig, compass, bearing), to: CFG.psoc.leaders },
    { id: "welfare", label: "Welfare update", text: welfareUpdate(sig), to: CFG.psoc.leaders });
  out.push({ id: "intel", label: "Intelligence Channel post", text: `${placeOf(sig)} | ${catLabel(catFor(sig))} | ${sig.title}\n\n${sig.text || ""}\n\nSites in range: ${codes.length ? siteLine(codes, sig.lat, sig.lon) : "none identified"}.\nSource: ${sig.url || sig.src}\nIdentified ${sgt(sig.t)} SGT. PSOC is monitoring.`, to: CFG.psoc.intelChannel });
  return out; }
export function draftsForEvent(ev){ const sig = ev.firstSignal, out = [], codes = ev.sites, where = ev.country || "(confirm country)", now = sgt(Date.now());
  if (sig && sig.kind === "quake") out.push({ id: "leadership", label: "Leadership update (earthquake template)", text: leadershipUpdate(sig, compass, bearing), to: CFG.psoc.leaders }, { id: "welfare", label: "Welfare update", text: welfareUpdate(sig), to: CFG.psoc.leaders });
  else out.push({ id: "leadership", label: "Leadership update", to: CFG.psoc.leaders,
    text: `${where} | ${catLabel(ev.cat)} | ${ev.title}\n\nAt ${now} SGT, PSOC is tracking: ${ev.title}.\n\nImpact to company personnel, assets and operations: at the time of reporting, no impacts have been identified (confirm).\n\nSites in the affected area: ${codes.length ? siteLine(codes, ev.lat, ev.lon) : "(confirm)"}.\n\nEvent notice: ${REN[ev.ren].toLowerCase()}. Severity ${ev.sev}.\n\nMonitoring is ongoing. Next update by ${sgt(ev.last12 + cad(ev).m * 3600e3)} SGT.` });
  out.push({ id: "intel", label: "Intelligence Channel post", to: CFG.psoc.intelChannel, text: `${where} | ${catLabel(ev.cat)} | ${ev.sev}\n${ev.title}\n\nSites: ${codes.length ? siteLine(codes, ev.lat, ev.lon) : "(confirm)"}\nEvent notice: ${REN[ev.ren].toLowerCase()}\nUpdated ${now} SGT by PSOC.` });
  const contacts = codes.map(c => contactFor({ code: c })).filter(Boolean), dg = contacts.map(c => c.securityDG).filter(Boolean);
  out.push({ id: "stakeholders", label: "Site stakeholders email", to: dg.join("; "), subject: `PSOC | ${where} | ${catLabel(ev.cat)} | ${ev.title}`,
    text: `Hello,\n\nPSOC is tracking: ${ev.title}.\n\nYour site${codes.length === 1 ? "" : "s"} in the area: ${codes.length ? siteLine(codes, ev.lat, ev.lon) : "(confirm)"}.\n\nPlease confirm the safety of personnel on site and any operational impact by replying to this email or calling the PSOC watch desk${CFG.psoc.desk ? " on " + CFG.psoc.desk : ""}.\n\nRecommended actions are in the ${catLabel(ev.cat)} SOP.\n\nPSOC` });
  return out; }
export function mailto(d){ return `mailto:${encodeURIComponent(d.to || "")}?subject=${encodeURIComponent(d.subject || d.text.split("\n")[0])}&body=${encodeURIComponent(d.text)}`; }
// the same text as HTML, so a paste into Teams or Outlook keeps paragraphs and working links
export function asHtml(text){ const e = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text.split(/\n{2,}/).map(p => `<p>${e(p).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, "<br>")}</p>`).join(""); }
