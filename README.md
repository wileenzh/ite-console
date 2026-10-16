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
reference** of the building, **weather over the site** every 10 minutes, and **your own provider** for fresh sharp
pictures. Add them from Camera wall › 🛰 + Satellite feed, Camera sources, or a site's Site plan.

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
