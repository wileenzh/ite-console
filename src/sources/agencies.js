// Official warnings from national agencies. Each agency is its own source (so the Sources page shows each one),
// and every warning becomes the same kind of signal: placed on the cities and sites it covers.
import { viaRelay, relayJSON, getJSON, xmlDoc, tx, txAll, stripHtml, asArr, inGeo, load } from "../core.js";
import { CFG } from "../config.js";
import { CITIES, watchSites, sitesNear, STATE } from "../model.js";
import { register } from "./index.js";

/* ---------- shared: hazard type, placing a warning on cities and sites ---------- */
export function hazardType(text){ const t = String(text || "").toUpperCase();
  const m = [["TSUNAMI", /TSUNAMI|津波|海嘯/], ["TYPHOON", /TYPHOON|TROPICAL|CYCLONE|HURRICANE|颱風|台风|台風|TC SIGNAL|SIGNAL NO/], ["STORM_SURGE", /STORM SURGE|高潮|COASTAL/], ["FLOOD", /FLOOD|INUNDAT|洪水|淹水|WATER LEVEL|BANJIR|氾濫/],
    ["RAIN", /RAIN|RAINSTORM|HUJAN|大雨|豪雨|暴雨|MONSOON/], ["THUNDERSTORM", /THUNDER|LIGHTNING|雷|RIBUT|PETIR/], ["HEAT", /HEAT|HOT|高溫|高温|酷暑|PANAS|WBGT/], ["COLD", /COLD|FROST|低溫|寒/], ["WIND", /WIND|GALE|GUST|暴風|強風|大风|ANGIN/],
    ["LANDSLIDE", /LANDSLIP|LANDSLIDE|土砂|山泥/], ["FIRE", /FIRE|BUSHFIRE|火災/], ["VOLCANIC", /VOLCAN|ERUPT|火山/], ["EARTHQUAKE", /EARTHQUAKE|GEMPA|地震/], ["AIR", /PSI|PM2\.5|AIR QUALITY|HAZE|DUST/], ["SNOW", /SNOW|大雪/], ["FOG", /FOG|濃霧/], ["WAVE", /WAVE|SEAS|波浪|OMBAK|SWELL/]];
  for (const [k, re] of m) if (re.test(t)) return k; return "WEATHER"; }
const STATE_OF = { "Kuala Lumpur": ["Selangor", "Putrajaya", "W.P. Kuala Lumpur", "Wilayah Persekutuan"], "Johor Bahru": ["Johor", "Johor Bahru", "Iskandar"], Mumbai: ["Maharashtra", "Mumbai Suburban", "Thane", "Raigad"],
  Pune: ["Pune"], Nagpur: ["Nagpur", "Vidarbha"], "New Delhi": ["Delhi", "NCT of Delhi"], Bengaluru: ["Karnataka", "Bangalore"], Chennai: ["Tamil Nadu"], Hyderabad: ["Telangana"], Jamnagar: ["Gujarat", "Saurashtra"],
  Sydney: ["New South Wales", "NSW"], Melbourne: ["Victoria"], Brisbane: ["Queensland", "South East Queensland"], Canberra: ["Australian Capital Territory", "ACT"], Perth: ["Western Australia"], Auckland: ["Auckland"],
  Jakarta: ["DKI Jakarta", "Jawa Barat", "Banten", "Bekasi", "Karawang"], Bangkok: ["Bangkok", "กรุงเทพ", "Nonthaburi", "Samut Prakan", "Pathum Thani"], Manila: ["Metro Manila", "NCR", "National Capital Region"],
  "Ho Chi Minh City": ["Ho Chi Minh", "Hồ Chí Minh", "TP.HCM"], Taipei: ["臺北市", "台北市", "新北市", "桃園市"], Beijing: ["北京"], Shanghai: ["上海"], Busan: ["부산"], Seoul: ["서울"], Nantong: ["南通", "Jiangsu"], Zhangjiakou: ["张家口", "Hebei"] };
const SEV_TIER = { EXTREME: 3, SEVERE: 2, MODERATE: 1, MINOR: 1, UNKNOWN: 1 };
export const tierSev = t => t >= 3 ? "EXTREME" : t === 2 ? "SEVERE" : "MODERATE";
export function warning(o){
  const sev = String(o.severity || "MODERATE").toUpperCase(), hazard = o.hazard || hazardType(o.title + " " + (o.desc || "")), txt = `${o.area || ""} ${o.title} ${o.desc || ""}`.toLowerCase();
  let sites = [], cities = o.points ? o.points.slice() : [];
  if (o.geo){ sites = watchSites().filter(s => inGeo(s.lat, s.lon, o.geo)).map(s => ({ code: s.code, km: 0 })); }
  if (!o.points) CITIES.forEach(c => { if (c.cc !== o.cc) return; const names = [c.name].concat(STATE_OF[c.name] || []); if (names.some(n => txt.includes(n.toLowerCase())) && !cities.includes(c.name)) cities.push(c.name); });
  let lat = o.lat, lon = o.lon; if (lat == null && o.geo){ try{ const ring = (o.geo.type === "Polygon" ? o.geo.coordinates : o.geo.coordinates[0])[0]; lon = ring.reduce((a, p) => a + p[0], 0) / ring.length; lat = ring.reduce((a, p) => a + p[1], 0) / ring.length; }catch(e){} }
  if (lat == null){ const c = CITIES.find(x => x.name === cities[0]) || CITIES.find(x => x.cc === o.cc && !o.points); if (c && cities.length){ lat = c.lat; lon = c.lon; } }
  return { id: o.id, src: o.src, kind: "warning", rule: "warnings", title: o.title, tier: SEV_TIER[sev] || 1, lat, lon, geo: o.geo || null, area: o.area || "", cc: o.cc, t: o.start || Date.now(), end: o.end || null,
    url: o.uri, text: o.desc || "", cities, sites, citySites: !sites.length, extra: { hazard, agency: o.agency, severity: sev, instruction: o.instruction || "", jmaLevel: o.jmaLevel } }; }
const off = id => () => (CFG.agency.off || {})[id] === true;
const agencySource = (o) => register(Object.assign({ group: "Official warnings", every: 10 * 60e3, enabled: () => !off(o.id)() }, o));
export const READINGS = {};            // values shown for reference beside the warnings (below an agency's own threshold)

