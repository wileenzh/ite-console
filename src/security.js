// Security controls that live in the page itself (the full architecture is in the security architecture document).
// 1. A content security policy: the console may contact only the services listed here, plus the relay, PSOC server,
//    model gateway and CAP feeds an administrator sets. Anything else — including an injected script trying to send
//    data out — is refused by the browser.
// 2. Placeholders for site codes and names in everything sent to a language model, restored in the answer.
import { CFG } from "./config.js";
import { SITES } from "./model.js";

export const HOSTS = {
  hazards: ["https://earthquake.usgs.gov", "https://www.seismicportal.eu", "https://www.gdacs.org", "https://eonet.gsfc.nasa.gov", "https://volcano.si.edu", "https://www.tsunami.gov", "https://severeweather.wmo.int"],
  agencies: ["https://www.jma.go.jp", "https://apihub.kma.go.kr", "https://opendata.cwa.gov.tw", "https://data.weather.gov.hk", "https://api.data.gov.sg", "https://api-open.data.gov.sg", "https://api.data.gov.my",
    "https://api.bmkg.go.id", "https://www.bmkg.go.id", "https://www.tmd.go.th", "https://tmd.go.th", "https://sachet.ndma.gov.in", "https://publicinfobanjir.water.gov.my"],
  conditions: ["https://api.open-meteo.com", "https://air-quality-api.open-meteo.com", "https://flood-api.open-meteo.com", "https://api.waqi.info"],
  people: ["https://api.gdeltproject.org", "https://acleddata.com", "https://cadataapi.state.gov", "https://data.international.gc.ca", "https://www.auswaertiges-amt.de", "https://www.smartraveller.gov.au",
    "https://*.usembassy.gov", "https://hk.usconsulate.gov", "https://china.usembassy-china.org.cn", "https://www.ait.org.tw"],
  tools: ["https://photon.komoot.io", "https://nominatim.openstreetmap.org", "https://api.anthropic.com", "https://storage.googleapis.com"],
  tiles: ["https://server.arcgisonline.com"],
  video: ["https://d2e1asnsl7br7b.cloudfront.net", "https://mediacorp-videosbclive.akamaized.net", "https://nhkwlive-ojp.akamaized.net", "https://dwamdstream102.akamaized.net", "https://*.getaj.net", "https://*.thehlive.com"] };
const origin = u => { try{ return new URL(u).origin; }catch(e){ return null; } };
export function policy(){ const dyn = [CFG.relay, CFG.server, CFG.llm && CFG.llm.provider === "gateway" ? CFG.llm.url : "", ...((CFG.capFeeds || []).map(f => f.url))].map(origin).filter(Boolean);
  const connect = [...new Set([...Object.values(HOSTS).flat(), ...dyn])].join(" ");
  return [`default-src 'self'`, `script-src 'self' 'unsafe-inline' file:`, `style-src 'self' 'unsafe-inline' file:`, `font-src 'self' file: data:`, `img-src 'self' file: data: blob: ${HOSTS.tiles.join(" ")}`,
    `connect-src 'self' file: ${connect}`, `media-src 'self' blob: ${HOSTS.video.join(" ")}`, `frame-src https://www.youtube.com`, `worker-src 'self' blob:`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`].join("; "); }
// applied once at start; a change of relay, server or gateway takes effect after a reload
export function applyCSP(){ if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return; const m = document.createElement("meta"); m.httpEquiv = "Content-Security-Policy"; m.content = policy(); document.head.prepend(m); }

/* ---------- placeholders for site codes and names in model prompts ---------- */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function redactor(){ if (CFG.llm && CFG.llm.redact === false) return { hide: t => t, show: t => t, n: () => 0 };
  const names = SITES.flatMap(s => [s.code, s.name]).filter(x => x && x.length > 2).sort((a, b) => b.length - a.length), map = new Map(), back = new Map();
  const re = names.length ? new RegExp(`(?<![\\w-])(${names.map(reEsc).join("|")})(?![\\w-])`, "g") : null;
  const hide = t => typeof t !== "string" || !re ? t : t.replace(re, m => { if (!map.has(m)){ const p = `SITE-${map.size + 1}`; map.set(m, p); back.set(p, m); } return map.get(m); });
  const show = t => typeof t !== "string" ? t : t.replace(/SITE-\d+/g, p => back.get(p) || p);
  return { hide, show, n: () => map.size }; }
