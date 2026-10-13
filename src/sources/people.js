// Unrest and news (GDELT, US Embassy demonstration alerts) and government travel advisories.
import { fetchText, viaRelay, relayJSON, xmlDoc, tx, stripHtml, load, save, sleep } from "../core.js";
import { CFG } from "../config.js";
import { CITIES, SITES, siteCountries, watchSites, sitesNear } from "../model.js";
import { register } from "./index.js";
import COUNTRIES from "../data/countries.json";

export const CC_NAME = COUNTRIES;
const NAME_CC = (() => { const m = {}; Object.entries(COUNTRIES).forEach(([cc, n]) => { m[n.toLowerCase()] = cc; });
  Object.assign(m, { "south korea": "KR", "korea, south": "KR", "north korea": "KP", "taiwan": "TW", "hong kong": "HK", "macau": "MO", "vietnam": "VN", "laos": "LA", "burma": "MM", "myanmar": "MM", "russia": "RU", "iran": "IR", "syria": "SY", "turkey": "TR", "türkiye": "TR",
    "united states": "US", "united kingdom": "GB", "east timor": "TL", "timor-leste": "TL", "brunei": "BN", "the philippines": "PH", "philippines": "PH", "korea": "KR", "republic of korea": "KR", "hong kong sar": "HK", "hong kong sar, china": "HK" }); return m; })();
export function ccFor(name){ const n = String(name || "").toLowerCase().replace(/\s+(travel advisory|travel advice)$/, "").replace(/^the /, "").trim();
  for (const t of [n, n.replace(/\s*\(.*\)\s*/g, "").trim(), (/\(([^)]+)\)/.exec(n) || [])[1], n.split(",")[0].trim()]) if (t && NAME_CC[t]) return NAME_CC[t]; return null; }
const siteCC = () => new Set(SITES.map(s => ccFor(s.country)).filter(Boolean));
const gdeltTime = s => { const m = /^(\d{4})(\d\d)(\d\d)T?(\d\d)(\d\d)(\d\d)/.exec(String(s || "")); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : Date.now(); };
export function unrestClass(t){ t = String(t || "").toLowerCase();
  if (/\bkill(ed|ing)?\b|\bdead\b|\bdeaths?\b|\bfatal\b|shot dead|gunfire|live rounds|explosion|\bbomb(ed|ing)?\b|martial law|\bcoup\b|massacre/.test(t)) return [2, "severe / violent"];
  if (/clash(es|ed)?|violence|tear gas|injured|wounded|arrest(ed|s)?|crackdown|\briot(s|ing)?\b|water cannon|curfew|detain(ed|s)?/.test(t)) return [1, "clashes / unrest"];
  return [0, "protest / demonstration"]; }

/* ---------- protest coverage by country (one combined GDELT request, so GDELT does not rate-limit it) ---------- */
export const UNREST_COUNTRIES = [["philippines", "Philippines", "PH"], ["indonesia", "Indonesia", "ID"], ["burma", "Myanmar", "MM"], ["thailand", "Thailand", "TH"], ["hongkong", "Hong Kong", "HK"], ["bangladesh", "Bangladesh", "BD"],
  ["pakistan", "Pakistan", "PK"], ["india", "India", "IN"], ["srilanka", "Sri Lanka", "LK"], ["nepal", "Nepal", "NP"], ["vietnam", "Vietnam", "VN"], ["cambodia", "Cambodia", "KH"], ["laos", "Laos", "LA"], ["malaysia", "Malaysia", "MY"],
  ["singapore", "Singapore", "SG"], ["southkorea", "South Korea", "KR"], ["japan", "Japan", "JP"], ["taiwan", "Taiwan", "TW"], ["china", "China", "CN"], ["mongolia", "Mongolia", "MN"], ["australia", "Australia", "AU"], ["newzealand", "New Zealand", "NZ"],
  ["papuanewguinea", "Papua New Guinea", "PG"], ["fiji", "Fiji", "FJ"], ["afghanistan", "Afghanistan", "AF"]];