/* ---------- CAP (Common Alerting Protocol): WMO SWIC mirrors and any national feed added in Settings ---------- */
const beYear = s => { const d = Date.parse(s); if (!isFinite(d)) return null; return new Date(d).getUTCFullYear() > 2400 ? d - 543 * 365.2425 * 86400e3 : d; };
export function parseCAP(doc, cc, agency, link, src){
  const alert = doc.getElementsByTagNameNS ? (doc.getElementsByTagNameNS("*", "alert")[0] || doc.getElementsByTagName("alert")[0]) : doc.getElementsByTagName("alert")[0]; if (!alert) return null;
  if (tx(alert, "status") && tx(alert, "status") !== "Actual") return null; if (tx(alert, "msgType") === "Cancel") return null;
  const infos = Array.from(alert.getElementsByTagName("info")), info = infos.find(i => /^en/i.test(tx(i, "language"))) || infos[0]; if (!info) return null;
  const end = beYear(tx(info, "expires")); if (end && end < Date.now()) return null; const polys = [];
  Array.from(info.getElementsByTagName("area")).forEach(ar => { txAll(ar, "polygon").forEach(p => { const ring = p.split(/\s+/).map(pt => pt.split(",").map(Number)).filter(x => x.length === 2 && isFinite(x[0])).map(([la, lo]) => [lo, la]); if (ring.length > 3) polys.push([ring]); });
    txAll(ar, "circle").forEach(c => { const [ll, r] = c.split(/\s+/), [la, lo] = ll.split(",").map(Number), rk = +r || 10; if (!isFinite(la)) return; const ring = []; for (let k = 0; k <= 24; k++){ const a = k / 24 * 2 * Math.PI; ring.push([lo + rk / (111 * Math.cos(la * Math.PI / 180)) * Math.cos(a), la + rk / 111 * Math.sin(a)]); } polys.push([ring]); }); });
  const ev = tx(info, "event"), head = tx(info, "headline");
  return warning({ src, id: "cap:" + (tx(alert, "identifier") || link), title: head || ev, area: txAll(info, "areaDesc").join("; ").slice(0, 200), geo: polys.length ? { type: "MultiPolygon", coordinates: polys } : null,
    severity: (tx(info, "severity") || "Unknown").toUpperCase(), start: beYear(tx(info, "onset") || tx(info, "effective") || tx(alert, "sent")), end, desc: tx(info, "description").slice(0, 1200), instruction: tx(info, "instruction").slice(0, 800),
    agency: tx(info, "senderName") || agency, uri: tx(info, "web") || link, cc }); }
const SWIC = { "in-imd-en": ["IN", "India Meteorological Department"], "cn-cma-xx": ["CN", "China Meteorological Administration"], "id-inatews-en": ["ID", "BMKG InaTEWS"], "ph-pagasa-en": ["PH", "PAGASA"],
  "sg-mss-en": ["SG", "Meteorological Service Singapore"], "th-tmd-en": ["TH", "Thai Meteorological Department"], "au-bom-en": ["AU", "Bureau of Meteorology"], "nz-nms-en": ["NZ", "MetService"] };
agencySource({ id: "swic", name: "WMO SWIC (CAP)", provider: "World Meteorological Organization", what: "Official CAP warnings from IMD, CMA, BMKG, PAGASA, MSS, TMD, BoM and MetService", key: "No (relay)",
  async run(){ const out = [], errs = [];
    await Promise.all(Object.entries(SWIC).map(async ([id, [cc, agency]]) => { try{ const rss = xmlDoc(await viaRelay(`https://severeweather.wmo.int/v2/cap-alerts/${id}/rss.xml`));
        const items = Array.from(rss.getElementsByTagName("item")).slice(0, 25);
        await Promise.all(items.map(async it => { const link = tx(it, "link"); if (!/^https?:/.test(link)) return; try{ const a = parseCAP(xmlDoc(await viaRelay(link, null, 15000)), cc, agency, link, "swic"); if (a) out.push(a); }catch(e){} }));
      }catch(e){ errs.push(id + ": " + e.message); } }));
    if (errs.length === Object.keys(SWIC).length) throw new Error(errs[0]); return out; } });
agencySource({ id: "capfeeds", name: "National CAP feeds", provider: "Feeds you add in Settings (WMO register of alerting authorities)", what: "Official warnings from any national authority's CAP feed", key: "No",
  enabled: () => !off("capfeeds")() && (CFG.capFeeds || []).length > 0, offWhy: () => "no feeds added",
  async run(){ const out = [], errs = [];
    for (const f of CFG.capFeeds || []){ try{ const doc = xmlDoc(await viaRelay(f.url)); const items = [...doc.getElementsByTagName("item"), ...doc.getElementsByTagName("entry")].slice(0, 25);
        if (!items.length){ const a = parseCAP(doc, f.cc, f.authority, f.url, "capfeeds"); if (a) out.push(a); continue; }
        for (const e of items.slice(0, 12)){ const lk = e.getElementsByTagName("link")[0], link = tx(e, "link") || (lk && lk.getAttribute ? lk.getAttribute("href") || "" : "");
          const inline = e.getElementsByTagNameNS("*", "alert")[0]; if (inline){ const a = parseCAP(inline, f.cc, f.authority, link, "capfeeds"); if (a){ out.push(a); continue; } }
          if (link) try{ const a = parseCAP(xmlDoc(await viaRelay(link, null, 15000)), f.cc, f.authority, link, "capfeeds"); if (a){ out.push(a); continue; } }catch(err){}
          const title = tx(e, "title"); out.push(warning({ src: "capfeeds", id: "capf:" + (link || title), title, cc: f.cc, agency: f.authority, uri: link || f.url, severity: /warning|severe|red/i.test(title) ? "SEVERE" : "MODERATE", start: Date.parse(tx(e, "pubDate") || tx(e, "updated")) || Date.now() })); } }
      catch(e){ errs.push(f.authority + ": " + e.message); } }
    if (!out.length && errs.length) throw new Error(errs.join("; ")); return out; } });

/* ---------- Hong Kong Observatory ---------- */
const HKO_TIER = { WRAINA: 1, WRAINR: 2, WRAINB: 3, TC1: 1, TC3: 2, TC8NE: 3, TC8SE: 3, TC8SW: 3, TC8NW: 3, TC9: 3, TC10: 3, WTS: 1, WHOT: 1, WCOLD: 1, WMSGNL: 1, WFNTSA: 2, WL: 2, WTMW: 3, WFIRER: 2, WFIREY: 1, WFROST: 1 };
agencySource({ id: "hko", name: "Hong Kong Observatory", provider: "HKO open data", what: "Rainstorm, typhoon signals, heat, landslip and tsunami warnings in force",
  async run(){ const j = await getJSON("https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en");
    return Object.entries(j || {}).filter(([, w]) => w && w.actionCode !== "CANCEL").map(([k, w]) => { const code = w.code || k;
      return warning({ src: "hko", id: "hko:" + code, title: w.name || code, area: "Hong Kong", severity: tierSev(HKO_TIER[code] || 1), start: Date.parse(w.updateTime || w.issueTime) || Date.now(), end: w.expireTime ? Date.parse(w.expireTime) : null,
        agency: "Hong Kong Observatory", uri: "https://www.hko.gov.hk/en/wxinfo/dailywx/wxwarntoday.htm", cc: "HK", points: ["Hong Kong"] }); }); } });

