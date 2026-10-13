// Settings: defaults, what is saved in this browser, and the one-time import from the current console.
import { load, save, loadRaw, setRelay } from "./core.js";

export const DEFAULTS = {
  quake: { globalMag: 6.5, nearMag: 5.5, nearKm: 200, listMag: 2.5, pollSec: 30, scope: "live" },
  aqi: { monitor: 100, manager: 150, intel: 200 },
  wx: { windWarn: 25, windBad: 40, rainWarn: 5, rainBad: 15, hotWarn: 33, hotBad: 37, coldWarn: 0, coldBad: -5 },
  fc: { gustWarn: 60, gustBad: 90, rainWarn: 50, rainBad: 100, heat: 37 },
  river: { warn: 2, bad: 4 },
  ranges: { cycloneWatchKm: 500, gdacsKm: 300, eonetKm: 300, volcanoCloseKm: 100, volcanoNearKm: 250, tsunamiKm: 1500 },
  // what opens an Inbox item without anyone asking (the SOP triggers)
  rules: { quake: true, warnings: true, cyclone: true, volcano: true, air: true, gdacs: true, unrest: true, travel: true, conditions: true },
  keys: { waqi: "", cwa: "", kma: "", claude: "" },
  // the language model every drafting feature uses: Anthropic directly with a key, or a company gateway that speaks the same API
  llm: { provider: "anthropic", model: "claude-sonnet-5-5", url: "", header: "", headerValue: "" },
  agency: { jmaPrefs: ["130000", "120000", "110000", "140000", "270000", "280000", "260000"], kmaAreas: ["seoul", "busan"],
    bmkgAreas: "32.15.03.2004|Karawang (KIIC vicinity);32.75.03.1002|Bekasi (Perwira);31.71.01.1001|Central Jakarta (Gambir);31.73.02.1003|West Jakarta (Tomang)",
    sachetStates: "maharashtra,telangana,tamil_nadu,gujarat", off: {} },
  unrest: { countries: ["philippines", "indonesia", "burma", "thailand", "hongkong", "bangladesh", "pakistan"] },
  wxModels: "national",
  cadence: "ttp",          // update timers: "ttp" follows the imported REN TTP per category; "fixed" is 12 h / 24 h
  relay: "", server: "",
  psoc: { desk: "", mobile: "", email: "", leaders: "", intelChannel: "" },
  notify: { desktop: false, sound: false, level: "P2", chime: false },   // desktop alerts for P1 only or P1 and P2; a short chime for new items
};

function merge(a, b){ const o = Array.isArray(a) ? (Array.isArray(b) ? b.slice() : a.slice()) : Object.assign({}, a);
  if (Array.isArray(a)) return o; Object.keys(b || {}).forEach(k => { o[k] = (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") ? merge(a[k], b[k]) : b[k]; }); return o; }

export const CFG = merge(DEFAULTS, load("settings", {}));
setRelay(CFG.relay || CFG.server);
export function saveCfg(){ save("settings", CFG); setRelay(CFG.relay || CFG.server); }
export function resetCfg(){ Object.keys(CFG).forEach(k => delete CFG[k]); Object.assign(CFG, JSON.parse(JSON.stringify(DEFAULTS))); saveCfg(); }

/* ---------- first start: bring over what the current console (same browser) already holds ---------- */
export function migrateFromCurrentConsole(){
  if (load("migrated", false)) return null;
  const old = loadRaw("psoc.uni.settings.v1", null), report = [];
  if (old){
    const q = old.quake || {}; ["globalMag", "nearMag", "nearKm", "listMag"].forEach(k => { if (isFinite(q[k])) CFG.quake[k] = q[k]; });
    ["aqi", "wx", "fc", "river"].forEach(g => Object.keys(DEFAULTS[g]).forEach(k => { if (old[g] && isFinite(old[g][k])) CFG[g][k] = old[g][k]; }));
    if (old.waqiToken) CFG.keys.waqi = old.waqiToken; const ag = old.agency || {};
    if (ag.cwaKey) CFG.keys.cwa = ag.cwaKey; if (ag.kmaKey) CFG.keys.kma = ag.kmaKey; if (ag.sachetStates) CFG.agency.sachetStates = ag.sachetStates;
    if (Array.isArray(ag.jmaPrefs)) CFG.agency.jmaPrefs = ag.jmaPrefs; if (Array.isArray(ag.kmaAreas)) CFG.agency.kmaAreas = ag.kmaAreas; if (ag.bmkgAreas) CFG.agency.bmkgAreas = ag.bmkgAreas;
    if (old.relayUrl) CFG.relay = old.relayUrl; if (old.serverUrl) CFG.server = old.serverUrl;
    if (old.psoc) Object.assign(CFG.psoc, old.psoc); if (old.comms && old.comms.leaders) CFG.psoc.leaders = old.comms.leaders;
    if (old.pulse && Array.isArray(old.pulse.protestCountries)) CFG.unrest.countries = old.pulse.protestCountries;
    report.push("settings and keys");
  }
  const claude = (() => { try{ return localStorage.getItem("psoc.uni.claudekey.v1") || ""; }catch(e){ return ""; } })(); if (claude) CFG.keys.claude = claude;
  saveCfg(); save("migrated", Date.now()); return report;
}