register({ id: "gdeltunrest", name: "Protest coverage (GDELT)", provider: "GDELT Project DOC 2.0", what: "News of protests, demonstrations and unrest in the countries chosen in Settings, last 24 h, graded by severity", group: "Unrest & news", every: 15 * 60e3,
  enabled: () => (CFG.unrest.countries || []).length > 0, offWhy: () => "no countries chosen",
  async run(attempt = 1){ const cs = UNREST_COUNTRIES.filter(c => CFG.unrest.countries.includes(c[0]));
    const q = '(protest OR demonstration OR rally OR "civil unrest" OR riot OR strike OR "tear gas") (' + cs.map(c => "sourcecountry:" + c[0]).join(" OR ") + ")";
    const r = await fetchText("https://api.gdeltproject.org/api/v2/doc/doc?query=" + encodeURIComponent(q) + "&mode=artlist&maxrecords=250&timespan=24h&sort=datedesc&format=json", {}, 30000);
    if (r.status === 429){ if (attempt < 3){ await sleep(6000 * attempt); return this.run(attempt + 1); } throw new Error("GDELT is rate-limiting this browser; it retries next cycle"); }
    if (!r.ok) throw new Error("HTTP " + r.status); let j; try{ j = JSON.parse(r.text); }catch(e){ throw new Error("GDELT returned no data (" + r.text.slice(0, 60) + ")"); }
    return (j.articles || []).map(a => { const code = String(a.sourcecountry || "").toLowerCase().replace(/\s+/g, ""), c = cs.find(x => x[0] === code); if (!c) return null; const [lvl, label] = unrestClass(a.title);
      const cities = CITIES.filter(x => x.cc === c[2] && String(a.title).toLowerCase().includes(x.name.toLowerCase())).map(x => x.name);
      return { id: "gdelt:" + (a.url || a.title), src: "gdeltunrest", kind: "unrest", rule: "unrest", cat: "protest", title: `${c[1]}: ${a.title}`, tier: lvl === 2 ? 2 : lvl, cc: c[2], t: gdeltTime(a.seendate), url: a.url,
        text: `${a.domain || ""} · ${label} (automated, unverified)`, cities, citySites: true, sites: [], extra: { country: c[1], domain: a.domain, grade: label }, countryWide: !cities.length }; }).filter(Boolean)
      // country-level coverage only reaches the Inbox when it is violent; the rest stays in the feed
      .map(s => { if (s.countryWide && s.tier >= 2){ s.cities = CITIES.filter(x => x.cc === s.cc).map(x => x.name).slice(0, 1); } return s; }); } });