/* ---------- JMA (R8 feed: the old warning/{code}.json path has been frozen since 28 May 2026) ---------- */
export const JMA_PREFS = [["016000", "Hokkaido (Sapporo)", 43.06, 141.35], ["020000", "Aomori", 40.82, 140.74], ["030000", "Iwate", 39.7, 141.15], ["040000", "Miyagi", 38.27, 140.87], ["050000", "Akita", 39.72, 140.1], ["060000", "Yamagata", 38.24, 140.36],
  ["070000", "Fukushima", 37.75, 140.47], ["080000", "Ibaraki", 36.34, 140.45], ["090000", "Tochigi", 36.57, 139.88], ["100000", "Gunma", 36.39, 139.06], ["110000", "Saitama", 35.86, 139.65], ["120000", "Chiba", 35.61, 140.12], ["130000", "Tokyo", 35.69, 139.69],
  ["140000", "Kanagawa", 35.44, 139.64], ["150000", "Niigata", 37.9, 139.02], ["160000", "Toyama", 36.7, 137.21], ["170000", "Ishikawa", 36.59, 136.63], ["180000", "Fukui", 36.07, 136.22], ["190000", "Yamanashi", 35.66, 138.57], ["200000", "Nagano", 36.65, 138.18],
  ["210000", "Gifu", 35.39, 136.72], ["220000", "Shizuoka", 34.98, 138.38], ["230000", "Aichi", 35.18, 136.91], ["240000", "Mie", 34.73, 136.51], ["250000", "Shiga", 35.0, 135.87], ["260000", "Kyoto", 35.02, 135.76], ["270000", "Osaka", 34.69, 135.52],
  ["280000", "Hyogo", 34.69, 135.18], ["290000", "Nara", 34.69, 135.83], ["300000", "Wakayama", 34.23, 135.17], ["310000", "Tottori", 35.5, 134.24], ["320000", "Shimane", 35.47, 133.05], ["330000", "Okayama", 34.66, 133.93], ["340000", "Hiroshima", 34.4, 132.46],
  ["350000", "Yamaguchi", 34.19, 131.47], ["360000", "Tokushima", 34.07, 134.56], ["370000", "Kagawa", 34.34, 134.04], ["380000", "Ehime", 33.84, 132.77], ["390000", "Kochi", 33.56, 133.53], ["400000", "Fukuoka", 33.61, 130.42], ["410000", "Saga", 33.25, 130.3],
  ["420000", "Nagasaki", 32.74, 129.87], ["430000", "Kumamoto", 32.79, 130.74], ["440000", "Oita", 33.24, 131.61], ["450000", "Miyazaki", 31.91, 131.42], ["460000", "Kagoshima", 31.56, 130.56], ["470000", "Okinawa", 26.21, 127.68]];
const JMA_SUB = { "130010": ["Tokyo Region (mainland)", null, null, "Tokyo"], "130020": ["Northern Izu Islands", 34.75, 139.39], "130030": ["Southern Izu Islands", 33.11, 139.79], "130040": ["Ogasawara Islands", 27.09, 142.19], "270010": ["Osaka Region", null, null, "Osaka"] };
const JMA_CITY = { "130000": "Tokyo", "120000": "Tokyo", "110000": "Tokyo", "140000": "Tokyo", "270000": "Osaka", "280000": "Osaka", "260000": "Osaka" };
const JMA_CODE = { "10": ["Heavy Rain Advisory", 2], "12": ["Heavy Snow Advisory", 2], "13": ["Snowstorm Advisory", 2], "14": ["Thunderstorm Advisory", 2], "15": ["Strong Wind Advisory", 2], "16": ["High Wave Advisory", 2], "17": ["Snowmelt Advisory", 2],
  "18": ["Inundation Advisory", 2], "19": ["Storm Surge Advisory", 2], "20": ["Dense Fog Advisory", 2], "21": ["Dry Air Advisory", 2], "22": ["Avalanche Advisory", 2], "23": ["Low Temperature Advisory", 2], "24": ["Frost Advisory", 2], "25": ["Ice Accretion Advisory", 2],
  "26": ["Snow Accretion Advisory", 2], "29": ["Landslide Advisory", 2], "02": ["Snowstorm Warning", 3], "03": ["Heavy Rain Warning", 3], "04": ["Inundation Warning", 3], "05": ["Storm Warning", 3], "06": ["Heavy Snow Warning", 3], "07": ["High Wave Warning", 3],
  "08": ["Storm Surge Warning", 3], "09": ["Landslide Warning", 3], "42": ["Snowstorm Danger Warning", 4], "43": ["Heavy Rain Danger Warning", 4], "44": ["Inundation Danger Warning", 4], "45": ["Storm Danger Warning", 4], "46": ["Heavy Snow Danger Warning", 4],
  "47": ["High Wave Danger Warning", 4], "48": ["Storm Surge Danger Warning", 4], "49": ["Landslide Danger Warning", 4], "32": ["Snowstorm Emergency Warning", 5], "33": ["Heavy Rain Emergency Warning", 5], "34": ["Inundation Emergency Warning", 5],
  "35": ["Storm Emergency Warning", 5], "36": ["Heavy Snow Emergency Warning", 5], "37": ["High Wave Emergency Warning", 5], "38": ["Storm Surge Emergency Warning", 5], "39": ["Landslide Emergency Warning", 5] };
const JMA_OFF = ["発表警報・注意報はなし", "解除", "此の警報・注意報はなし"];
agencySource({ id: "jma", name: "JMA warnings", provider: "Japan Meteorological Agency (R8 feed)", what: "Advisories, warnings, danger and emergency warnings (alert levels 2–5) for the prefectures chosen in Settings", key: "No (relay)",
  async run(){ const out = [], errs = [], prefs = JMA_PREFS.filter(p => CFG.agency.jmaPrefs.includes(p[0]));
    await Promise.all(prefs.map(async ([code, pref, plat, plon]) => { try{ const data = await relayJSON(`https://www.jma.go.jp/bosai/warning/data/r8/${code}.json`), found = {}; let issued = null;
        asArr(data).forEach(b => { if (!b) return; const st = b.reportDatetime || (b.warning && b.warning.reportDatetime); if (st && (!issued || st > issued)) issued = st; const w = b.warning || b;
          Object.keys(w).forEach(k => { if (!/Items$/.test(k) || !Array.isArray(w[k])) return; w[k].forEach(it => { const ac = it.areaCode || it.code; if (!ac) return; (it.kinds || it.warnings || []).forEach(kd => { if (!kd.code || !kd.status || JMA_OFF.includes(kd.status)) return; (found[ac] = found[ac] || new Set()).add(kd.code); }); }); }); });
        const six = Object.keys(found).filter(c => String(c).length === 6), use = six.length ? six : Object.keys(found);
        use.forEach(sub => { const sn = JMA_SUB[sub], outlying = sn && !sn[3], name = sn ? sn[0] : pref, city = sn ? sn[3] || null : JMA_CITY[code] || null;
          [...found[sub]].forEach(wc => { const [label, lvl] = JMA_CODE[wc] || ["Advisory code " + wc, 2];
            out.push(warning({ src: "jma", id: `jma:${code}:${sub}:${wc}`, title: `Level ${lvl} ${label} — ${name}`, area: outlying ? `${name} (outlying islands, not the mainland city)` : `${pref} / ${name}`, lat: sn && sn[1] != null ? sn[1] : plat, lon: sn && sn[2] != null ? sn[2] : plon,
              severity: lvl >= 4 ? "EXTREME" : lvl === 3 ? "SEVERE" : "MODERATE", start: issued ? Date.parse(issued) : Date.now(), agency: "Japan Meteorological Agency", uri: `https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=${code}&lang=en`, cc: "JP", points: city ? [city] : [], jmaLevel: lvl })); }); });
      }catch(e){ errs.push(pref + ": " + e.message); } }));
    if (errs.length && errs.length === prefs.length) throw new Error(errs[0]); return out; } });

