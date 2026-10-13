// Sites added by hand, and reading a PULSE file. The estate is fictional, so a PULSE file brings in only the
// REN TTP (when newer than the one built in), the PSOC watch desk contacts and, if ticked, its keys —
// never its site list or site contacts. Everything read stays in this browser.
import { load, save } from "./core.js";
import { SITES, EVENTS, saveEvents, applyCadence, setSites, audit } from "./model.js";
import { CFG, saveCfg } from "./config.js";
import { extractTTP, setTTP, ttpName } from "./ttp.js";

/* sites added by hand: kept in this browser on top of the fictional estate */
export const manualSites = () => load("manualSites", []);
export function addManualSite(x){ const site = Object.assign({ manual: true, src: "MANUAL" }, x); save("manualSites", manualSites().filter(m => m.code !== x.code).concat([site]));
  setSites(SITES.filter(s => s.code !== x.code).concat([site])); audit("Site added by hand", x.code); }
export function removeManualSite(code){ save("manualSites", manualSites().filter(m => m.code !== code)); setSites(SITES.filter(s => !(s.code === code && s.manual))); audit("Site removed", code); }

export async function readPulseFile(file){ const txt = await file.text(), found = { file: file.name, keys: {} };
  const grab = name => { const m = new RegExp("const " + name + " = (\\{[\\s\\S]*?\\}|\\[[\\s\\S]*?\\]);\\n").exec(txt); if (!m) return null; try{ return JSON.parse(m[1]); }catch(e){ return null; } };
  found.watch = grab("PSOC_WATCH");
  try{ const dec = b => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))), mods = {}; txt.replace(/^\s*([a-z]+): "([A-Za-z0-9+/=]{1000,})"/gm, (m, k, b) => { mods[k] = b; return m; });
    if (mods.watch){ const w = dec(mods.watch), c = /CWA_KEY\s*=\s*'([^']+)'/.exec(w), k = /KMA_KEY\s*=\s*'([^']+)'/.exec(w); if (c && !/YOUR/.test(c[1])) found.keys.cwa = c[1]; if (k && !/YOUR/.test(k[1])) found.keys.kma = k[1]; }
    const aq = mods.airquality || mods.weather; if (aq){ const a = /waqiToken:\s*"([^"]+)"/.exec(dec(aq)); if (a) found.keys.waqi = a[1]; }
    if (mods.tracker) try{ found.ttp = await extractTTP(dec(mods.tracker)); }catch(e){ found.ttpErr = e.message; } }catch(e){}
  if (!found.ttp && !found.watch && !Object.keys(found.keys).length) throw new Error("nothing usable found — is this a PULSE dashboard file?");
  return found; }
export function applyPulse(found, pick){ const done = [];
  if (pick.ttp && found.ttp){ const n = setTTP(found.ttp, found.file); let moved = 0; EVENTS.forEach(ev => { if (applyCadence(ev, "REN TTP updated")) moved++; }); if (moved) saveEvents();
    done.push(`${ttpName()} (${n} categories${moved ? `; cadence applied to ${moved} open escalation${moved === 1 ? "" : "s"}` : ""})`); }
  if (pick.watch && found.watch){ Object.assign(CFG.psoc, { desk: found.watch.desk || "", mobile: found.watch.mobile || "", email: found.watch.email || "" }); done.push("PSOC desk contacts"); }
  ["cwa", "kma", "waqi"].forEach(k => { if (pick["key_" + k] && found.keys[k]){ CFG.keys[k] = found.keys[k]; done.push(k.toUpperCase() + " key"); } });
  saveCfg(); audit("Imported from PULSE file", found.file, done.join(", ")); return done; }