/* ---------- security news near our cities (GDELT) ---------- */
const NEWS_TERMS = ["protest", "explosion", "fire", "flood", "attack", "blackout", "outage", "evacuation", "earthquake", "typhoon", "shooting", "strike", "data center", "data centre"];
register({ id: "gdeltnews", name: "News (GDELT)", provider: "GDELT Project DOC 2.0", what: "Security and hazard news naming our cities, last 12 h", group: "Unrest & news", every: 30 * 60e3,
  async run(){ const out = [], groups = [CITIES.slice(0, 11), CITIES.slice(11, 21), CITIES.slice(21)];
    for (let i = 0; i < groups.length; i++){ if (i) await sleep(6500);
      const q = `(${groups[i].map(c => c.name.includes(" ") ? `"${c.name}"` : c.name).join(" OR ")}) (${NEWS_TERMS.map(t => t.includes(" ") ? `"${t}"` : t).join(" OR ")}) sourcelang:english`;
      const r = await fetchText(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&format=json&maxrecords=75&sort=DateDesc&timespan=12h`, {}, 30000);
      let j = null; try{ j = JSON.parse(r.text); }catch(e){ if (i === 0) throw new Error(/limit/i.test(r.text) ? "rate-limited by GDELT; retries next cycle" : "GDELT returned no data"); continue; }
      (j.articles || []).forEach(a => { const cities = groups[i].filter(c => String(a.title).toLowerCase().includes(c.name.toLowerCase())).map(c => c.name); if (!cities.length) return;
        const dc = /data ?cent(er|re)/i.test(a.title), [lvl] = unrestClass(a.title);
        out.push({ id: "news:" + (a.url || a.title), src: "gdeltnews", kind: "news", rule: "unrest", cat: "operational_security", title: a.title, tier: dc && lvl ? 2 : lvl ? 1 : 0, cc: (CITIES.find(c => c.name === cities[0]) || {}).cc, t: gdeltTime(a.seendate), url: a.url, text: a.domain || "", cities, extra: { domain: a.domain } }); }); }
    const seen = new Set(); return out.filter(s => { const k = s.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; }); } });

/* ---------- US Embassy demonstration alerts ---------- */
const EMB = { JP: "jp.usembassy.gov", KR: "kr.usembassy.gov", CN: "china.usembassy-china.org.cn", HK: "hk.usconsulate.gov", TW: "www.ait.org.tw", SG: "sg.usembassy.gov", MY: "my.usembassy.gov", ID: "id.usembassy.gov", TH: "th.usembassy.gov",
  PH: "ph.usembassy.gov", VN: "vn.usembassy.gov", IN: "in.usembassy.gov", AU: "au.usembassy.gov", NZ: "nz.usembassy.gov" };
register({ id: "embassy", name: "US Embassy demonstration alerts", provider: "US Embassies and consulates", what: "Security alerts about demonstrations in countries with our sites: date, place and crowd size", group: "Unrest & news", every: 60 * 60e3, key: "No (relay)",
  async run(){ const out = [], errs = [], ccs = [...siteCC()].filter(cc => EMB[cc]);
    await Promise.all(ccs.map(async cc => { try{ const doc = xmlDoc(await viaRelay(`https://${EMB[cc]}/?s=demonstration&feed=rss2`));
        [...doc.getElementsByTagName("item")].slice(0, 10).forEach(it => { const title = tx(it, "title"), link = tx(it, "link"), t = Date.parse(tx(it, "pubDate")) || 0, body = stripHtml(tx(it, "encoded") || tx(it, "description"));
          if (!/demonstrat|protest|rally|march/i.test(title + " " + body) || Date.now() - t > 21 * 86400e3) return; const cities = CITIES.filter(c => c.cc === cc && (title + " " + body).toLowerCase().includes(c.name.toLowerCase())).map(c => c.name);
          const size = (/(\d[\d,]*)(?:\s*(?:-|–|to)\s*(\d[\d,]*))?\s+(?:expected\s+)?(?:protesters|demonstrators|participants|people)/i.exec(body) || [])[0];
          out.push({ id: "emb:" + (link || title), src: "embassy", kind: "unrest", rule: "unrest", cat: "protest", title: `${CC_NAME[cc] || cc}: ${title}`, tier: cities.length ? 2 : 1, cc, t, url: link, text: body.slice(0, 900) + (size ? ` Expected: ${size}.` : ""), cities }); }); }
      catch(e){ errs.push(cc + ": " + e.message); } }));
    if (!out.length && errs.length === ccs.length && ccs.length) throw new Error(errs.slice(0, 2).join("; ")); return out; } });

/* ---------- government travel advisories: a level change in a country with our sites is a signal ---------- */
const TLVL = ["", "Normal precautions", "Increased caution", "Reconsider travel", "Do not travel"];
let TRAVEL = load("travel", { at: 0, gov: {}, changes: [] });
export const travelData = () => TRAVEL;
const GOVS = [["us", "US State Department", async () => { const j = await relayJSON("https://cadataapi.state.gov/api/TravelAdvisories", 30000), out = {};
    (Array.isArray(j) ? j : j.data || []).forEach(a => { const title = a.Title || a.title || "", lv = +((/Level\s*(\d)/i.exec(title) || [])[1]), cc = ccFor(title.split(" - ")[0]); if (cc && lv) out[cc] = { lvl: lv, url: a.Link || a.link || "https://travel.state.gov/", updated: Date.parse(a.Updated || a.Published || "") || null }; }); return out; }],
  ["ca", "Global Affairs Canada", async () => { const j = await relayJSON("https://data.international.gc.ca/travel-voyage/index-alpha-eng.json", 30000), out = {};
    Object.values(j.data || j).forEach(c => { const cc = c["country-iso"], st = +c["advisory-state"]; if (cc && isFinite(st)) out[cc] = { lvl: st + 1, url: `https://travel.gc.ca/destinations/${(c.eng || {})["url-slug"] || ""}`, updated: Date.parse((c["date-published"] || {}).date) || null }; }); return out; }],
  ["de", "German Federal Foreign Office", async () => { const j = await relayJSON("https://www.auswaertiges-amt.de/opendata/travelwarning", 30000), out = {};
    Object.values(j.response || j || {}).forEach(c => { if (!c || typeof c !== "object") return; const cc = String(c.countryCode || "").toUpperCase(); if (!/^[A-Z]{2}$/.test(cc)) return; out[cc] = { lvl: c.warning ? 4 : c.partialWarning ? 3 : (c.situationWarning || c.situationPartWarning) ? 2 : 1, url: "https://www.auswaertiges-amt.de/de/service/laender" }; }); return out; }],
  ["au", "Smartraveller (Australia)", async () => { const j = await relayJSON("https://www.smartraveller.gov.au/destinations-export", 30000), out = {}, arr = Array.isArray(j) ? j : (j.data || j.destinations || Object.values(j));
    const lv = s => { s = String(s || "").toLowerCase(); return /do not travel/.test(s) ? 4 : /reconsider/.test(s) ? 3 : /high degree of caution/.test(s) ? 2 : /normal/.test(s) ? 1 : 0; };
    arr.forEach(d => { const cc = ccFor(d.title || d.name || d.country) || String(d.iso2 || "").toUpperCase(), l = +(d.level || d.advice_level) || lv(d.level || d.advice || d.overall_advice || ""); if (CC_NAME[cc] && l) out[cc] = { lvl: l, url: "https://www.smartraveller.gov.au/destinations" }; }); return out; }]];