/* ---------- Korea KMA (authKey) ---------- */
export const KMA_AREAS = [["seoul", "Seoul", ["서울"], 37.57, 126.98, "Seoul"], ["busan", "Busan", ["부산"], 35.18, 129.08, "Busan"], ["incheon", "Incheon", ["인천"], 37.46, 126.71], ["daegu", "Daegu", ["대구"], 35.87, 128.6], ["gwangju", "Gwangju", ["광주"], 35.16, 126.85],
  ["daejeon", "Daejeon", ["대전"], 36.35, 127.38], ["ulsan", "Ulsan", ["울산"], 35.54, 129.31], ["sejong", "Sejong", ["세종"], 36.48, 127.29], ["gyeonggi", "Gyeonggi-do", ["경기"], 37.27, 127.01], ["gangwon", "Gangwon-do", ["강원"], 37.88, 127.73],
  ["chungbuk", "Chungcheongbuk-do", ["충북", "충청북도"], 36.64, 127.49], ["chungnam", "Chungcheongnam-do", ["충남", "충청남도"], 36.66, 126.67], ["jeonbuk", "Jeollabuk-do", ["전북", "전라북도"], 35.82, 127.15], ["jeonnam", "Jeollanam-do", ["전남", "전라남도"], 34.82, 126.46],
  ["gyeongbuk", "Gyeongsangbuk-do", ["경북", "경상북도"], 36.58, 128.73], ["gyeongnam", "Gyeongsangnam-do", ["경남", "경상남도"], 35.24, 128.69], ["jeju", "Jeju-do", ["제주"], 33.5, 126.53]];
