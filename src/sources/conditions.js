// City conditions: weather now and next 48 h (each country's national model where one is published),
// air quality (WAQI stations, CAMS model as fallback and forecast) and river flow (GloFAS).
import { getJSON, asArr } from "../core.js";
import { CFG } from "../config.js";
import { CITIES, STATE } from "../model.js";
import { register } from "./index.js";

export const MODEL_NAME = { jma_seamless: "JMA", kma_seamless: "KMA", cma_grapes_global: "CMA", bom_access_global: "BoM", ecmwf_ifs025: "ECMWF", AUTO: "auto" };
const coords = list => `latitude=${list.map(c => c.lat).join(",")}&longitude=${list.map(c => c.lon).join(",")}`;
register({ id: "weather", name: "Weather and 48-hour forecast", provider: "Open-Meteo (JMA, KMA, CMA, BoM, ECMWF models)", what: "Temperature, rain, wind now and the next 48 hours for every city", group: "City conditions", every: 15 * 60e3,
  async run(){ const groups = {}; CITIES.forEach(c => { const m = CFG.wxModels === "auto" ? "AUTO" : c.model; (groups[m] = groups[m] || []).push(c); });
    const cur = "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code", daily = "temperature_2m_max,precipitation_sum,wind_gusts_10m_max,weather_code"; let ok = 0;
    await Promise.all(Object.entries(groups).map(async ([model, cs]) => { const q = `${coords(cs)}&current=${cur}&daily=${daily}&forecast_days=3&timezone=auto`; let res = null, auto = model === "AUTO";
      try{ if (auto) throw 0; res = asArr(await getJSON(`https://api.open-meteo.com/v1/forecast?${q}&models=${model}`)); if (!res[0] || !res[0].current || res[0].current.temperature_2m == null) throw 0; }
      catch(e){ try{ res = asArr(await getJSON(`https://api.open-meteo.com/v1/forecast?${q}`)); auto = true; }catch(e2){ res = null; } }
      if (!res) return; ok++; res.forEach((r, i) => { STATE.city.wx[cs[i].name] = Object.assign(r, { model: auto ? "AUTO" : model }); }); }));
    if (!ok) throw new Error("no weather model responded"); }, count: () => Object.keys(STATE.city.wx).length });
register({ id: "cams", name: "Air quality model (CAMS)", provider: "Copernicus CAMS via Open-Meteo", what: "Modelled US AQI now and the 72-hour forecast for every city", group: "City conditions", every: 15 * 60e3,
  async run(){ const j = asArr(await getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?${coords(CITIES)}&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=3&timezone=UTC`));
    j.forEach((r, i) => { const c = r.current || {}; let fmax = null; if (r.hourly && r.hourly.us_aqi) r.hourly.time.forEach((t, k) => { const ts = Date.parse(t + "Z"); if (ts > Date.now() && r.hourly.us_aqi[k] != null) fmax = Math.max(fmax || 0, r.hourly.us_aqi[k]); });
      STATE.city.cams[CITIES[i].name] = { aqi: c.us_aqi != null ? Math.round(c.us_aqi) : null, pm25: c.pm2_5, pm10: c.pm10, fmax: fmax != null ? Math.round(fmax) : null }; }); }, count: () => Object.keys(STATE.city.cams).length });
register({ id: "waqi", name: "Air quality stations (WAQI)", provider: "World Air Quality Index project", what: "Measured AQI at the nearest station to every city (India uses the CAMS model)", group: "City conditions", every: 15 * 60e3, key: "Token",
  enabled: () => !!CFG.keys.waqi, offWhy: () => "add the WAQI token in Settings; the CAMS model is used meanwhile",
  async run(){ let good = 0; await Promise.all(CITIES.filter(c => c.cc !== "IN").map(async c => { try{ const r = await getJSON(`https://api.waqi.info/feed/geo:${c.lat};${c.lon}/?token=${encodeURIComponent(CFG.keys.waqi)}`, 15000);
        if (r && r.status === "ok" && isFinite(+r.data.aqi)){ good++; STATE.city.air[c.name] = { aqi: +r.data.aqi, station: r.data.city && r.data.city.name, t: r.data.time && r.data.time.iso ? Date.parse(r.data.time.iso) : null }; } else delete STATE.city.air[c.name]; }
      catch(e){ delete STATE.city.air[c.name]; } }));
    if (!good) throw new Error("no stations returned"); }, count: () => Object.keys(STATE.city.air).length });
register({ id: "river", name: "River flow (GloFAS)", provider: "Copernicus Emergency Management Service via Open-Meteo", what: "7-day river discharge forecast against the 30-day median, per city", group: "City conditions", every: 60 * 60e3,
  async run(){ const j = asArr(await getJSON(`https://flood-api.open-meteo.com/v1/flood?${coords(CITIES)}&daily=river_discharge&past_days=30&forecast_days=7`, 30000)), today = new Date().toISOString().slice(0, 10);
    j.forEach((r, i) => { const d = r.daily; if (!d || !d.river_discharge) return; const past = [], fut = []; d.time.forEach((t, k) => { const v = d.river_discharge[k]; if (v != null) (t < today ? past : fut).push(v); }); if (!past.length || !fut.length) return;
      const med = past.slice().sort((a, b) => a - b)[Math.floor(past.length / 2)], peak = Math.max(...fut); STATE.city.river[CITIES[i].name] = { med, peak, ratio: med > .5 ? peak / med : null }; }); }, count: () => Object.keys(STATE.city.river).length });