register({ id: "travel", name: "Travel advisories", provider: "US State Department, Global Affairs Canada, German Foreign Office, Smartraveller", what: "Advisory levels 1–4 for every country; changes in countries with our sites", group: "Unrest & news", every: 60 * 60e3, key: "No (relay)",
  async run(){ const errs = [], prevGov = TRAVEL.gov || {}, gov = {};
    await Promise.all(GOVS.map(async ([g, name, fn]) => { try{ gov[g] = await fn(); }catch(e){ errs.push(name + ": " + e.message); if (prevGov[g]) gov[g] = prevGov[g]; } }));
    if (errs.length === GOVS.length && !Object.keys(gov).length) throw new Error(errs[0]);
    const changes = TRAVEL.changes || []; if (TRAVEL.at) Object.entries(gov).forEach(([g, m]) => Object.entries(m).forEach(([cc, v]) => { const p = prevGov[g] && prevGov[g][cc]; if (p && p.lvl !== v.lvl) changes.unshift({ at: Date.now(), g, cc, from: p.lvl, to: v.lvl }); }));
    TRAVEL = { at: Date.now(), gov, changes: changes.filter(c => Date.now() - c.at < 30 * 86400e3).slice(0, 300), errs }; save("travel", TRAVEL); const mine = siteCC(), name = Object.fromEntries(GOVS.map(([g, n]) => [g, n]));
    const sigs = TRAVEL.changes.filter(c => mine.has(c.cc)).map(c => ({ id: `travel:${c.g}:${c.cc}:${c.at}`, src: "travel", kind: "travel", rule: "travel", cat: "interstate_conflict", title: `${CC_NAME[c.cc] || c.cc}: ${name[c.g]} advisory ${c.to > c.from ? "raised" : "lowered"} to level ${c.to} (${TLVL[c.to]})`,
      tier: c.to > c.from ? (c.to >= 4 ? 3 : c.to >= 3 ? 2 : 1) : 0, cc: c.cc, t: c.at, url: (gov[c.g] && gov[c.g][c.cc] || {}).url, text: `Was level ${c.from}.`, cities: CITIES.filter(x => x.cc === c.cc).map(x => x.name).slice(0, 1), citySites: false,
      sites: watchSites().filter(s => ccFor(s.country) === c.cc).slice(0, 60).map(s => ({ code: s.code, km: 0 })) }));
    // countries with sites already at level 3 or 4 are listed (no Inbox item unless the level rises)
    [...mine].filter(cc => !sigs.some(x => x.cc === cc)).forEach(cc => { const hi = Math.max(0, ...Object.values(gov).map(m => (m[cc] || {}).lvl || 0)); if (hi >= 3) sigs.push({ id: `travel:level:${cc}`, src: "travel", kind: "travel", rule: "travel", noInbox: true, cat: "interstate_conflict", title: `${CC_NAME[cc] || cc}: highest advisory level ${hi} (${TLVL[hi]})`, tier: 1, cc, t: TRAVEL.at, text: Object.entries(gov).map(([g, m]) => m[cc] ? `${name[g]} ${m[cc].lvl}` : "").filter(Boolean).join(", "), cities: [], sites: [] }); });
    return sigs; } });

/* ---------- ACLED: researched protest and riot events with crowd size (the TTP's crowd-size reference) ----------
   Needs a myACLED account. The password is used once to get a token and is not kept; the token refreshes for
   14 days. ACLED publishes weekly, so these are recent verified events, not live alerts. */