const KMA_WRN = { W: "Strong Wind", R: "Heavy Rain", C: "Cold Wave", D: "Dry Air", O: "Storm Surge", N: "Tsunami", V: "High Seas", T: "Typhoon", S: "Heavy Snow", Y: "Asian Dust", H: "Heat Wave", F: "Fog" };
const KMA_LVL = { "1": ["Preliminary", "MODERATE"], "2": ["Advisory", "MODERATE"], "3": ["Warning", "SEVERE"] };
agencySource({ id: "kma", name: "KMA warnings", provider: "Korea Meteorological Administration (apihub)", what: "Official special weather warnings for the regions chosen in Settings", key: "Free key",
  enabled: () => !off("kma")() && !!CFG.keys.kma, offWhy: () => "add the free KMA authKey in Settings",
  async run(){ let fields = null; const rows = [];
    (await viaRelay(`https://apihub.kma.go.kr/api/typ01/url/wrn_now_data.php?authKey=${encodeURIComponent(CFG.keys.kma)}`)).split("\n").map(l => l.trim()).filter(Boolean).forEach(line => {
      if (line[0] === "#"){ const c = line.replace(/^#+/, "").replace(/,/g, " ").trim().split(/\s+/); if (c.some(x => /^(WRN|LVL|CMD|REG)/i.test(x))) fields = c; return; }
      const cols = line.split(/\s*,\s*|\s{2,}|\t/).filter(Boolean); if (cols.length < 2) return; const r = { __raw: line }; (fields || []).forEach((f, i) => { r[f.toUpperCase()] = cols[i] || ""; }); rows.push(r); });
    const pick = (r, c) => { for (const k of Object.keys(r)) for (const x of c) if (k.indexOf(x) === 0) return r[k]; }, out = [];
    KMA_AREAS.filter(a => CFG.agency.kmaAreas.includes(a[0])).forEach(([code, name, match, lat, lon, city]) => rows.filter(r => pick(r, ["CMD"]) !== "3" && match.some(m => r.__raw.includes(m))).forEach(r => {
      const w = pick(r, ["WRN"]), l = pick(r, ["LVL"]), lab = w && KMA_WRN[w] && l && KMA_LVL[l] ? `${KMA_WRN[w]} ${KMA_LVL[l][0]}` : "Special weather report";
      out.push(warning({ src: "kma", id: `kma:${code}:${w}:${l}`, title: `${lab} — ${name}`, area: name, lat, lon, severity: l && KMA_LVL[l] ? KMA_LVL[l][1] : "MODERATE", start: Date.now(), desc: "As issued: " + r.__raw,
        agency: "Korea Meteorological Administration", uri: "https://www.weather.go.kr/w/warning/whole-wrn.do", cc: "KR", points: city ? [city] : [] })); }));
    return out; } });

/* ---------- Taiwan CWA: county warnings and the separate heat-light product (free key) ---------- */
const CWA_TRACK = { "臺北市": "Taipei City", "新北市": "New Taipei City", "桃園市": "Taoyuan City" };
const CWA_PH = { "大雨": "Heavy Rain", "豪雨": "Torrential Rain", "大豪雨": "Extremely Torrential Rain", "超大豪雨": "Super Torrential Rain", "颱風": "Typhoon", "強風": "Strong Wind", "陸上強風": "Strong Wind (land)", "海上強風": "Strong Wind (sea)", "低溫": "Cold", "濃霧": "Dense Fog", "長浪": "Swell", "高溫": "Extreme Heat" };
const CWA_HEAT = { "黃色": ["Yellow", "MODERATE", "36°C or higher"], "橙色": ["Orange", "SEVERE", "36°C or higher for 3+ days, or 38°C or higher"], "紅色": ["Red", "EXTREME", "38°C or higher for 3+ days"] };
agencySource({ id: "cwa", name: "Taiwan CWA", provider: "Central Weather Administration", what: "County warnings (W-C0033-001) and heat lights (W-C0033-005) for Taipei, New Taipei and Taoyuan", key: "Free key",
  enabled: () => !off("cwa")() && !!CFG.keys.cwa, offWhy: () => "add the free CWA key in Settings",
  async run(){ const get = id => relayJSON(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/${id}?Authorization=${encodeURIComponent(CFG.keys.cwa)}&format=JSON`), [wx, heat] = await Promise.allSettled([get("W-C0033-001"), get("W-C0033-005")]), out = [];
    const tw = s => Date.parse(String(s || "").replace(" ", "T") + "+08:00") || null;
    if (wx.status === "fulfilled") ((wx.value.records || {}).location || []).forEach(loc => { if (!CWA_TRACK[loc.locationName]) return; ((loc.hazardConditions || {}).hazards || []).forEach(h => { const i = h.info || {}, ph = i.phenomena || "", sig = i.significance || "";
      out.push(warning({ src: "cwa", id: `cwa:${loc.locationName}:${ph}:${sig}`, title: `${CWA_PH[ph] || ph} ${sig.includes("警報") ? "Warning" : "Advisory"} — ${CWA_TRACK[loc.locationName]}`, area: CWA_TRACK[loc.locationName],
        severity: /超大豪雨|大豪雨/.test(ph) ? "EXTREME" : /豪雨|颱風/.test(ph) || sig.includes("警報") ? "SEVERE" : "MODERATE", start: tw((h.validTime || {}).startTime) || Date.now(), end: tw((h.validTime || {}).endTime), agency: "Central Weather Administration",
        uri: "https://www.cwa.gov.tw/V8/E/P/Warning/FIFOWS.html", cc: "TW", points: ["Taipei"] })); }); });
    if (heat.status === "fulfilled"){ const by = {};
      asArr((heat.value.records || {}).info).forEach(info => { if (!info || (info.expires && Date.parse(info.expires) < Date.now())) return; const pv = n => { const p = asArr(info.parameter).find(x => x && x.valueName === n); return p ? p.value : ""; };
        const col = pv("alert_color") || (String(pv("severity_level")).match(/(黃色|橙色|紅色)/) || [])[1] || "";
        asArr(info.area).forEach(a => { const d = (a && a.areaDesc) || "", county = Object.keys(CWA_TRACK).find(c => d.startsWith(c)); if (!county) return; const s = ((by[county] = by[county] || {})[col] = by[county][col] || { n: 0, eff: info.effective, exp: info.expires }); s.n++; if (info.expires > s.exp) s.exp = info.expires; }); });
      Object.entries(by).forEach(([county, cols]) => Object.entries(cols).forEach(([col, s]) => { const c = CWA_HEAT[col] || [col || "Unrated", "MODERATE", ""];
        out.push(warning({ src: "cwa", id: `cwa:heat:${county}:${col}:${String(s.eff || "").slice(0, 10)}`, title: `Heat ${c[0]} light — ${CWA_TRACK[county]}`, area: `${CWA_TRACK[county]}, ${s.n} district${s.n === 1 ? "" : "s"}`, hazard: "HEAT",
          severity: c[1], start: Date.parse(s.eff) || Date.now(), end: Date.parse(s.exp) || null, desc: c[2] ? "Rule: " + c[2] + "." : "", agency: "Central Weather Administration", uri: "https://www.cwa.gov.tw/V8/C/P/Warning/W29.html", cc: "TW", points: ["Taipei"] })); })); }
    if (wx.status === "rejected" && heat.status === "rejected") throw new Error(wx.reason.message); return out; } });

/* ---------- Singapore NEA: rainfall, WBGT heat stress, PSI, PM2.5 ---------- */
const PM = [[0, 9, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]];
export const pm25ToAqi = c => { const t = Math.floor(c * 10) / 10; for (const [a, b, i, j] of PM) if (t >= a && t <= b) return Math.round((j - i) / (b - a) * (t - a) + i); const [a, b, i, j] = PM[5]; return Math.round((j - i) / (b - a) * (t - a) + i); };
const nums = (n, keys, out = []) => { if (Array.isArray(n)) n.forEach(x => nums(x, keys, out)); else if (n && typeof n === "object") Object.keys(n).forEach(k => { const v = n[k]; if (typeof v === "number" && keys.includes(k.toLowerCase())) out.push(v); else if (v && typeof v === "object") nums(v, keys, out); }); return out; };
agencySource({ id: "nea", name: "NEA Singapore", provider: "National Environment Agency via data.gov.sg", what: "Rainfall, heat stress (WBGT), air temperature, PSI and PM2.5",
  async run(){ const out = [], errs = [], rows = [], add = (id, title, hazard, sev, desc, uri) => out.push(warning({ src: "nea", id: "nea:" + id, title, hazard, area: "Singapore, island-wide", severity: sev, start: Date.now(), desc, agency: "National Environment Agency", uri: uri || "https://www.weather.gov.sg/home/", cc: "SG", points: ["Singapore"] }));
    await Promise.all([
      getJSON("https://api.data.gov.sg/v1/environment/rainfall").then(d => { const v = nums(d.items, ["value"]); if (!v.length) throw new Error("no reading"); const mx = Math.max(...v); rows.push(["Rainfall, highest station", `${mx.toFixed(1)} mm in 5 min`, mx > 4.2 ? "very heavy" : mx > .85 ? "heavy" : mx > .2 ? "moderate" : "light or none"]);
        if (mx > .85) add("rain:" + (mx > 4.2 ? "vh" : "h"), `${mx > 4.2 ? "Very heavy" : "Heavy"} rain — ${mx.toFixed(1)} mm in 5 min`, "RAIN", mx > 4.2 ? "SEVERE" : "MODERATE", `Highest NEA station, about ${Math.round(mx * 12)} mm/h if sustained.`); }).catch(e => errs.push("rainfall: " + e.message)),
      viaRelay("https://api-open.data.gov.sg/v2/real-time/api/weather?api=wbgt").then(t => { const d = JSON.parse(t), rec = d && d.data && d.data.records ? d.data.records[0] : null, LV = ["Low", "Moderate", "High"];
        const v = ((rec && rec.item && rec.item.readings) || []).map(r => ({ n: (r.station && (r.station.townCenter || r.station.name)) || "station", w: parseFloat(r.wbgt), l: String(r.heatStress || "").trim() })).filter(r => LV.includes(r.l)); if (!v.length) throw new Error("no heat stress level");
        const top = Math.max(...v.map(r => LV.indexOf(r.l))), pk = v.filter(r => LV.indexOf(r.l) === top).sort((a, b) => (b.w || 0) - (a.w || 0))[0]; rows.push(["Heat stress (WBGT), highest", `${LV[top]}, WBGT ${isFinite(pk.w) ? pk.w.toFixed(1) + "°C" : "n/a"} at ${pk.n}`, LV[top].toLowerCase()]);
        if (top > 0) add("wbgt:" + LV[top], `${LV[top]} heat stress — WBGT ${isFinite(pk.w) ? pk.w.toFixed(1) + "°C" : ""} at ${pk.n}`, "HEAT", top === 2 ? "SEVERE" : "MODERATE", "NEA heat stress advisory.", "https://www.weather.gov.sg/heat-stress/"); }).catch(e => errs.push("heat stress: " + e.message)),
      getJSON("https://api.data.gov.sg/v1/environment/air-temperature").then(d => { const v = nums(d.items, ["value"]); if (v.length) rows.push(["Air temperature, highest", Math.max(...v).toFixed(1) + "°C", "reference only"]); }).catch(e => errs.push("air temperature: " + e.message)),
      getJSON("https://api.data.gov.sg/v1/environment/psi").then(d => { const r = d.items && d.items[0] && d.items[0].readings && d.items[0].readings.psi_twenty_four_hourly; if (!r) throw new Error("no PSI"); const mx = Math.max(...Object.values(r)), lab = mx > 300 ? "hazardous" : mx > 200 ? "very unhealthy" : mx > 100 ? "unhealthy" : mx > 50 ? "moderate" : "good";
        rows.push(["24-hour PSI, highest region", String(mx), lab]); if (mx > 100) add("psi:" + lab, `PSI ${mx} — ${lab}`, "AIR", mx > 200 ? "SEVERE" : "MODERATE", "NEA 24-hour Pollutant Standards Index.", "https://www.haze.gov.sg/"); }).catch(e => errs.push("PSI: " + e.message)),
      getJSON("https://api.data.gov.sg/v1/environment/pm25").then(d => { const r = d.items && d.items[0] && d.items[0].readings && d.items[0].readings.pm25_one_hourly; if (!r) throw new Error("no PM2.5"); const mx = Math.max(...Object.values(r)), a = pm25ToAqi(mx);
        const lab = a > 300 ? "hazardous" : a > 200 ? "very unhealthy" : a > 150 ? "unhealthy" : a > 100 ? "unhealthy for sensitive groups" : a > 50 ? "moderate" : "good"; rows.push(["PM2.5, highest region", `${mx} µg/m³ (US AQI ${a})`, lab]);
        if (a > 100) add("pm25:" + lab, `PM2.5 ${mx} µg/m³ — US AQI ${a}, ${lab}`, "AIR", a > 150 ? "SEVERE" : "MODERATE", "Current hour against the US EPA 24-hour breakpoints (approximation).", "https://www.haze.gov.sg/"); }).catch(e => errs.push("PM2.5: " + e.message))]);
    READINGS.nea = { name: "NEA Singapore", at: Date.now(), rows, errs }; if (errs.length >= 5) throw new Error(errs[0]); return out; } });

/* ---------- Malaysia: MetMalaysia warnings, JPS river levels, MetMalaysia heat forecast ---------- */
agencySource({ id: "mymet", name: "MetMalaysia", provider: "data.gov.my", what: "Thunderstorm, continuous rain, strong wind and rough sea warnings",
  async run(){ const arr = asArr(await getJSON("https://api.data.gov.my/weather/warning?limit=50")), seen = new Set(), out = [];
    arr.filter(w => { const e = Date.parse(w.valid_to || ""); return !isFinite(e) || e > Date.now(); }).forEach((w, i) => { const wi = w.warning_issue || {}, title = wi.title_en || w.heading_en || "MetMalaysia warning", text = w.text_en || w.heading_en || "";
      const k = title + "|" + (w.heading_en || ""); if (seen.has(k)) return; seen.add(k);           // one episode arrives as several zone records
      const tier = /danger|bahaya/i.test(title + text) ? 3 : /bad weather|buruk|severe/i.test(title + text) ? 2 : 1;
      out.push(warning({ src: "mymet", id: "mymet:" + (wi.issued || i) + ":" + title.slice(0, 30), title, area: (w.heading_en || "").slice(0, 160), severity: tierSev(tier), start: Date.parse(w.valid_from || wi.issued) || Date.now(), end: Date.parse(w.valid_to) || null,
        desc: text.slice(0, 1200), instruction: w.instruction_en || "", agency: "MetMalaysia", uri: "https://www.met.gov.my/en/", cc: "MY" })); });
    return out; } });
agencySource({ id: "myflood", name: "JPS river levels", provider: "data.gov.my (Public Infobanjir)", what: "River gauges at alert, warning or danger level near Malaysian sites",
  async run(){ const arr = asArr(await getJSON("https://api.data.gov.my/flood-warning?limit=500")), lvl = s => { s = String(s || "").toUpperCase(); return /DANGER|BAHAYA/.test(s) ? 3 : /WARNING|AMARAN/.test(s) ? 2 : /ALERT|WASPADA/.test(s) ? 1 : 0; };
    return arr.map(s => ({ s, t: lvl(s.water_level_indicator || s.status || s.level) })).filter(x => x.t > 0).map(({ s, t }) => { const lat = +s.latitude, lon = +s.longitude;
      return warning({ src: "myflood", id: "jps:" + (s.station_id || s.station_name), title: `River at ${["", "alert", "warning", "danger"][t]} level — ${s.station_name || "station"}`, hazard: "FLOOD", area: [s.district, s.state].filter(Boolean).join(", "),
        lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null, severity: tierSev(t), start: Date.parse(s.last_updated || s.date) || Date.now(), desc: `Water level ${s.water_level_current ?? ""} m (alert ${s.water_level_alert ?? "?"}, warning ${s.water_level_warning ?? "?"}, danger ${s.water_level_danger ?? "?"}).`,
        agency: "JPS (DID Malaysia)", uri: "https://publicinfobanjir.water.gov.my/", cc: "MY" }); }).filter(w => w.cities.length || (w.near && w.near.km < 60)); } });
agencySource({ id: "myheat", name: "MetMalaysia heat forecast", provider: "data.gov.my (MetMalaysia)", what: "Today's forecast high for Kuala Lumpur and Johor Bahru against MetMalaysia's heat tiers",
  async run(){ const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" }), out = [], rows = [], errs = [];
    await Promise.all(["Kuala Lumpur", "Johor Bahru"].map(async city => { try{ const list = asArr(await getJSON(`https://api.data.gov.my/weather/forecast?icontains=${encodeURIComponent(city)}@location__location_name&date_start=${today}@date&date_end=${today}@date&limit=5`));
        const t = list.map(r => r && r.max_temp).filter(v => typeof v === "number"); if (!t.length) throw new Error("no forecast today"); const mx = Math.max(...t);
        const lv = mx > 40 ? [3, "Level 3 extreme heatwave range", "EXTREME"] : mx > 37 ? [2, "Level 2 heatwave range", "SEVERE"] : mx >= 35 ? [1, "Level 1 alert range", "MODERATE"] : null; rows.push([city + " forecast high today", mx + "°C", lv ? lv[1] : "below the 35°C alert"]);
        if (lv) out.push(warning({ src: "myheat", id: `myheat:${city}:${today}:${lv[0]}`, title: `${lv[1]} — forecast high ${mx}°C in ${city}`, hazard: "HEAT", area: city, severity: lv[2], start: Date.now(),
          desc: "MetMalaysia declares a heatwave only after 3 consecutive days in the range; one day is an early signal.", agency: "MetMalaysia", uri: "https://www.met.gov.my/en/iklim/status-cuaca-panas/", cc: "MY", points: [city] })); }
      catch(e){ errs.push(city + ": " + e.message); } }));
    READINGS.myheat = { name: "MetMalaysia heat forecast", at: Date.now(), rows, errs }; if (errs.length === 2) throw new Error(errs[0]); return out; } });

