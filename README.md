# ITE — Intelligence to the Edge

A browser-based situational awareness console: hazards and official warnings on a map, typhoon and protest tracking,
live news and a live TV wall, sentiment analysis, camera monitoring, incident management and executive reporting.

**Open it:** https://wileenzh.github.io/ite-console/

This hosted copy runs entirely in your browser:
- Sign in with any name; you are the administrator of your own copy.
- Everything you enter stays in your own browser. Nothing is shared between people or sent anywhere.
- Its sites (data centres, campuses and offices) are fictional, placed at random positions in major cities. Maps, hazards, news and live feeds are real public sources.

Features that need a server (shared data, background monitoring, relaying news sources that browsers block) are
described in the hosting guide that ships with the full package.

## Satellite view and Drone watch (Security Operations)

- **Satellite view**: high-resolution imagery with labels; past imagery (Esri Wayback) with a fade to compare dates;
  NASA daily satellite (VIIRS); live clouds every 10 minutes (Himawari); night lights for power checks; fire hotspots;
  your own commercial provider by tile address. "🛰 Satellite view" is also on every site's popup and card.
- **Drone watch**: drones from sensor feeds (Remote ID receivers, RF detectors, radar — any JSON over HTTPS, OpenDroneID
  field names understood), from cameras set to watch the sky, and from guard sightings. Alert and critical zones around
  every site, loitering alerts, tracks and pilot positions, alerts into the Action queue, and a training scenario.
  Detection only — stopping a drone is for authorised agencies.

## Satellite feeds for buildings (Camera wall, Camera sources, Site plan)

A satellite "camera" per site: **Sentinel-2** (10 m, a pass every few days — every pass with its cloud cover from the
public Copernicus catalogue, the latest clear picture once a free Copernicus account is linked, the next pass
estimated, and a change check between the two latest clear pictures that can raise an action), a **high-resolution
reference** of the building, a **live satellite loop** (the last two hours over the site from Himawari-9, or GOES over
the Americas, a new frame every 10 minutes, infrared day and night or 1 km visible by day), and **your own provider**
for fresh sharp pictures. Add them from Camera wall › 🛰 + Satellite feed, Camera sources, or a site's Site plan.
No public satellite streams live video of a building; the live loop is the closest to a traffic camera.

## Weeks 2–5 outlook (Intelligence Monitoring)

The odds that each week from day 8 to day 35 is unusually hot or cool, wet or dry, or low or high pressure, for every
city with sites, as chances of each fifth of the last 10 years for the same dates (ERA5). Built from the free GFS
ensemble (31 forecasts, 35 days, via Open-Meteo). The console keeps its own forecasts, checks them against ERA5 once
the week has passed, learns each city's systematic error by lead week and removes it, and leans toward climatology at
longer leads. This follows the idea of Probabilistic Bias Correction (PBC; Microsoft Research, *Nature*, 2026).
PBC itself (github.com/mouatadid/pbc, MIT) runs on a server with ECMWF S2S forecasts and ERA5; its quintile
probabilities can be read from the PSOC server or an imported JSON file and replace the built-in estimate where they
exist. Weeks with high odds of an extreme week are listed under "Weeks to watch" and can be added to the Daily Shift
Report.

## Perimeter (Security Operations › Perimeter)

A site's fence as zones (drawn on the satellite map, a zone every 120 m) and the sensors that watch each zone: fence
vibration or fibre, microwave beams, ground radar, thermal cameras with analytics, gates (OnGuard) and lighting.
Alarms are correlated per zone: two independent sensor types within 60 s is a **verified intrusion** (P1); one type
alone is **unverified** (P3) with the likely cause — wind gusts or heavy rain at the site right now, a nuisance-prone
zone, a camera seeing someone outside — and tamper/cut is P2. **Checks**: sensors offline, walk tests due, zones with a
single layer or no camera, nuisance-prone zones, and the guard's zone-by-zone perimeter check (issues become actions;
the result can go into the Daily Shift Report). **Design** shows which layer covers each zone. **Connect** gives the
JSON event format the PSOC server forwards from the perimeter system, and a device-list import. An example perimeter
with simulated devices and six training scenarios can be created for any site.

## Camera analytics: the vision pipeline (BAU Operations › Camera analytics)

Every frame goes through five stages, shown live per camera: **image acquisition** (source, resolution, frame rate,
gaps), **image processing** (brightness, contrast, noise and sharpness; dim or flat pictures are level-stretched on screen,
while the analysis keeps the original frame), **feature extraction** (motion, edges, colour; checks against each
camera's own normal raise tamper alarms for a smeared or out-of-focus lens, a moved camera and a frozen picture),
**model analysis** (COCO-SSD people, vehicle and bag detection with its speed and confidence) and **decision** (every
rule with its current value against its threshold, and the alarms raised into triage). Behaviour only: faces are not
identified or matched.

"▶ Test videos" runs one or more video clips as test cameras for the session (they are not kept).

## Reports (Response › Reports)

- **Daily Shift Report** in the PSOC's format: staff on duty, overall status and counts, Observations, Information,
  Intelligence, Pending actions, Things to note (by role and items), upcoming A/B Class and PE sites, and sign-off.
  "Fill from the console" brings in open escalations, active incidents, tracked protests and pending actions; anything
  still open carries over from the previous day's report. Every entry can be edited, reordered, or reworded with AI
  (facts are checked so nothing new is added).
- **Spot reports** (for example "Civil Unrest (Developing)"): from a protest in the Protest tracker (📝 Spot report),
  with the BLUF written from the tracker (local and UTC times, organiser, start and finish, nearest site and its
  distances), impact and monitoring lines, source and confidence, and numbered figures (route map, poster or photos).
- Both export a self-contained **HTML file**, copy into an email with their formatting, and can be filed in the
  repositories. Team name, organisation and footer marking are set under ⚙.

## Security gateways

Administrator › **Security** shows and controls them:
- **Inbound data gateway** — every response from an outside API, feed, relay or server is checked before the console
  uses it: executable content and oversized responses are refused; JSON, XML/RSS/CAP, HTML and text are cleaned of
  script blocks, frames and plugins, inline event handlers, `javascript:` links and `__proto__` keys.
- **Output guard** — anything that still tries to add a script, plugin, inline handler or script link to the page is
  removed before it can run.
- **Library fingerprints** — Leaflet, SheetJS and the libraries loaded on demand only run if they match a pinned
  SHA-384 fingerprint (jsDelivr, then unpkg).
- **Content Security Policy** and a **connection gateway** (Monitor or Enforce: only approved hosts).
- **Access gateway** — optional passcode (PBKDF2-SHA-256), auto-lock when idle, lock-out after wrong tries.
- A **self-test** runs real malicious samples through the gateway and shows what the console received.

## iPhone app

**Install:** open https://wileenzh.github.io/ite-console/app/ in **Safari** on the iPhone, tap **Share**, then
**Add to Home Screen**. ITE then opens from its own icon, full screen, with a phone layout (Home, Map, Queue,
Incidents, More). It is the same console with the same features; on a phone it keeps its own data and settings.
The app page is rebuilt from the console with `python3 tools/build_app.py`.

## Desktop app (Windows)

**Download:** [ITE-Setup-1.0.0.exe](https://github.com/wileenzh/ite-console/raw/main/download/ITE-Setup-1.0.0.exe)

The desktop app runs the console with its own built-in server on your computer only, so the video wall,
channel look-ups and blocked news sources all work without any hosting. The app isn't code-signed, so Windows
may show "Windows protected your PC": click **More info → Run anyway**.