const ACLED_TOKEN = "https://acleddata.com/oauth/token", ACLED_READ = "https://acleddata.com/api/acled/read";
const ACLED_NAME = { Korea: "South Korea", "South Korea": "South Korea", "Hong Kong SAR": "China", "Hong Kong": "China", Macau: "China" };
export const acledAuth = () => load("acledAuth", null);
async function acledTokenPost(body){ const r = await fetch(ACLED_TOKEN, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(body) });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.access_token) throw new Error(r.status === 400 || r.status === 401 ? "ACLED did not accept the email or password" : (j.error_description || j.message || "HTTP " + r.status));
  const a = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 86400) * 1000 - 60e3, refreshExp: Date.now() + 14 * 86400e3, user: body.username || (acledAuth() || {}).user };
  save("acledAuth", a); return a; }
export async function acledConnect(email, password){ try{ return await acledTokenPost({ username: email, password, grant_type: "password", client_id: "acled", scope: "authenticated" }); }
  catch(e){ if (e.name === "TypeError") throw new Error("this browser blocked the call to ACLED; it needs the PSOC server"); throw e; } }
export const acledDisconnect = () => save("acledAuth", null);
async function acledToken(){ let a = acledAuth(); if (!a) throw new Error("connect ACLED in Settings › Keys");
  if (Date.now() < a.exp) return a.access; if (Date.now() > a.refreshExp) throw new Error("the ACLED sign-in has expired; connect again in Settings › Keys");
  a = await acledTokenPost({ refresh_token: a.refresh, grant_type: "refresh_token", client_id: "acled" }); return a.access; }
register({ id: "acled", name: "ACLED protests and riots", provider: "Armed Conflict Location & Event Data (ACLED)", what: "Verified protest and riot events in site countries over the last 14 days, with location, crowd size and fatalities", group: "Unrest & news", every: 6 * 3600e3, key: "Account",
  enabled: () => !!acledAuth(), offWhy: () => "connect a myACLED account in Settings › Keys",
  async run(){ const tok = await acledToken(), d = n => new Date(Date.now() - n * 86400e3).toISOString().slice(0, 10);
    const countries = [...new Set(siteCountries().map(c => ACLED_NAME[c] || c))].filter(c => ccFor(c));
    const q = `_format=json&limit=1000&event_date=${d(14)}|${d(0)}&event_date_where=BETWEEN&event_type=Protests:OR:event_type=Riots&${countries.map(c => "country=" + encodeURIComponent(c)).join(":OR:")}&fields=event_id_cnty|event_date|event_type|sub_event_type|country|admin1|location|latitude|longitude|notes|fatalities|tags|source`;
    let r; try{ r = await fetch(`${ACLED_READ}?${q}`, { headers: { Authorization: "Bearer " + tok } }); }catch(e){ throw new Error("this browser blocked the call to ACLED; it needs the PSOC server"); }
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || "HTTP " + r.status);
    return (j.data || []).map(e => { const lat = +e.latitude, lon = +e.longitude, near = sitesNear(lat, lon, 25), close = near.filter(x => x.km <= 5), crowd = (/crowd size=([^;]+)/i.exec(e.tags || "") || [])[1] || "";
      const violent = e.event_type === "Riots" || +e.fatalities > 0 || /violent|mob|excessive force/i.test(e.sub_event_type), large = /large|thousand|\d{4,}/i.test(crowd);
      const tier = close.length && violent ? 3 : close.length || (near.length && (violent || large)) ? 2 : near.length ? 1 : 0;
      return { id: "acled:" + e.event_id_cnty, src: "acled", kind: "unrest", rule: "unrest", cat: "protest", title: `${e.country}: ${e.sub_event_type} in ${e.location}${crowd ? ` (crowd ${crowd.trim()})` : ""}`, tier, lat, lon, cc: ccFor(e.country) || "",
        t: Date.parse(e.event_date + "T12:00:00Z"), url: "https://acleddata.com/", area: [e.location, e.admin1].filter(Boolean).join(", "),
        text: `${e.notes || ""}${+e.fatalities ? ` Fatalities: ${e.fatalities}.` : ""} Source: ${e.source || "ACLED"}. ACLED event ${e.event_id_cnty}, ${e.event_date}.`, sites: near.map(x => ({ code: x.code, km: x.km })), citySites: false,
        extra: { crowd, eventType: e.event_type, sub: e.sub_event_type } }; }); } });