/* ---------- Indonesia BMKG: village forecasts (first tier only) and the official nowcast warnings ---------- */
const bmkgAreas = () => String(CFG.agency.bmkgAreas || "").split(";").map(x => x.split("|")).filter(x => /^\d\d\.\d\d\.\d\d\.\d{4}$/.test((x[0] || "").trim())).map(([c, l]) => ({ adm4: c.trim(), label: (l || c).trim() }));
function slotMs(s){ for (const [v, tz] of [[s.datetime, "Z"], [s.utc_datetime, "Z"], [s.local_datetime, "+07:00"]]){ const x = String(v || "").trim(); if (!x) continue; const n = Date.parse(/(?:Z|[+\-]\d\d:?\d\d)$/i.test(x) ? x : x.replace(" ", "T") + tz); if (isFinite(n)) return n; } return NaN; }
function slots(p){ const out = [], seen = new Set(), add = s => { if (!s || typeof s !== "object" || (!s.weather_desc && !s.weather_desc_en && s.weather === undefined)) return; const k = [s.datetime, s.utc_datetime, s.local_datetime, s.weather].join("|"); if (!seen.has(k)){ seen.add(k); out.push(s); } };
  (p && Array.isArray(p.data) ? p.data : []).forEach(r => { if (r && Array.isArray(r.cuaca)) r.cuaca.flat(Infinity).forEach(add); }); return out; }
function slotClass(s){ const d = [s.weather_desc_en, s.weather_desc].filter(Boolean).join(" / ").toLowerCase(), c = Number(s.weather), ws = s.ws == null || s.ws === "" ? null : Number(s.ws);
  if (/thunderstorm|lightning|petir|badai|puting\s+beliung|heavy\s+rain|lebat/.test(d) || [65, 95, 97].includes(c) || (ws != null && ws >= 45)) return 2;
  if (/moderate\s+rain|showers|hujan\s+sedang/.test(d) || c === 63 || (ws != null && ws >= 25)) return 1; return 0; }
function bmkgTargets(t){ const o = []; if (/\bkarawang\b/i.test(t)) o.push("Karawang"); if (/\bbekasi\b|\bcikarang\b/i.test(t)) o.push("Bekasi");
  const wj = /\bjakarta\s+barat\b|\bwest\s+jakarta\b|\b(?:grogol|petamburan|tomang|kembangan|cengkareng|kalideres|tambora|palmerah|kebon\s+jeruk)\b/i.test(t); if (wj) o.push("West Jakarta"); if (/\bjakarta\b/i.test(t) && !wj) o.push("Jakarta"); return o; }
agencySource({ id: "bmkg", name: "BMKG", provider: "Badan Meteorologi, Klimatologi, dan Geofisika", what: "Official nowcast warnings, and village forecasts for the districts in Settings", key: "No (relay)",
  async run(){ const out = [], errs = [], hits = [], heat = [], now = Date.now();
    await Promise.all([...bmkgAreas().map(async a => { try{ const d = JSON.parse(await viaRelay("https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=" + a.adm4));
        const got = String((d.lokasi && d.lokasi.adm4) || (d.data && d.data[0] && d.data[0].lokasi && d.data[0].lokasi.adm4) || ""); if (got && got !== a.adm4) throw new Error("district mismatch " + got);
        const use = slots(d).map(s => ({ s, ms: slotMs(s) })).filter(x => isFinite(x.ms) && x.ms > now - 3 * 3600e3 && x.ms <= now + 12 * 3600e3); if (!use.length) throw new Error("no forecast slot in the next 12 h");
        use.forEach(x => { if (isFinite(+x.s.t)) heat.push([a.label, +x.s.t]); }); const worst = use.map(x => ({ x, c: slotClass(x.s) })).filter(y => y.c).sort((p, q) => q.c - p.c || p.x.ms - q.x.ms)[0];
        if (worst) hits.push({ label: a.label, wx: worst.x.s.weather_desc_en || worst.x.s.weather_desc, when: worst.x.s.local_datetime || "", ms: worst.x.ms }); }catch(e){ errs.push(a.label + ": " + e.message); } }),
      viaRelay("https://www.bmkg.go.id/alerts/nowcast/en").then(t => { const doc = xmlDoc(t);
        [...doc.querySelectorAll("item, entry")].forEach(n => { const rd = k => { const e = n.querySelector(k); return e ? (e.textContent || "").trim() : ""; }, title = rd("title"), desc = stripHtml(rd("description") || rd("summary")), tg = bmkgTargets(title + " " + desc); if (!tg.length) return;
          const lk = n.querySelector("link"); out.push(warning({ src: "bmkg", id: "bmkg:now:" + (rd("guid") || rd("id") || title), title: `BMKG nowcast — ${tg.join(", ")}: ${title || "active warning"}`.slice(0, 160), area: tg.join(", "), severity: "SEVERE",
            start: Date.parse(rd("pubDate") || rd("updated")) || Date.now(), desc: desc.slice(0, 900), agency: "BMKG", uri: (lk && (lk.getAttribute("href") || lk.textContent || "").trim()) || "https://www.bmkg.go.id/alerts/nowcast/en", cc: "ID", points: ["Jakarta"] })); }); })
      .catch(e => errs.push("nowcast: " + e.message))]);
    // a forecast is not a warning: one first-tier item across the districts, so routine thunderstorm forecasts don't open escalations
    if (hits.length){ const first = hits.slice().sort((a, b) => a.ms - b.ms)[0]; out.push(warning({ src: "bmkg", id: `bmkg:fc:${new Date(first.ms).toISOString().slice(0, 13)}:${hits.map(h => h.label).sort().join(",")}`,
      title: `BMKG forecast: ${[...new Set(hits.map(h => h.wx))].join(" / ")} in ${hits.length} district${hits.length === 1 ? "" : "s"} within 12 h`, area: hits.map(h => h.label).join(", "), severity: "MODERATE", start: first.ms,
      desc: hits.map(h => `${h.label}: ${h.wx}${h.when ? " at " + h.when + " WIB" : ""}`).join("; ") + ". Village forecast, not an official warning.", agency: "BMKG", uri: "https://www.bmkg.go.id/", cc: "ID", points: ["Jakarta"] })); }
    const pk = heat.sort((a, b) => b[1] - a[1])[0]; READINGS.bmkg = { name: "BMKG Indonesia", at: Date.now(), rows: pk ? [["Highest forecast temperature, next 12 h", `${pk[1]}°C at ${pk[0]}`, "reference only — BMKG issues no heat warnings"]] : [], errs };
    if (errs.length && errs.length >= bmkgAreas().length + 1) throw new Error(errs[0]); return out; } });

/* ---------- Thailand TMD: numbered bulletins and TMD's own CAP feed ---------- */
const TMD_AREAS = [["Bangkok & vicinity", /bangkok|pathum\s*thani|nonthaburi|samut\s*prakan|central\s+(?:region|part)|the\s+central|upper\s+central|กรุงเทพ|ปทุมธานี|นนทบุรี|สมุทรปราการ|ภาคกลาง/i], ["Chon Buri / the East", /chon\s*buri|chonburi|rayong|the\s+east\b|eastern\s+(?:region|part)|ชลบุรี|ระยอง|ภาคตะวันออก(?!เฉียงเหนือ)/i]];
const tmdDate = s => { s = String(s || "").trim(); const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/); if (m){ let y = +m[3]; if (y > 2400) y -= 543; return Date.UTC(y, +m[2] - 1, +m[1], (+m[4] || 0) - 7, +m[5] || 0, +m[6] || 0); } const n = Date.parse(s); return isFinite(n) ? n : NaN; };
const kid = (el, n) => { for (const c of el.children) if (c.localName.toLowerCase() === n) return c.textContent || ""; return ""; };
const thai = s => /[฀-๿]/.test(s || "");
const tmdItems = x => { const d = xmlDoc(x); let n = [...d.getElementsByTagName("item")]; if (!n.length) n = [...d.getElementsByTagName("entry")];
  return n.map(e => { let link = kid(e, "link").trim(); if (!link){ const l = e.getElementsByTagName("link")[0]; if (l) link = l.getAttribute("href") || ""; } return { title: stripHtml(kid(e, "title")), desc: stripHtml(kid(e, "description") || kid(e, "summary")), ms: tmdDate(kid(e, "pubdate") || kid(e, "updated") || kid(e, "date")), link }; }); };
agencySource({ id: "tmd", name: "TMD Thailand", provider: "Thai Meteorological Department", what: "Numbered warning bulletins and CAP alerts naming Bangkok or the East", key: "No (relay)",
  async run(){ const out = [], errs = [], now = Date.now(), areas = t => TMD_AREAS.filter(([, re]) => re.test(t)).map(([n]) => n);
    const sevOf = t => /tropical\s+storm|typhoon|depression|พายุ/i.test(t) ? "SEVERE" : /heavy\s+rain|strong\s+wind|wind-?waves?|ฝนตกหนัก|คลื่นลมแรง/i.test(t) ? "MODERATE" : "MINOR";
    try{ const items = tmdItems(await viaRelay("https://tmd.go.th/api/xml/warning-news")).filter(i => i.title || i.desc);
      items.forEach(i => { const sj = i.desc.match(/Subject:\s*(.+?)(?:\s{2,}|\s+No\.\s*\d+|$)/i); if ((!i.title || thai(i.title)) && sj && !thai(sj[1])) i.title = sj[1].trim(); });
      const en = items.filter(i => !thai(i.title)), series = {}; (en.length ? en : items).forEach(i => { if (!isFinite(i.ms) || now - i.ms > 36 * 3600e3) return; const k = i.title.replace(/\s*No\.?\s*\d+.*$/i, "").trim().toLowerCase() || i.title; if (!series[k] || i.ms > series[k].ms) series[k] = i; });
      Object.values(series).forEach(i => { const ar = areas(i.title + " " + i.desc); out.push(warning({ src: "tmd", id: "tmd:" + i.title, title: i.title.slice(0, 160), area: ar.length ? "Thailand — " + ar.join(", ") : "Thailand (does not name Bangkok or the East)",
        severity: ar.length ? sevOf(i.title + " " + i.desc.slice(0, 400)) : "MINOR", start: i.ms, end: i.ms + 36 * 3600e3, desc: i.desc.slice(0, 900), agency: "Thai Meteorological Department", uri: i.link || "https://www.tmd.go.th/en/", cc: "TH", points: ar.length ? ["Bangkok"] : [] })); }); }
    catch(e){ errs.push("bulletins: " + e.message); }
    try{ for (const c of tmdItems(await viaRelay("https://www.tmd.go.th/api/xml/CAP")).filter(i => isFinite(i.ms) && now - i.ms < 48 * 3600e3).sort((a, b) => b.ms - a.ms).slice(0, 6)){
        let a = null; if (c.link) try{ a = parseCAP(xmlDoc(await viaRelay(c.link, null, 15000)), "TH", "Thai Meteorological Department", c.link, "tmd"); }catch(e){}
        if (a && !out.some(o => o.title.toLowerCase() === a.title.toLowerCase())){ const ar = areas(a.title + " " + a.text + " " + a.area); if (ar.length){ a.cities = ["Bangkok"]; a.area = "Thailand — " + ar.join(", "); out.push(a); } } } }
    catch(e){ errs.push("CAP: " + e.message); }
    if (errs.length === 2) throw new Error(errs.join("; ")); return out; } });

/* ---------- India SACHET (NDMA CAP) and PTWC tsunami ---------- */
agencySource({ id: "sachet", name: "India SACHET", provider: "National Disaster Management Authority", what: "CAP alerts from IMD, CWC, INCOIS and state authorities for the states in Settings", key: "No (relay)",
  enabled: () => !off("sachet")() && !!CFG.agency.sachetStates, offWhy: () => "no states chosen",
  async run(){ const out = [], errs = [], states = String(CFG.agency.sachetStates).split(",").map(s => s.trim()).filter(Boolean);
    await Promise.all(states.map(async st => { try{ const rss = xmlDoc(await viaRelay(`https://sachet.ndma.gov.in/cap_public_website/rss/rss_${st}.xml`));
        Array.from(rss.getElementsByTagName("item")).slice(0, 40).forEach(it => { const t = tx(it, "title"), d = stripHtml(tx(it, "description")), link = tx(it, "link"), ex = beYear(tx(it, "expires")); if (ex && ex < Date.now()) return;
          out.push(warning({ src: "sachet", id: "sachet:" + (tx(it, "guid") || link || t), title: t.slice(0, 140), area: (tx(it, "areaDesc") || st.replace(/_/g, " ")).slice(0, 160), severity: (tx(it, "severity") || (/(red|extreme)/i.test(t + d) ? "Extreme" : /(orange|severe)/i.test(t + d) ? "Severe" : "Moderate")).toUpperCase(),
            start: Date.parse(tx(it, "pubDate")) || Date.now(), end: ex, desc: d.slice(0, 1000), agency: "NDMA SACHET", uri: link || "https://sachet.ndma.gov.in/", cc: "IN" })); }); }
      catch(e){ errs.push(st + ": " + e.message); } }));
    if (errs.length && !out.length) throw new Error(errs[0]); return out; } });
agencySource({ id: "ptwc", name: "PTWC tsunami", provider: "NOAA Pacific Tsunami Warning Center", what: "Pacific tsunami threat messages", key: "No (relay)",
  async run(){ const d = xmlDoc(await viaRelay("https://www.tsunami.gov/events/xml/PHEBAtom.xml"));
    return Array.from(d.getElementsByTagName("entry")).slice(0, 10).filter(e => Date.now() - Date.parse(tx(e, "updated")) < 86400e3).map(e => { const t = tx(e, "title"), s = stripHtml(tx(e, "summary")), pt = (tx(e, "point") || "").split(/\s+/).map(Number);
      if (/no tsunami threat/i.test(t + s)) return null; const tier = /WARNING/i.test(t + s) ? 3 : /THREAT|ADVISORY/i.test(t + s) ? 2 : 1;
      const w = warning({ src: "ptwc", id: "ptwc:" + tx(e, "id"), title: t, hazard: "TSUNAMI", area: "Pacific", lat: isFinite(pt[0]) ? pt[0] : null, lon: isFinite(pt[1]) ? pt[1] : null, severity: tierSev(tier), start: Date.parse(tx(e, "updated")), desc: s.slice(0, 900), agency: "Pacific Tsunami Warning Center", uri: "https://www.tsunami.gov/", cc: "" });
      if (w.lat != null) w.sites = sitesNear(w.lat, w.lon, CFG.ranges.tsunamiKm).map(x => ({ code: x.code, km: x.km })); return w; }).filter(Boolean); } });
export { STATE };
