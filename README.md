# TTE — To The Edge

A browser-based situational awareness console: hazards and official warnings on a map, typhoon and protest tracking,
live news and a live TV wall, sentiment analysis, camera monitoring, incident management and executive reporting.

**Open it:** https://wileenzh.github.io/ite-console/

This hosted copy runs entirely in your browser:
- Sign in with any name; you are the administrator of your own copy.
- Everything you enter stays in your own browser. Nothing is shared between people or sent anywhere.
- Its sites (data centres, campuses and offices) are fictional, placed at random positions in major cities. Maps, hazards, news and live feeds are real public sources.

Features that need a server (shared data, background monitoring, relaying news sources that browsers block) are
described in the hosting guide that ships with the full package.

## Finding your way

- **Go to… (Ctrl+K, ⌘K on a Mac)**: type any part of a screen, product, site code or action — "protest", "cyber
  brief", "XSG11", "new escalation", "status board" — and press Enter. Recent screens are listed first.
- **? Guide**: how the PSOC workflow runs in TTE — detect, triage, escalate, respond, report, and the video wall — with
  a button to each place.
- Toolbars show the main action first; downloads and less-used actions sit under **Download ▾**, **More ▾** and
  **Send options ▾**. A burst of new actions shows as one notice. The top navigation scrolls within itself instead of
  pushing the page sideways; on a phone, product pages open on the preview with a product picker.

## Channels (Visual Command Centre › Channels)

Monitor-ready views for the PSOC video wall, one facet each, in large type, refreshing by themselves: **Aerial Map**
(satellite imagery with sites and alerts, touring each alert's impact zone), **Alerts — Summary** and **Alerts — Detail**
(one alert at a time with sites and people in the zone, rotating), **Assets** (sites at risk now and why, by country),
**Grid Map** (one map per region side by side), **Incident Communications** (incidents, mass notifications with
replies, escalation updates due, reports sent), **Montage** (several channels on one screen), **Perimeter & optics**
(perimeter zones per site and the latest camera pictures) and **Status Board** (threat level by domain, operations,
systems and feeds, clocks). Show a channel in the tab, full screen, or on another monitor (its own window,
`#channel=<name>`); set up monitors with one channel or a rotation (`#monitor=<id>`), drag each window onto its screen
and press F11. The same browser must be signed in. Channels only display; nothing is sent or decided from them.

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

## Internet & power (Intelligence Monitoring)

Internet outages by country from IODA (Georgia Tech, free), undersea cable faults (7 days) and power outages (72 h)
from the news (GDELT), matched to site countries and cities, and a register for what the NOC, telcos and utilities
report. Per country the signals are read together (an internet outage with power-cut news is most likely a power
problem). Ongoing disruptions and major power cuts near sites go to the Action queue.

## Cyber threats (Threat Intelligence)

Ransomware victims named on leak sites and cyber attacks reported in the press (ransomware.live), for site countries and
key sectors (technology, telecoms, data and cloud, energy, logistics, facilities); a watchlist of suppliers and
partners (a match is a P2 action); exploited vulnerabilities from CISA's KEV catalog, marked when used by ransomware
and matched to the vendors of the sites' security, building and network systems (P2/P3 actions); internet connectivity
per country from the Internet & power tab. Leak-site pages and screenshots are never opened or shown. ransomware.live's
free API is for personal use — for company use, request its PRO key under its terms.

## Threat Intelligence (its own tab) and one report template

Threat Intelligence has its own top-level tab: **Threat overview** (operating-environment and cyber levels, key
judgements, trends), **Cyber threats**, **Microsoft security**, **IOC workbench** and **Briefs & templates**.
Every PSOC report and brief uses one house template (team line, title and date on a navy band, overall level, key
judgements, tables, sources and confidence, marking footer): Threat Intelligence Summary, Ops Intelligence Brief, Cyber
Threat Brief, Daily Shift Report, spot reports, the shift handover, anything sent from the console (repository
products, incident reports, briefings), incident summaries, volcano briefs, the weekly alarm categories table and the
executive weekly snapshot. Event notices keep their prescribed notice format.

## Products by category, archived in the repositories

Products are split by category. **Threat Intelligence › Intelligence products**: Threat Intelligence Summary, Weekly
Threat Roll-up, Cyber Threat Brief, Ransomware & Supplier Risk, Exploited Vulnerabilities, Microsoft Defender
Incidents, Indicators of Compromise, Natural Hazards, Civil Unrest Outlook, Travel Risk, Daily Situation Report,
Country Security Profile (plus spot reports and volcano
briefs from their own tabs). **Response › Ops products**: Ops Intelligence Brief, Site Threat Assessment, Physical
Security, Internet & Power (plus the Daily Shift Report, shift handover, executive weekly snapshot, weekly alarm
categories and incident reports from their own tabs). Every product issued from any tab — emailed, posted to Teams,
drafted, exported or filed, including playbook case reports — is archived automatically: intelligence products in the
Intelligence repository, ops products in the Operations repository. Each archive entry keeps the searchable text and
the issued copy exactly as sent ("Open the issued copy"; kept in the issuing browser's database until the PSOC server
holds it), with every time it was issued and how. "Archive all now" files the current issue of every product.

## Operator console (Visual Command Centre › Operator console)

Modelled on how Everbridge documents its Visual Command Center operator console (support articles and datasheet),
built on TTE's own data with TTE's own names and look. A full map with a **Feeds** panel — Search; **Alerts**;
**Risk events** (earthquakes, official warnings, global disasters, tropical cyclones, volcanoes, intelligence events,
protests tracked, located news, access-control alarms, camera analytics, perimeter alarms, operator-entered risk
events) with a severity filter; **Assets** (datacenters, offices, people, cameras, perimeters as areas); **Context**
(acknowledged alerts, impact zones, day and night, lat/long grid, fires, live clouds, travel advice, KML layers);
**Critical events** (escalations) and **Incidents**. An **alert** is a risk event near an asset: per source a minimum
severity and an alert radius for datacenters, offices and people (Apps › Alert settings), areas by containment,
site-bound sources at their own site, plus Always alert, Auto critical event and Action queue options. The alert
toolbar: Acknowledge (disposition: relevant – no known / some / significant impact, duplicate, not relevant), Snooze
(5 min … 12 h, until it expires), Note, Communication (mass notification to people in the zone), Incident, Critical
event, Send (email / Teams with the standards check), Command view (locks the alert on the wall channel), Timeline,
Area filter, Log, Reinstate — states shared between operators. **Items** panel (card / list, counts by type, find),
**Timeline** (now line, Now, Go to now, Set range, month / week / day / hour, drag and wheel), panel buttons, and the
⋯ menu: map style (Road, Aerial, Hybrid, Low light); Tools (Excel report of the items in view, map image, add a KML
feed, saved views, annotations, map filter circle / rectangle / polygon, measure distance, restore default view); Apps
(alert settings, channels, Mirror: open, send view, stream, download view); Preferences (audio alerts, scale bar,
metric / English / nautical units, lat/long sensor, full screen). Channels gain **Command view**, **Mirror** and
**Favourite views** (saved views ticked for the wall rotate, the way GSOC monitors cycle through regions).

Second pass, after the operator guide: **search by type** (alerts, risk events, assets, people, incidents, context,
places); alert details as the guide lists them — **event start and end with the time from now**, severity and
category from the source, source, more-information link, **Show previous updates** (severity, headline and end-time
changes are recorded; a snoozed alert comes back when its event is updated), operator log; alerts **expire an hour
after their event ends**; **right-click** on the map (copy lat/long, add as area filter, communication to contacts in
the area, critical event, new risk event, annotation) and on an alert or risk event (the alert actions);
**operator-entered risk events** with the guide's categories and severities (Unknown … Extreme), **update** and
**close** (end = now); **Launch communication** as a four-step wizard — choose a template, message (imminent threat to
life, high priority, send confirmation, attach map / report; email, SMS, voice, Teams chat), recipients (contacts in
the area or the event's polygon, incident subscribers, a team, extra addresses, untick to leave out), preview and
send — with replies shown on the alert and people coloured on the map by their latest reply; a **critical event
workspace** on every escalation — details (event type, owner, description), task list (not started / in progress /
needs attention / done / N/A), incident communications, attached documents (links, or files kept in the browser),
affected assets, notes and activity, Close Critical Event — and launching one from the console brings the operator
back to it; **Alert report** (24 h / 7 d / 30 d, map view or world, with acknowledged) in the house template, ready
to send; **saved views** with rename, search and a share link (#opview=…); the Items panel's **sort** (priority,
newest, severity, nearest, name) and **asset-type toggles**; a **map-filter summary** (datacenters by class, offices,
people, active alerts inside; communication or critical event for the area); a **risk history heat map** (90 days)
and **category symbols** on risk events; assets **grouped by city** when zoomed out.

Third pass, the operator-console look: the map fills the window below the header (⛶ for full screen) on **Low light**
— satellite imagery in greyscale, darkened, with white place names (the older dark canvas stays as *Dark canvas*) —
with faint **continent and ocean names** at world zoom and **blue pin** assets (a count in the pin when zoomed out;
people stay as dots coloured by their reply). The chrome is one slim toolbar (Feeds, Items, **Alerts** with the
active count, Timeline, full screen, ⋯); the panels start closed. A **vertical zoom slider** and a **Location…**
search box (results pop upward; Enter takes the first) sit at the lower left, and a small **control bar** is centred
above the timeline (‹ Month Week Day Hour ›, Live, Now, Range…, item count). The **timeline** is a dark band with
grid lines, time and date labels and the now marker, events drawn as **stacked icon columns** per time slot — the
category symbol, red for active alerts and severe or extreme events, orange for moderate, white for minor or
unknown; “+n” zooms into a crowded slot — and an **overview bar** (30 days around now, density ticks) whose light-blue
window shows the period in view: click to jump, drag to move. Phone: zoom buttons at the top right, the control bar
scrolls, the timeline is shorter.

**Air traffic** (Feeds › Air traffic): live aircraft from ADS-B on the operator console — yellow aircraft turned to their
track (red in an emergency, green military, grey on the ground, orange when selected), callsign labels when zoomed in,
the selected flight's trail, From → To from the callsign route database with a dashed line to the destination, and a
flight card (callsign, registration, type, operator, category, altitude, ground speed, vertical rate, track, squawk,
GPS accuracy, source, flags, nearest site; Follow, trail, Track as risk event, Copy, public tracker and photo links).
The search box finds aircraft in view and any callsign or registration worldwide. Three new risk feeds raise alerts
like the others: **Aviation emergencies** (squawk 7500 / 7600 / 7700 and emergency status, checked worldwide every two
minutes), **Aircraft near sites** (below 1,500 ft within 2 km of a site, helicopters and drones, or circling within
5 km — site-bound) and **GNSS (GPS) interference** (1° areas where more than 10% of aircraft report poor position
accuracy over two hours, the GPSJam method), plus a GPS interference map. Sources (Air traffic settings): adsb.lol
(open data, ODbL), airplanes.live (non-commercial), our own receiver's aircraft.json, or the Flightradar24 API through
the PSOC server (paid; key on the server, `/api/fr24/live/flight-positions/full?bounds=N,S,W,E`). Whole-view traffic
loads from country zoom (250 nm around the centre); optional site watch checks the air around each site city in turn.

**Conflict and control** (Feeds › Conflict and control): conflict maps in the style of published assessed-control maps,
shared between operators. Each map has sides with colours, **areas of control** (drawn on the map, imported from
GeoJSON or KML, or a **live public ArcGIS layer** such as a research institute's assessed-control layer), **contested**
ground drawn hatched, **supply routes** (open, contested, cut), **significant fighting** rings (24 h, fading to
72 h), optional **ACLED** battles and explosions (myACLED account; password not kept), as-of time, sources and a change
log. A legend box shows on the map. The **Armed conflict** risk feed raises alerts for fighting near sites and people
(50 km), control changes (by containment) and routes cut. **Figure** exports the current view as a PNG with title,
as-of time, key judgement call-outs, legend, our sites and sources, for reports and email. A training example
(invented sides and shapes) is included for practice. Credit the publisher of any layer you load; their copyright
applies.

## Intelligence events (Intelligence Monitoring › Intelligence events)

From PULSE's Intelligence dashboard. The Datasurfr events API (X-API-Key), the Max Security Reports API v3 (company +
token, optional; daily, monthly, forecast and analysis summaries dropped) and a news feed (Straits Times Asia by
default) are read together for the last 24 hours (48 h, 72 h or 7 days if chosen) every 10 minutes. One card per
country (site countries by default) plus Other, so nothing is dropped. A priority strip (near a site · severe or
elevated · new), type and source chips, relevance **Focus** (near our sites: within the radius or naming a site city),
**Wide** (adds serious events anywhere) or **All**, a radius of 25–250 km, a one-site filter, mute a type or a source,
mark seen and restore (14 days). Repeats are folded: same-template bulletins, a Max report that repeats a Datasurfr
event (the higher-rated one is kept), a headline that repeats either; reports of one kind within 10 km and a day read
as one situation. Each event maps to an escalation category and a severity (severe → P1, elevated → P2, otherwise P3)
and goes to the escalation form, the Action queue, or an open escalation as an update. New events raise a pop-up
(sound and a desktop notification optional); severe events near a site go to the Action queue by themselves (or
severe and elevated, or never). "Inspect the last responses" shows what each source returned. **Keys stay in the
browser that entered them** — never in Settings, backups, exports or the server sync; tokens are masked in the
diagnostics. If a vendor blocks browser calls, the request goes through the PSOC server relay. Sample events (marked
SAMPLE) can be loaded to try the page; the standards check refuses to send a report that contains them.

## Daily Situation Report and Country Security Profile (Intelligence products › Country and situation)

**Daily Situation Report** (from PULSE's draft brief): the events showing on Intelligence events, each with country,
impacted area, category and priority, effective dates, time identified, description, the closest datacenters (code,
class, distance, status), the closest corporate office and the data source strength as an Admiralty grade (a default per
source, set in `CFG.sitrep.grades`), with the assigned officer, a summary table and dashboards.
**Country Security Profile**, in the structure of the October 2026 country assessment: version history, BLUF,
assessment of country risk (national and each city with sites), threat prioritization, operating environment (purpose
and primary questions, methodology, country profile, operational geography), the national, environmental and
critical-infrastructure threats (assessment, dated evidence with an Admiralty grade, watch indicators), outlook and
current-quarter outlook, the Admiralty method and an annex per city with sites. Ratings run LOW · MODERATE · HIGH ·
CRITICAL, impact is stated on CO+I (`CFG.csp.org`). The analyst writes the text in **Edit profile** (kept per country in
the browser; export / import to share); the console adds a **Current reporting** box beside each threat and annex —
escalations, intelligence events, hazard levels, earthquakes, cyclones, protests, internet and power, travel advice —
kept apart from the assessment. "Save as new version" adds the version-history row.

## Standards check (every product, before it is sent)

Every product is checked against the same rules before it goes: no placeholder text, a handling marking, a
distribution list, sources stated, every action with an owner, key judgements (no more than 8), feeds current. The
Country Security Profile adds the house rules: BLUF present and short, every geography and threat rated, every threat
assessed, impact above LOW explained, evidence dated ("October 10, 2026") and Admiralty-graded, at least three watch
indicators, the version in the version history, the outlook written, annexes written, "requires site-specific
confirmation" where impact is above LOW. The Daily Situation Report adds: an assigned officer, a grade for every
event, no sample events. The result shows beside the preview (✔ / ⚠ / ✖); errors stop **Send…**, **Email now** and
**Teams now** unless the officer overrides with a reason, which goes in the audit trail and the send log.

## Help answers, storage and Excel export

The Guide (and Ctrl+K) answers plain questions from a built-in help set — no network, no key — each answer with a
button to the screen it is about. Administrator › System shows the browser storage the console uses, by area, and
**Export everything (Excel)** writes one workbook with a sheet per record type (escalations, actions, queries,
incidents, protests, welfare, reports, sends, intelligence events, camera alerts, alert log, audit, users, checklist,
snapshots). Settings, vendor keys and issued copies are never in it.

## Threat reports, dashboards and sending (Intelligence products / Ops products)

Fourteen reports are written from the console's data: Threat Intelligence Summary, Weekly Threat Roll-up, Site
Threat Assessment (any site), Ops Intelligence Brief, Cyber Threat Brief, Ransomware & Supplier Risk, Exploited
Vulnerabilities (with EPSS), Microsoft Defender Incidents, Internet & Power, Civil Unrest Outlook, Natural Hazards,
Travel Risk, Physical Security (perimeter and camera analytics) and Indicators of Compromise. Each has a report
number, period, distribution and next issue; the level; KPI tiles showing the change since the report was last sent;
key judgements; "what changed"; a dashboard (threat matrix, weekly columns, bars, shares, heat maps — drawn with
tables so they keep their look in Outlook, Gmail, Teams and print); detail tables; recommended actions with owner and
deadline; sources and confidence; and method.

**Distribution** is set per report (or one default list): email To / Cc, a Teams channel (its "Get link to channel"
address), Teams chat people, and a Teams Workflows webhook. One click:
- **✉ Email** sends straight away from your Microsoft 365 mailbox when you are signed in with Microsoft (Entra app:
  delegated Mail.Send; through the PSOC server, a sending mailbox). Otherwise Outlook on the web, your mail app or an
  .eml draft opens with the recipients, and the formatted report is on the clipboard (the .eml already contains it).
- **💬 Teams** posts an Adaptive Card through the workflow webhook, or a message to the channel (Graph, delegated
  ChannelMessage.Send), or through the PSOC server. Otherwise Teams opens the channel (summary on the clipboard) or a chat
  with the people and the summary filled in — Teams links cannot send by themselves, so you press Send.

The Daily Shift Report, spot reports, the Threat overview and anything sent from the console have the same buttons.
Every send is logged and listed under "Recently sent".

## Microsoft security (Threat Intelligence)

Microsoft Defender XDR incidents and alerts (and Microsoft Sentinel's, once Sentinel is onboarded to the Defender
portal) through the Microsoft Graph security API, read-only. Devices, IP addresses and accounts are matched to sites
with an asset map (host-name patterns and IP ranges → site code); active high/medium incidents touching a site become
PSOC actions. Defender Threat Intelligence articles and actor profiles, host / IP / vulnerability lookups (needs the
Defender TI licence and API add-on), advanced hunting with PSOC queries (devices exposed to ransomware-used flaws, mass
file renames, sign-ins from countries without sites, alerts on physical-security servers, contact with indicators
under review), and ready Security Copilot prompts. Connect by signing in with Microsoft (Entra single-page app,
delegated SecurityIncident.Read.All, SecurityAlert.Read.All, ThreatHunting.Read.All, ThreatIntelligence.Read.All; the
console must be served over https) or through the PSOC server.

## Cyber threat intelligence and analysis (Cyber threats › IOC workbench, Analysis & brief)

IOC workbench: paste any text; indicators (IPs, domains, URLs, hashes, CVEs, e-mail) are extracted and re-fanged,
checked against CISA KEV, EPSS, ransomware victims' domains, the watchlist and (when connected) Defender TI, optionally
Shodan InternetDB, prioritised, and sent to Defender hunting, copied defanged, turned into a Security Copilot prompt or
added to the shift report. Analysis & brief: weekly trends, most active groups and sectors, key judgements written from
the numbers, and a cyber threat brief exported as HTML, copied into email, filed or added to the shift report.

## Orchestrated playbooks (Response › AI agents › Playbooks)

Following Microsoft's "orchestrated intelligence" idea: agent-led workflows that carry a case from the alert to the
outcome, so each stage feeds the next. Six playbooks — supplier named by ransomware, exploited flaw in our vendor,
verified perimeter intrusion, internet or power outage, Defender incident at a site, protest within 1 km of a site —
start by themselves from the Action queue and the Protest tracker. The agent gathers context, prepares the hunt (IOC
workbench) and drafts the report with the case at the top; people record the decision, send the report (one click,
email and Teams) and close the case with its outcome, which goes into the Daily Shift Report. Autonomy per playbook:
Off, Suggest (the agent waits for a click) or Prepare (agent steps run themselves); agents never send, decide, open or
close anything. Every case is timed — detection to decision, report sent and closed — with the median time for the
same alerts without the playbook, the share of steps done by agents, outcomes and what to change; earlier outcomes
are shown to the triage agent on the next similar alert. One playbook is the pilot ("start with one priority
workflow"); practice runs with invented cases are not counted.

## AI agents (Response › AI agents)

A triage agent proposes a decision for every waiting action with its reasons and context (duplicates, open
escalations, other alarms at the same site, hazards, internet and power); a correlation agent groups signals about the
same place into proposed cases; a writer agent prepares the shift report and spot reports that are due; a watchdog
lists overdue decisions and updates, feeds down and sensors offline. Each agent is Off, Suggest or Prepare drafts;
none sends, decides, opens or closes anything — a person accepts or rejects every proposal, and every step is logged.
An agentic-SOC scorecard shows where TTE stands.

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

## Test & tune (Security Operations › Test & tune)

Step-by-step start for testing camera analytics and perimeter sensors, free test material, and what the console has
learned from operators' answers. Every alarm marked "False alarm" or as real teaches it which rule is too sensitive;
it suggests the setting to change (motion threshold, hours, crowd size, loitering time, vehicle/bag alarms; wind level
and confirmation window for perimeters) with one-click apply, and says what to change on the device where the setting
lives there (fence sensitivity, camera detection area, a second detection layer). A practice week of simulated history
shows the advisor straight away; practice data is marked and can be cleared.

## Camera analytics: the vision pipeline (BAU Operations › Camera analytics)

Every frame goes through five stages, shown live per camera: **image acquisition** (source, resolution, frame rate,
gaps), **image processing** (brightness, contrast, noise and sharpness; dim or flat pictures are level-stretched on screen,
while the analysis keeps the original frame), **feature extraction** (motion, edges, colour; checks against each
camera's own normal raise tamper alarms for a smeared or out-of-focus lens, a moved camera and a frozen picture),
**model analysis** (COCO-SSD people, vehicle and bag detection with its speed and confidence) and **decision** (every
rule with its current value against its threshold, and the alarms raised into triage). Behaviour only: faces are not
identified or matched.

**Glass and reflections**: for a camera looking out through a window, the analytics separate the real view outside
(E1, E2…) from reflections of the room (I1, I2…) — reflections are soft and lit by warm room light — show each area
enlarged next to the frame, and can ignore the reflection areas in motion and object detection.

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
**Add to Home Screen**. TTE then opens from its own icon, full screen, with a phone layout (Home, Map, Queue,
Incidents, More). It is the same console with the same features; on a phone it keeps its own data and settings.
The app page is rebuilt from the console with `python3 tools/build_app.py`.

## Desktop app (Windows)

**Download:** [TTE-Setup-1.0.0.exe](https://github.com/wileenzh/ite-console/raw/main/download/TTE-Setup-1.0.0.exe)

The desktop app runs the console with its own built-in server on your computer only, so the video wall,
channel look-ups and blocked news sources all work without any hosting. The app isn't code-signed, so Windows
may show "Windows protected your PC": click **More info → Run anyway**.

## Typhoon tracker — warning-centre style (Intelligence Monitoring › Typhoon tracker)

One storm model from JMA (RSMC Tokyo) where JMA has the storm, otherwise GDACS (JTWC / NOAA advisories). The map shows
the **forecast cone** joined from JMA's 70 % probability circles (GDACS cone polygon otherwise), **storm-force (≥50 kt)
and gale (≥30 kt) wind swaths** along the forecast plus the current wind circles, the **past track** coloured by
intensity with 6-hourly points, the **forecast track** dashed with class-coded forecast points (JMA classes TD, TS, STS,
TY, VSTY, VTY for 10-minute winds; Saffir–Simpson for GDACS-only storms) and time / wind / pressure labels every 24 h,
an animated storm symbol (mirrored in the southern hemisphere) with a name card (class, wind, pressure, movement), and
our sites coloured by exposure with dotted lines to the closest approach. Layer buttons, a legend and a **forecast
playback** slider; a storm header (max wind, gusts, pressure, movement, wind radii, peak forecast, sites exposed); the
**forecast advisory table** and **site exposure** (storm-force, inside the cone, within 500 km; when winds arrive).
**Figure for reports** draws a 1600 × 1000 chart with header, land, cone, swaths, tracks, labels, sites, side panel and
legend. The Operator console gets the same drawing as the **Typhoon tracks** context layer.

## Visual Command Centre, air traffic page, typhoon chart style, cameras (23 Oct)

- **Visual Command Centre**: the group is named Visual Command Centre; its screens share a dark slate look with a blue
  accent (slim tile headers, blue active tab).
- **Air traffic** (Visual Command Centre › Air traffic): a full flight-tracking screen — map of live ADS-B aircraft,
  search (callsign, registration, type, Mode S; Enter finds a flight anywhere), filters (airborne, emergencies, below
  10,000 ft, helicopters / drones, military), list of aircraft in view (emergencies first), flight card with route,
  altitude colours, GPS interference map. The Operator console top bar has an **✈ Aircraft** button.
- **Typhoon tracker, weather-console style**: thin intensity-coloured past track with a dot at every fix and the
  date each day, thin dashed forecast track with a coloured dot and a time / wind / pressure label at every forecast
  time and ticks every 6 hours (labels every 12), solid thin cone outline, wind swaths, a plain storm symbol and a
  quiet name block, dark base map with **satellite infrared** (Himawari, NASA GIBS) underneath. Under the map: an
  **intensity chart** (wind and pressure against time, class bands, now line) and **timings at our sites** (when
  gales and storm-force winds are expected at each site, with the closest approach). The report figure uses the
  same style.
- **Demo camera scenes**: the Operational camera wall and the simulated camera show a fence line or a vehicle gate
  with people, vehicles and nuisance (an animal, a branch in the wind, headlights, insects at night), infrared
  black-and-white at night, camera number / name / time overlay.
- **Perimeter › Cameras**: perimeter cameras with video analytics. Draw a **tripwire** along the fence (alarm when
  someone crosses from outside) or an **area** (alarm when someone stays in it); people / vehicles / any object;
  linked fence zone. Each camera is a "CCTV video analytics" device on the site, so a person on camera plus a fence
  alarm in the same zone is a **verified intrusion**. Live view with tripwires, areas, tracked objects and the
  model's score; detections with snapshots, labelled Real / Nuisance for training. Cameras send alarms only when
  **armed**; with the tab open, unarmed cameras run as a preview. Example fence cameras for the example perimeter.
- **Security Operations › Model training**: teach the analytics by example. Examples come from Camera analytics
  triage, perimeter camera labels and practice examples generated from the demo scenes. A small neural network
  (TensorFlow.js, in the browser) looks at the moving object's picture, shape and position; training curve, a 20 %
  check set, accuracy, real targets kept, nuisance screened out, confusion table, threshold. Use: off / score
  alarms / screen alarms below the threshold (kept as false alarms for review; tamper and lost feed never screened).
  Export and import the model as a file.
- **Operator console, matched to the Visual Command Centre screens**: base-map pill bar (Road, Aerial, Hybrid, Low
  light, Road dark, Hybrid dark, 🔧 tools); a floating **ALERTS** panel (count, collapse, cards with icon, time and
  title, **Acknowledge all** with a disposition and note); a **layers panel docked on the right** with "Business or
  category…" search, show/hide-all eye and in-view / total counts, and rows for Acknowledged Alerts, Global Security
  Items, Desk Journals / Roves (with a desk journal entry form), Cases, Assets (Datacenters, Offices, Campus areas,
  People; **Filters / legend** by site class with shaded cube icons; Visualization; **Radius zone**; **Contents**;
  Export to Excel), Active Cameras, Conflict, Air traffic, Local Conditions and Distribution, each with a
  group check box; a **DETAILS** panel in the dock with a red close button; shaded building icons when zoomed in;
  pill-shaped zoom slider and Location box; lat/long readout at the bottom centre.
- **Typhoon tracker, warning-chart style**: a cyclone symbol in the class colour at every forecast point (open for
  tropical / severe tropical storms, filled for typhoons, a ring for depressions); time labels every 12 hours in small
  boxes with a leader line, placed beside the track so they never overlap each other, the track or the warning box;
  every forecast time in the tooltip and table. An on-map **warning box**: class, analysis time, position, movement,
  maximum wind (kt, km/h, averaging period), gusts, pressure, storm-force and gale radii, and the full forecast table.
  Satellite infrared in grey by default (colour-enhanced as an option) so the track reads clearly.
- **Buildings on the operator console**: transparent circles in the class colour (offices blue, Class A orange,
  Class B amber, Class C teal, C-PE grey, Edge green); **campuses are drawn as boxes** (buildings with height). The
  legend shows the same symbols; the radius zone uses the class colour.


## Decluttered map and spinning storm (23 Oct)

- **Cleaner operator map**: datacenters and offices that sit close together on screen merge into one round cluster
  marker. Its ring is split by site class (the same class colours as the legend), with the site count in the middle;
  click it to zoom in. Active-alert rings that fall inside a cluster are folded into a red count badge on the
  cluster. Risk events that overlap are stacked into one marker with a count. Single sites stay as transparent
  class-colour circles, campuses as boxes, and a site with an active alert gets a red halo. The **Pins**
  visualization still shows every site individually.
- **Typhoon, weather-console style**: the storm is a cloud swirl that turns a full 360° continuously, clockwise
  in the southern hemisphere, inside a ring in the class colour. The likely-track area is a soft blue probability
  plume, darker towards the track, with its outer line at JMA's 70 % circle. During playback a smaller swirl moves
  along the track with the time beside it. When two storms sit close together, only the selected storm's name is
  shown.

## Air traffic: automatic feed switching and diagnosis (23 Oct)

- **Automatic switching**: if the chosen free feed fails (blocked by the browser, rate-limited or down), the console
  tries the other free feeds — adsb.lol, airplanes.live and **adsb.fi** (new) — and stays on the one that works.
  A failed feed is skipped for 5 minutes. It can be turned off in Air traffic settings.
- **Warning on the map**: when no feed answers, an orange "Air traffic unavailable" bar on the map says why for
  each feed, with **Test feeds** and **Settings** buttons (previously the error only showed in the Layers panel).
- **Test feeds** (map bar or Air traffic settings): asks every feed for aircraft near the map centre from this
  browser, and through the PSOC server when one is set, and reports OK with a count, blocked, busy or refused; one click
  switches to the first feed that works.
- **Security policy fix**: the flight feeds (and NASA GIBS satellite imagery) are now on the approved-host list
  before the page's Content Security Policy is built, so they also work with the connection gateway in Enforce mode.
  Before this fix they were blocked in that mode.

## News: every source on a story, facts and figures by source, a summary that cites where each point is from (23 Oct)

Every news story has **Read & summarise** (the headline opens it too; **Original ↗** still opens the publisher's
page in a new tab). It opens **the story with all its sources**, not just one article:

- **Sources S1, S2, S3…**: the outlets that carried the same headline (kept when duplicates are merged), plus other
  stories about the same event and place in the last 72 hours. Each source is read in full: publisher, author,
  published time, numbered paragraphs, figures highlighted, **Open original ↗**. Wrongly matched stories can be
  removed; possible matches are listed to add; any other article can be added by its link.
- **Facts and figures from all sources**, each labelled with its source and paragraph (S2 P4), sorted by kind
  (People, Money, Percent, Measure, Count, When, Quote) and marked **in 2+ sources** when other outlets report the
  same figure.
- **Go to the exact place**: clicking any citation (in a fact or in the summary) opens that source and highlights the
  sentence. The **↗** next to it opens the publisher's original page scrolled to that sentence and highlighted
  (a text-fragment link, supported by Chrome, Edge, Safari and recent Firefox).
- **Summary**: **Draft from sources** builds it from the sources' own sentences. A point that several outlets report
  cites them all, and when outlets give different figures it adds "Sources differ: 240 flights [S1 P1] vs
  230 flights [S2 P1]". **Draft with AI** (PSOC server or AI key) writes Bottom line / Key facts / Figures / Who said
  what / Sources disagree from the sources only, citing [S# P#]. Every draft ends with the source list (outlet, author,
  time, headline, link). Switch between **Edit** and the linked view where every citation can be clicked.
- **Check against sources** flags numbers that are not in the paragraph they cite (and says where they are), numbers
  in no source, citations that point nowhere, and points with no source. **Copy with links** pastes the summary
  into email or chat with each citation as a link to the original at the cited place. **Save** keeps it with the
  story, and **Track as escalation** carries it into the escalation log.
- **When a site blocks the browser** (most do): set the PSOC server under Integrations and articles are read
  through it. Otherwise choose **Use the reader service** (r.jina.ai; it receives only the article's address; tick
  "always" to use it for every blocked source), or paste the article text. Until then that source contributes its
  feed summary, marked as such.

## Weekly Operational Metrics (23 Oct)

BAU Operations › Access alarms (OnGuard) › **Weekly categories** is now the **Weekly Operational Metrics** page,
for the same week as the alarm table (Tuesday 0800 SGT to Tuesday 0800 SGT by default):

- **Five headline numbers against last week**: Total alarms (acknowledged entries in the OnGuard export), IcM tickets
  opened (the new IcM ticket log plus tickets recorded on Lenel and camera outages), Unique risk events
  (escalations opened, the same description counted once), SENs issued (site incidents opened) and RENs issued
  (event notices issued). Each shows last week and the change (▲ / ▼ / No change); hover a number for what it counts.
- **Key Operational Alarm Categories** as before, ending with **Overall acknowledgement workload** (all
  acknowledged entries, always compared with last week).
- **Metric notes** written automatically: what each SEN and REN was (site or country, category, date), what the IcM
  tickets were for, the workload against last week with the percentage change, and the share that was key operational
  alarms. **What is counted** lists every item behind the numbers; untick anything that should not count.
  **＋ Log IcM ticket** records a ticket (number, site, what it is for, opened time).
- **Copy for email** pastes the whole section (numbers, table and notes) with its formatting; **Copy summary**
  includes the notes. The **Executive snapshot** shows the same five numbers in a strip at the top, labelled with
  the week they cover.

## Typhoon fixes and news outlets (23 Oct)

**Typhoon tracker**
- JMA's own category is read for every forecast point. A storm forecast to become an **extratropical low** (JMA
  温帯低気圧) now shows as **LOW** (purple) in the labels, table, tooltips, legend and playback, instead of "TD 0 kt".
  A missing wind is shown as "—", never as 0 kt.
- Playback no longer carries the last known wind into a point that has none; at the end it shows
  "extratropical low".
- **Peak forecast** says "now · weakening" when the storm is at its strongest already, instead of quoting the
  1-hour estimate.
- JMA's forecast shows as soon as it arrives; GDACS (JTWC tracks, other ocean basins) fills in when it answers. If
  GDACS does not answer, an amber note says so in plain words ("no answer within 20 s") with **Try again**,
  replacing the red "signal is aborted without reason". Every request that times out now says this.
- Forecast-time labels stay inside the map.
- Fixed: the storm card was pinned over the top navigation (a style clash with the operator console's Alerts
  panel, which now has its own class).

**News outlets**
- **Breaking news (APAC)** reads 53 APAC newsrooms: Singapore, Malaysia, Indonesia, the Philippines, Thailand,
  Vietnam, Myanmar, Cambodia, Hong Kong, China, Taiwan, Japan, South Korea, India, Pakistan, Bangladesh,
  Australia, New Zealand, the Pacific and regional desks.
- **International news** (new tab beside it) reads 22 international outlets: UK, Qatar, Germany, France, Europe,
  US, Canada and the UN.
- A story carried by both groups appears on both pages, and **Read & summarise** shows every outlet that carried it.
- Each page shows how many outlets are on and answering. **Manage outlets** lists them by country with their
  health (stories read or the error), lets you turn any off, and adds your own RSS or Atom feed. Most news sites do
  not let a web page read their feeds; with the PSOC server set under Integrations, all of them are read through it.

## Live risk register, regional view, protests, flights, streamlined Intelligence (23 Oct)

**Risk register (Intelligence › Risk & trends › Risk register) is live**
- A pulsing "Live" line shows when it was computed. It refreshes every minute from the hazard, news, access-control
  and incident feeds, and pauses while you type.
- New columns:
  - **Likelihood** (1–5, live, with "up from" the residual likelihood when a live signal raises it);
  - **Impact** (1–5 per risk, editable in Edit baseline);
  - **Priority** P1 Critical / P2 High / P3 Medium / P4 Low;
  - **24 h** change.
- Live risk = live likelihood × impact (max 25). Priority: P1 at 20+ or tier 3, P2 at 15+ or tier 2, P3 at 10+ or
  tier 1, otherwise P4.
- A **5×5 risk matrix** (likelihood × impact) and **Top priorities now** with their evidence. Click either to open
  the risk.
- Scope by **region** (North Asia, Southeast Asia, India, ANZ) as well as by city. Sort by priority.

**Regional view (RSOM)** (Stakeholders › Regional view): for each region's security operations manager:
- headline numbers (high-priority risks, SERV releases to clear, open incidents, Lenel availability, camera outages,
  unacknowledged high alarms, open escalations);
- **the most important risks** for the region's cities;
- **SERV reports to clear**: releases to the region's sites until every site has responded, the SERV report is filed
  and the release is closed, ordered overdue → waiting → ready to file → filed;
- open incidents and escalations;
- **datacenter statistics** by city for the last 30 days: sites, datacenters by class, Lenel availability and outages,
  camera outages, access alarms, incidents.

Every item opens where it is handled. **Copy regional brief** gives a plain-text brief.

**Protest tracker**
- GDELT allows one request every 5 seconds per network, and its refusals reach a browser only as "Failed to fetch".
  Every GDELT call in the console now waits its turn and retries, and goes through the PSOC server when one is set.
- Protest and unrest stories from the news outlets fill the live reports and the country view when GDELT is
  unavailable, and can be tracked on the map or escalated.
- One "Tracked protests" heading.

**Flights**: **OpenSky Network** is a fourth free source (after adsb.lol, airplanes.live and adsb.fi). The console
switches to it on its own when the others are blocked. Without an account it refreshes about every 4 minutes
(400 requests a day).

**Intelligence Monitoring, streamlined**
- 23 tabs are now five sections: **Overview** (to-do, live alert stream, map), **Hazards**, **News** (live news,
  Breaking (APAC), International), **Security** (protests, intelligence events, internet & power) and **Risk & trends**
  (risk register, trends, statistics).
- The second row shows only that section's pages.
- **Hazards** breaks into each hazard with its own page and tools: all hazards, typhoons, earthquakes, weather,
  next 48 h, weeks 2–5, air quality, rivers & floods, volcanoes, official warnings and global disasters. Each has a
  status dot.
- Each section remembers the last page you used.

## Operational impact map, live operations, APAC director dashboard (23 Oct)

**Operational impact** (Intelligence › Overview › Operational impact): every live hazard drawn as an impact zone over our
sites, on its own full-width map.
- Zones and levels:
  - Earthquakes: estimated shaking rings (MMI VII+ severe, VI high, V moderate, IV watch).
  - Typhoons: storm-force and gale swaths and the likely-track cone.
  - Agency warnings: their own polygons.
  - Also GDACS floods, volcanoes and droughts, wildfires, volcanoes, protests (tracked and reported) and escalations.
- Each zone has a glowing marker with its hazard icon and the number of sites inside; severe and high zones pulse.
  Every site takes its worst zone.
- **Severe / High / Moderate / Watch** counts filter the list of sites in impact zones. Click a site or zone to go to it.
- Hazard types can be switched on and off.
- **Circle zone** and **Area zone** let anyone draw their own impact zone (name, radius, level) to see which sites are
  inside, for example a road closure or a planned march.
- **Copy impact summary** gives a text summary.

**Intelligence navigation**: section tabs with icons and a highlighted active section; softer page pills with
an underline.

**Live operations** (first tab in BAU Operations and in Security Operations), the operator's page:
- **Live stream** (updates every 10 seconds):
  - BAU: access alarms, Lenel offline, camera problems, incidents and releases awaiting responses.
  - Security Operations: perimeter alarms, patrol reports and taskings, drones, camera analytics and protests.
  - Items are sorted by priority. Click one for **what to do**: the procedure for duress, door forced or held,
    tamper, badge, controller offline, camera, perimeter, drone and protest. Acknowledge or open each item in place.
- **Do now**: the work in order (acknowledge critical alarms, Lenel offline, cameras to confirm, perimeter to verify,
  incidents to update, releases to chase, action queue), each with its procedure.
- **This shift**: start- and end-of-shift routine, shift checklist, escalation timers, action queue.
- Counts: waiting on you, critical, events in the last hour, mean time to acknowledge, Lenel offline and cameras.
- **Training scenario**: practice alarms, with a perimeter alarm, drone and patrol reports for Security Operations.
  New ones arrive every minute or so, clearly marked; stop it to remove them.

**APAC director dashboard** (Stakeholders, first tab; also on the Leadership home):
- for the senior director of physical security operations;
- overall APAC status (Red / Amber / Green) with a one-line bottom line;
- eight headline numbers: significant events, SEV 1–2 incidents, sites in high-impact zones, high-priority risks,
  welfare checks, RENs, SENs, Lenel availability;
- a map of significant events: impact zones, incidents and escalations;
- a status card per region that opens the Regional view;
- **What matters now**, which opens each item;
- the last 7 days by day, this week against last week, and decisions and support needed;
- **Copy leadership brief**. It refreshes every minute.

## Stakeholder views by audience, BAU and Security Operations sections (23 Oct)

**Stakeholders** now has one page per audience, in this order: APAC director, Regional (RSOM), Country (DSOM),
PSOC leadership, Clients, Releases to operations. The **Executive snapshot** tab has been removed. Old links to it
open the APAC director dashboard.

**APAC director**: the whole of APAC (unchanged). It links to PSOC leadership, Regional and Country.
**Decisions and support needed** is now worked out from live data:
- SEV 1 incidents;
- P1 escalations without an event notice;
- P1 risks;
- SERV responses more than 12 h overdue.

**Country (DSOM)**: what a datacenter security operations manager needs for their own country.
- A country picker. It opens on the user's scope country when one is set in Users & roles.
- Red / Amber / Green for the country.
- Headline numbers: waiting on action, high alarms unacknowledged, Lenel offline, cameras offline, open incidents,
  SERV releases, sites in impact zones, high-priority risks.
- **Do now in <country>**, with procedures, and the live stream for that country's sites only.
- Risks for the country's cities and its SERV releases.
- A site table: Lenel, cameras offline, alarms waiting, incidents and impact zone for every site.
- **Copy country brief**.
- The patrol officers' phone preview is kept underneath, collapsed.

**PSOC leadership**: what the PSOC manager needs to know about what the PSOC is looking at.
- Load: Steady / Busy / Stretched.
- Headline numbers: decisions waiting and past SLA, escalations open and overdue, incidents and SEV 1–2,
  unacknowledged high alarms, SERV releases ready to file, RFIs open, products and messages today, sources answering.
- **On the PSOC's screen now**: overdue escalations, SEV 1–2 incidents, escalations with their next update,
  high-impact hazards, P1/P2 risks, breaking news.
- **Performance today**: decisions made, mean time to decide, alarms acknowledged, mean time to acknowledge,
  products issued.
- **Monitoring coverage**: every source that isn't answering or is stale. Hover a source for the reason.
- **Waiting on decisions**, oldest first, against the SLA.
- What leadership receives from the PSOC is kept underneath, collapsed.

**BAU Operations** is grouped into five operational sections:
- Live
- Alarms (access alarms, camera analytics)
- Incidents & requests
- Systems health (Lenel, camera health, camera outages)
- Reports (dashboard and a new **Weekly metrics** page)

**Security Operations** is grouped into five operational sections:
- Live
- Patrol & response
- Perimeter & detection
- Site intelligence
- Setup & training

Each section button shows its alarm count and remembers the last page you opened in it. On a phone, use the bottom
bar and More as before.

## Operational decisions (23 Oct)

**Operational decisions** appear on the APAC director dashboard, under the headline numbers. The Regional page shows
those for its region and the Country page those for its country. Each one is an event and what the business is doing
about it, so stakeholders can decide:
- **Operational decision**: the bottom line, for example "all operational sites remain operational under minimum
  staffing with required security coverage".
- **Site posture**, line by line: site operations, staffing, security coverage, construction, Edge sites, offices,
  travel, deliveries. Each line has a state (operating normally, minimum staffing, reduced, stopped, no impact,
  nothing scheduled), the sites concerned and the detail. **Suggest from live data** drafts the lines from impact
  zones and Lenel status.
- **Updates**, dated, with when the next one is due. An overdue update shows on PSOC leadership and in the director's
  decisions list.
- **Planned arrangements**: weekend work, shift changes, deliveries.
- **Monitoring**: who is watching, with whom. Use role titles, not names or contact details.
- **Decisions needed**: stakeholders answer in place (Agree / Need to discuss, or the options you give). Their answer
  and note are recorded and the item moves to "Decided".
- **Copy update** gives the text in the usual update format for email or chat. The leadership brief includes every
  active operational decision.
- **Close event** moves it to "Closed in the last 7 days".

Operational decisions are shared with the team like other PSOC records (store `opdec`).

## Risk and value (APAC director), business impact (RSOM), threat modeling (PASTA) (23 Oct)

**APAC director › Risk and value** is a second view of the director dashboard (Overview | Risk and value). It is
quantitative risk in the CISSP sense:
- **Asset valuation and BIA** by site class: asset value, revenue per hour down, MTD, RTO, RPO.
- **Risk decisions**: one row per risk scenario, sorted by annualized loss:
  - SLE = asset value × exposure factor, plus hours down × revenue per hour;
  - ARO per site, raised by live signals in the risk register;
  - ALE = SLE × ARO across the sites in scope;
  - the safeguard, its yearly cost and the ALE with it;
  - ROSI = (ALE − ALE with safeguard − cost) ÷ cost;
  - a recommendation: Accept (within appetite), Mitigate, Transfer, Accept and monitor (doesn't pay back), or Avoid
    or redesign;
  - **Approve / Defer / Reject**, recorded with a note.
- Headline numbers: asset value protected, annualized loss exposure, ALE after approved safeguards, safeguards
  proposed, return on security investment, and business impact at risk now (sites in impact zones).
- A chart of annualized loss today against with the safeguard, plus a cost and return summary.
- **Business impact by region**: opens the Regional view.
- **Supply chain exposure**: single source, time to replace, and regions under disruption.
- **Threat models**: one line per site model (see below).
- **Assumptions**: asset values, scenarios, suppliers and appetite. These are shared with the team and recorded in the
  audit log.
- **Copy board brief**.
- Recommended safeguards not yet decided also appear in the Overview's "Decisions and support needed".

The figures shipped are illustrative defaults, and the page says so until Finance's values are entered. Use generic
supplier categories, not vendor names.

**Regional (RSOM) › Business impact** shows the same model for one region, in operational wording:
- data centres, revenue at risk per hour, sites in impact zones now, expected impact now;
- **Protect first**: the sites where an outage costs most, with sites in impact zones on top, each with MTD, RTO and
  its status now;
- **What could cost this region most in a year**, with the director's decision where one exists.

PSOC leadership and Country (DSOM) stay operational: both show operational decisions.

**Threat Intelligence › Threat modeling (PASTA)**: a model per data centre site, in seven stages.
1. **Objectives**: business goals, compliance, impact tolerance from the BIA, target probability of interruption,
   guard response time.
2. **Technical scope**: assets in scope, security systems at the site now, critical dependencies.
3. **Decomposition**: the security layers from the fence to the racks and the generator yard, with controls,
   detection probability and delay for each; entry points and flows.
4. **Threat analysis**: threat actors with motive and capability. Likelihood comes from the live risk register for
   the city, protests in the city and drone sightings near the site, and can be changed.
5. **Weaknesses**: what the console sees at the site today (Lenel offline, camera outages, door forced/held alarms,
   perimeter alarms or no perimeter connected, construction, patrol flags, hazards slowing response), plus known
   weaknesses to tick or add.
6. **Attack modeling**: five adversary paths. Each is simulated 2,000 times against detection, delay and guard
   response, giving the probability of interruption, the critical detection point and an adversary sequence chart.
7. **Risk and decisions**: ARO × chance of success × impact = ALE per attack; countermeasures with cost and effect,
   compared live; return on investment; recommendation and decision.

## Specific impact areas (24 Oct)

Impact zones now follow the real area of each hazard instead of a 25 km circle around a city:
- **Agency warnings**:
  - the polygon or circle the agency publishes (CAP) is used first;
  - if there is none, the states, provinces or prefectures the warning names (in its area, then its title and text)
    are drawn from built-in admin-1 boundaries, so a Selangor and Kuala Lumpur warning covers only those two;
  - Singapore, Hong Kong and Macau warnings cover the whole territory;
  - **marine warnings** (rough seas, sea areas, waters off, swell) are kept off land: no site is marked and no
    escalation opens from them;
  - warnings that name no area the console can map are listed under **Not on the map**, with **Draw its area**.
- **Escalations** use the area of the warning they came from, otherwise a small ring around each site they name. Only
  an escalation with neither falls back to a radius around its event point, labelled approximate.
- **GDACS floods, droughts and other events** use GDACS's published affected-area polygon once it loads.
- Every zone shows how its area was set: published by the agency, named area, whole territory, sites named,
  estimated shaking, forecast wind swath, or approximate.

The boundaries are Natural Earth admin-1 (public domain): detailed near our sites, coarser elsewhere, 265 KB embedded.
District-level areas (for example Petaling or Klang inside Selangor) are not mapped yet. Use **Draw its area** when a
warning is narrower than a state.

## Site plan as a blueprint (24 Oct)

Security Operations › Site intelligence › Site plans now draws each site as a blueprint:
- **The drawing**: the perimeter fence, the building, the data halls with rack rows and cold aisles, the corridor, the
  security lobby with desk, turnstiles and mantrap, the loading dock with three roller doors and the apron, the
  generator yard with generators and the fuel tank, the main gate with the guard house and barrier, and the car park.
  It has dimensions, a north arrow and a title block. Renamed zones keep their places; extra zones appear as rooms
  along the bottom.
- **17 cameras** in a standard layout, each with its field of view: corners, fence line, gate, car park, lobby,
  mantrap, dock, both data halls, generator yard and fuel tank.
- **Click any point** to open the camera that sees it straight away. Cameras stay on their side of the walls, so a
  data hall point shows a data hall camera. If several cameras see the point you can switch between them; if none
  does, the nearest camera in that area is shown, labelled as such. A crosshair marks the point on the plan.
- **Doors** show access control live: cyan secure, yellow for an unacknowledged alarm in the last hour on that
  door, red when Lenel is down. Click a door to see it on camera.
- **Incidents** are pins in their zone. Click a pin to see the spot on camera.
- **Cameras** with a camera outage are crossed out in red. Cameras linked to a real feed are filled in; the rest show
  a demo feed (gate, fence, data hall aisle, lobby or dock scene).
- **Place cameras**:
  - drag a camera to move it;
  - turn it, widen or narrow it, and lengthen or shorten its view;
  - rename it;
  - link it to a feed from the camera wall;
  - add or remove cameras, or go back to the standard layout.

  Changes are kept per site and recorded in the audit log.

The plan is a typical layout, not the site's as-built drawing. Each site's cameras can be placed to match reality.

## Control-room view and the five layers of physical security (24 Oct)

The site plan page is laid out like a security operations room, in dark control-room colours:
- **Blueprint** on the left, with the **spot monitor** and **camera wall** on the right:
  - the spot monitor is one large feed with REC, the time, the camera's layer, and the other cameras that see the same
    spot;
  - the camera wall is every site camera as a live tile in a grid, CCTV-styled. Down cameras show NO SIGNAL.
- **Clicking the blueprint** (any point, door, incident pin or camera) switches the spot monitor to that camera at
  once, with no popup. Cameras that also see the spot are outlined on the wall. **Full screen** opens the large view.
  Click a wall tile to put it on the spot monitor.
- **Five layers of physical security**, from the outside in:
  1. **Perimeter**: fence, fence sensors, thermal cameras, guarded gate, barrier.
  2. **Site grounds**: car park, dock apron, generator yard, lighting, patrols.
  3. **Building entry**: reception, ID check, turnstiles, loading dock screening.
  4. **Secure core**: mantrap with anti-tailgating, badge + PIN, corridor.
  5. **Data halls and racks**: badge + biometric doors, cage and rack locks.

  Each layer has a numbered badge on the blueprint and a card showing its cameras, doors and incidents, with a status
  of Secure, Attention or Breach risk and the reasons:
  - Breach risk: a SEV 1–2 incident, a forced door, access control offline for layers 3–5, or a verified perimeter
    alarm;
  - Attention: any other incident, door alarm, camera down or perimeter alarm.

  Clicking a layer highlights it on the plan and shows only its cameras on the wall.
- The spot monitor opens on the most urgent layer's camera.

## Realistic CCTV from a 3D site model, laid out as a video wall (24 Oct)

**Feeds.** Camera feeds are now rendered from a 3D model of the site, built with three.js (pinned with a
fingerprint, loaded from the library CDN) from the same layout as the blueprint:
- the fence with posts and welded mesh;
- the guard house and an animated barrier;
- the car park with parked cars, and the access road;
- the building facade and roof;
- the data halls with rows of racks, cold-aisle containment, cable trays and ceiling lights;
- the lobby with desk, turnstiles and the glass mantrap;
- the dock with roller doors, pallets and a truck at bay 3;
- the generator yard with generators and the fuel tank;
- lamp posts and trees.

**How each camera renders.** Each camera uses its blueprint position, direction and field of view, mounted at 3.6 m
indoors or 5.5 m on a pole outside, tilted down. The picture goes through a CCTV lens filter: grayscale, contrast,
grain, scanlines, wide-angle barrel, vignette and a slight glow around lights. NVR text shows the camera, the date
and time, the site and the layer.

**Movement, day and night.**
- People walk the site: staff from the car park through the turnstiles and mantrap into a data hall, technicians
  in the cold aisles, a guard patrolling, a dock worker, the receptionist and the gate guard.
- A car comes through the gate and parks; the barrier lifts for it.
- A dock door with an alarm is drawn open.
- At night the cameras switch to infrared, lit by their own illuminators.

The data hall aisle cameras now look straight down the cold aisles, and the lobby entrance camera looks at the
entrance from the car park. Without WebGL, the 2D demo scenes are used. On slow machines the frame rate drops
automatically.

**Layout, as in a security operations room.**
- **The video wall**, across the top:
  - VMS outdoor (layers 1–2, a 3 × 3 grid);
  - the site map (the blueprint);
  - VMS indoor (layers 3–5).
- **The operator desk**, below:
  - the spot monitor;
  - the security console, with the five layers and the incident list.
- Monitors have bezels and screen glow. Selecting a layer highlights its tiles on the wall.

## Situation update (24 Oct)

Each operational decision card has a **Situation update** button. It opens a composer that writes the stakeholder
message in the PSOC's format:
- **Title**: (Initial / Update / Final) Country | Hazard NAME.
- **Situation**: As of [date], at [hhmm] hours local time ([hhmm] UTC), … The draft comes from live data: the
  nearest tropical cyclone, its intensity trend (weakening, intensifying or steady) and whether it is approaching
  or moving away, plus any agency warnings in force for the country. Then the outlook and the monitoring line.
- **Impact and posture**: the operational impact level (Low to Severe) and the overall site posture (for example
  Impacted but Managed), with the reason and an impact statement.
- **Current Site Posture**: one bullet per site, each with:
  - its class;
  - its status (operational, operational under minimum staffing, under construction, closed, evacuated);
  - staffing by role (the roles are editable, CRS / RES / SO / SSS by default), written out as "one CRS, one RES, and
    one SO";
  - checkpoint staffed, patrols suspended, COD arrangements, COLO locked, construction or vendors suspended, and a
    free note.
- **The closing paragraphs**:
  - minimum staffing and suspended activities;
  - personnel safety and site access, plus "No flooding, road blockages, … or alarms has been reported" (untick any
    item that has been reported);
  - perimeter-camera observations;
  - continuing actions and escalation.
- **Figure 1**: Hazard Forecast Track Relative to Country Datacenters (+N hours, date, local and UTC). It is drawn
  from the forecast with coastlines and state lines:
  - past and forecast track, with the position at +N hours;
  - storm-force and gale-force wind areas, and the forecast uncertainty;
  - the country's datacenters, labelled together where they cluster;
  - a legend and the source.

The preview can be edited before copying. Buttons:
- **Copy message** copies rich text with the figure, and plain text.
- **Copy Figure 1** and **Download Figure 1**.
- **Save draft**.
- **Log as sent** adds the update to the decision and counts it in today's messages.

The organisation name in the impact sentence is a setting in the composer and is not stored in the repo.

## Situation update as a Teams post (24 Oct)

The situation update now goes to people in Teams, the way the PSOC director reads it, and the composer shows the post
exactly as it will appear.
- **The Teams card**, an Adaptive Card:
  - the team and "Situation update #N", then "Country | Hazard", the message type and the time in local and UTC;
  - three facts: operational impact (coloured), site posture and the hazard trend (weakening or intensifying,
    approaching or moving away, distance);
  - the bottom line and the outlook;
  - a site posture table: site, class, status, who is on duty, notes;
  - safety, access and systems as ticks, with anything reported in red;
  - perimeter-camera observations and the next update;
  - a link back to the console.
- **Post to channel**, in order of what is set up:
  - through a Teams workflow ("Post to a channel when a webhook request is received"), as the card;
  - when signed in with Microsoft, straight to the channel from its link, with Figure 1 inline;
  - through the PSOC server;
  - otherwise the channel opens with the post on the clipboard.
- **Send to chat**: one group chat per event with everyone involved (RSOM, DSOM, resilience, site teams). Every
  update goes into the same thread. When signed in with Microsoft, the chat is created and posted to, with Figure 1;
  otherwise Teams opens the chat with the summary filled in and the full post on the clipboard.
- **Email…**: the full write-up in the house format with Figure 1, sent through Microsoft 365 or as a draft.

**The composer** has five numbered sections: headline, situation, sites, safety and systems, and who receives it.
Choices are buttons, sites are compact rows, and the Teams post is previewed alongside. Each send is recorded on the
operational decision ("Last situation update … → channel"), added to its updates and counted in the day's messages.

## Site risk profiles, manpower and training, and My duties (25 Oct)

Each site now has its own risk picture, and the people who protect it are tracked in the console.

**Site risk profiles** (Intelligence › Risk & trends):
- **Terrain study:**
  - ground height at the site and at 1 km and 5 km in eight directions, from the Open-Meteo elevation service
    (cached for 30 days);
  - cross-sections north–south and west–east;
  - a classification (coastal lowland, low-lying plain, hilly, upland and so on);
  - flood, storm-surge and landslide susceptibility, plus seismic risk for the city;
  - manual fields: soil, drainage, flood history, access routes and neighbours.
- **Water and electricity:**
  - water supply and storage hours, utility feeds, generator fuel hours and UPS;
  - the live water and power signals for the city.
- **Protest activity near the site:** tracked protests and news reports within 10 km over the last 90 days, plus
  incidents at the site.
- **Site risk register**, in the register's colours:
  - inherent, residual and live score for every risk;
  - a "what is different here" column (low-lying, single utility feed, protests nearby, and so on).
  The city's register is adjusted for the site's terrain, utilities and nearby protests, and for the mitigations done
  there.
- **Mitigation — what has been done:**
  - each action has a status, owner, due date and evidence, and is linked to a risk;
  - training actions (for example "Train guards: typhoon and severe weather response") take their progress from the
    guards' own training records;
  - suggestions are offered for the top risks at the site;
  - **Copy summary** gives a text version.

**Manpower & training** (Security Operations › Workforce), for managers:
- **Now:** on duty against required, the shortfall, and late clock-ins.
- **Next 7 days:** open posts per day and night shift for every site, as a heat map.
- **Duties at the selected site:** a post-by-post board, with open posts that can be assigned to a free guard.
- **Training compliance:** by site and course, certificates expired, missing or expiring, and training logged by
  guards waiting to be verified.
- **What has been done in the last 30 days:** training, drills, mitigations and shifts worked.
- **Settings:** required posts per shift (defaults by site class) can be edited per site; there is also a copyable
  brief.

**My duties** (also open to the security patrol officer role), phone first, for guards:
- the current or next shift, with **Clock in**/**Clock out**;
- confirming or releasing a shift (a released shift shows as an open post for the manager);
- picking up open posts at the guard's site;
- the guard's hours and training status;
- **Log training or a drill**. A logged record counts as current but stays "awaiting verification" until a manager
  verifies or rejects it.

Everything a guard does here feeds the manager, campus, site and DSOM views.

**Stakeholders:**
- **Campus security:** one card per campus showing people on post, training, top site risks, mitigations, terrain and
  nearby protests.
- **Site security manager:** one site, showing the shift board, the next 7 days, training, open incidents, the five
  layers of physical security, site risks and mitigation progress.
- **The Country (DSOM) view** gains a per-site table of the highest site risk, its site factors, mitigations done,
  people on post, open posts and training.

A site without any shifts recorded shows "no roster recorded" rather than a shortfall.

**Load sample workforce** creates fictional guards (display names only), rosters and training records for one
country so the pages can be tried; **Clear sample** removes them. Guard records hold a display name, role, home site
and employer only; no phone numbers or IDs. All new records (guards, shifts, training, mitigations, site profiles,
required posts) are shared with the team like other PSOC records.

## Video wall (25 Oct)

The control room in **Security Operations › Site intelligence › Site plans** now opens with a full-width 3×3 CCTV
video wall.
- **Look:** tinted footage on a teal frame with thin gutters. Each tile has its camera number at the top left and a
  running timecode (HH:MM:SS:frames, site local time) at the bottom.
- **Choosing cameras:**
  - **All cameras**, **Outdoor · layers 1–2** or **Indoor · layers 3–5**;
  - page through nine at a time, or **Tour** to move to the next page every 12 seconds;
  - picking a layer on the console turns the wall to that layer's cameras.
- **MONO** switches to plain black-and-white.
- **Clicking a tile** puts that camera on the spot monitor.
- **Below the wall:** the blueprint site map, the spot monitor and the security console with the five layers.
- **On a phone:** the wall shows two tiles across.

Tiles show the simulated views from the 3D site model. A camera given a live feed (Site cameras) shows that feed in
its tile, with the same tint.

## Mobile app for each role, and the store app (25 Oct)

On a phone, and in the store app, the console opens on the screens for the person's role, each with its own bottom
tabs:
- **Security guard:** Shift (clock in and out) · Patrol · Report (flag to the PSOC with photo and location) · Alerts
  for my site.
- **Site security manager:** Site · Roster · Risk · Cameras.
- **DSOM:** Country · Decisions · Workforce · Sites.
- **RSOM:** Region · Decisions · Risk · Workforce.
- **APAC director:** APAC · Decisions · Risk & value · Campuses.
- **PSOC officer:** the standard Home · Map · Queue · Incidents.

**Choosing a role:** people pick their role the first time, and can change it under **More › My role in the app**.
Patrol officer accounts are always guards, and leadership accounts are always the director.

**Two new pages**, also on the desktop console:
- **Stakeholders › Operational decisions:** the decisions in force for your scope, with what is waiting for your
  answer.
- **Security Operations › Site alerts:** taskings, site posture, official warnings, protests and incidents for the
  guard's site.

**The store app** (iOS and Android) is in `mobile/`, built with Capacitor 8. It adds:
- shift reminders an hour before each booked shift;
- haptics;
- the Android back button;
- a native status bar and splash screen;
- a bundled map library;
- camera and location for reports;
- push notifications, once the Firebase and Apple Push keys are added.

GitHub builds an Android test APK (and a signed Play bundle once the signing secrets are set) and checks that the iOS
project compiles, on every push. `mobile/README.md` covers building, signing and private distribution through
TestFlight, Apple Business Manager and managed Google Play.

## New look: night ops (25 Oct)

The console and the mobile app have a mission-control look.
- **Colour:** deep navy glass panels and one signal teal for whatever is active or selected. Amber and red are kept
  for status.
- **Type:** readouts, headings and the clock use B612, the typeface Airbus designed for cockpit displays. Everything
  else is in IBM Plex Sans.
- **Status lights:** every summary readout has a small light in its status colour, and critical lights breathe
  slowly so they catch the eye. Nothing else moves on its own, and moving effects are off when the device asks for
  reduced motion.
- **Header:** one compact row with the radar mark, the controls and the clock, with the sections in a tab strip below.
  The workflow strip (Detect → Report) reads on one line.
- **Labels and tables:** labels are in sentence case. Tables have aligned headers and more room.
- **Windows and messages:** dialogs, toasts and the phone's top and bottom bars are frosted glass.
- **Light mode (day ops):** the same layout on white and soft blue-grey.

The look is one stylesheet layered over the existing screens, so nothing about how pages work has changed.

## Professional layout (25 Oct)

- **Left menu:** every section is listed with an icon, grouped by kind of work: Operations, Intelligence,
  Stakeholders and reports, System. The current section is marked with a teal bar. **Collapse** at the bottom shrinks
  the menu to icons only (hover for the name), and the choice is remembered.
- **Top bar:** one slim bar holds:
  - the Detect → Triage → Escalate → Respond → Report pipeline, as status lights (teal clear, amber busy, red
    overdue; hover for the counts);
  - the Go to… search field;
  - the alarm state;
  - icon buttons for guide, sound, test alarm, sites (with the count), settings, integrations and dark/light;
  - your avatar and the clock.
- **Phone:** unchanged; it keeps its own bottom tabs.

## PSOC logo, full-width layout and the OSINT tool radar (26 Oct)

**PSOC logo.** The PSOC logo (the P with the Asia-Pacific globe) replaces the radar mark everywhere:
- in the top bar, the sign-in screen and the browser tab, in a light version for dark mode and the original navy for
  light mode;
- on the installable web app's icons;
- on the store app's icon, splash screen and notification icon.

**Full width again.** The left menu is gone. The sections are back as a tab strip under the top bar, and the top bar
keeps the logo, the Detect → Report status lights, search, icon controls, alarm state, avatar and clock.

**OSINT tool radar** (Threat Intelligence):
- **Discover:** the newest and most active open-source OSINT tools, live from GitHub and refreshed hourly. The views
  are **New this month**, **Active this week**, **Most starred** and **Search**. Each tool shows its stars, last
  update, language, licence and health: maintained, slowing, stale, archived or not found.
- **Our toolchain:** what the team actually uses. Mark each tool as in use, evaluating, watching or retired, with
  what it is used for, an owner and notes. Health is re-checked daily, so stale or abandoned tools are flagged under
  **Need attention**. **Add the starter toolchain** adds tools suited to a security operations centre:
  - TrendRadar;
  - changedetection.io;
  - ArchiveBox;
  - yt-dlp;
  - ExifTool;
  - SpiderFoot;
  - theHarvester;
  - Photon.

  **Copy toolchain** gives a text summary.
- **TrendRadar** (multi-platform trend and public-opinion monitor) is featured. Save the address of your published
  TrendRadar report to open it from here, and copy the PSOC server address to use as TrendRadar's webhook; the trend
  alerts it sends then appear on this page.

GitHub's public API allows about 10 searches a minute without signing in, so results are cached for an hour.

## Name: To The Edge (TTE) (26 Oct)

The console is now called **To The Edge (TTE)**. The new name appears in:
- the top bar, the sign-in screen and the browser tab;
- the phone screens, notifications and reports;
- the installable app's name, and the store app's name on iOS and Android.

Section names that describe the work, such as Intelligence Monitoring and Threat Intelligence, stay as they are.
Technical identifiers are unchanged, so integrations keep working:
- the Lenel application id;
- the player relay check;
- the repository and app ids.

## Command-centre layout for the APAC director, RSOM and DSOM (26 Oct)

The three leadership dashboards now work like the Visual Command Centre: one screen, with the map in the middle and the
working lists either side. Each column scrolls on its own.

| Page | Left | Centre | Right |
|---|---|---|---|
| APAC director | What matters now, operational decisions | Significant events across APAC | Regions, the last 7 days |
| Regional (RSOM) | Operational decisions, most important risks, SERV reports, open incidents | The region's sites with impact zones, incidents and escalations | Business impact |
| Country (DSOM) | Operational decisions, do now | The country's sites with impact zones, incidents and escalations | Risks and SERV releases |

On all three, the status banner and readouts sit across the top, and the detail tables follow below the command screen.
On screens narrower than 1200 px and on phones, the pages keep their stacked layout.

## Dashboards each stakeholder shapes (26 Oct)

**What matters to us.** The APAC director, each region (RSOM) and each country (DSOM) dashboard opens with a panel the
entity fills in:
- **Priorities:** one per line, with an optional lead. Tick them when they're done.
- **Risks we watch:** each shows its live score and priority for that scope, and flags a live signal.
- **Sites we watch:** each shows impact level, open incidents, people on post and its top site risk, with a status
  light.
- **Topics we watch:** words or phrases matched against the last 24 hours of news and official warnings, with the
  latest headlines.

**Customise** (on the page's toolbar, or on the panel) lets the entity:
- choose which panels show;
- set their order, and move them between the left and right columns;
- choose which readouts appear across the top.

**Saving.** The set-up is saved per entity (APAC, each region, each country), so North Asia's RSOM and Japan's DSOM
each keep their own. It's shared with everyone who opens that dashboard, and records who set it. **Reset to default**
returns to the standard layout.

**Look.** Every panel on these pages now has the same header style.

## Dashboards show the Intelligence map (26 Oct)

The APAC director, RSOM and DSOM command screens now show the console's own Intelligence Monitoring map in the centre.
It's the same map, so it has:
- the same base map you chose;
- city rings with counts, and the hazard and alert symbols;
- cyclone tracks and cones, official warnings, and site labels.

The map zooms to the region (RSOM) or the country (DSOM) and keeps your own panning and zoom while you stay on the page.
Leaving the page puts the map back in Intelligence Monitoring where you left it. On phones and narrow windows, the
dashboards keep their simpler map.

## Maps are never blank (26 Oct)

- **Land and sea underneath every map.** Every map in the console (Intelligence Monitoring, the Visual Command Centre
  and the dashboards) now draws its own coastlines and borders from the outlines the console already carries. The
  chosen base map is shown on top as soon as it loads; where tile servers are blocked or slow, you still see the
  land, the sea and every site, hazard and warning instead of an empty grey box. It follows the light and dark themes.
- **APAC director map opens on APAC.** The director's map now fits all the APAC cities from Japan and India to New
  Zealand, instead of zooming out to the whole world. Each region and country still opens on its own sites.

## Dashboard layouts for each person (26 Oct)

On the APAC director, Regional (RSOM) and Country (DSOM) dashboards:

- **Resize by dragging.** Drag the edges between the map and the side columns, or the bottom edge, to make the map
  wider, narrower or taller. Arrow keys work on a focused edge too. The **S / M / L** buttons on the map's header give
  quick sizes, and **⤢** maximises the map (Esc returns).
- **Choose the layout:** map in the middle with lists either side, map left, map right, map on top with the lists
  below, or lists only.
- **Choose the base map** for the dashboard from the map's header: any of the Intelligence map's base maps, or
  **Outline only** (the console's own land and sea, works on any network). Intelligence Monitoring keeps its own choice.
- **For each person.** Whatever you change is saved as **your layout**; the button on the map's header says whose
  layout you're seeing (Standard, Team, Yours, or "Set for you by …"). Click it, or **⚙ Customise**, and choose who
  the layout is for:
  - **Everyone on <entity>:** the team layout, plus "What matters", which stays the team's;
  - **Just me:** your own panels, readouts, layout, sizes and base map;
  - **Someone else** (duty managers, administrators and leadership): set a layout for any user, for one dashboard or
    for all their dashboards.

  A person's own layout for a dashboard wins, then their layout for all dashboards, then the team layout, then the
  standard one. **Back to the team layout** removes a person's own layout. Layouts are shared through the PSOC server
  like the other team records.

## "What matters" on every tab (27 Oct)

Every tab in the console now has a **What matters** bar at the top: BAU, Security Operations, the Visual Command Centre,
Intelligence Monitoring, Threat Intelligence, Response, Sentiment, Travel, Repositories, the Stakeholder pages, RFI,
the Chatbot and Administration. The APAC director, RSOM and DSOM dashboards keep their larger "What matters" panel.

- **Choose what matters** sets, for that tab, the team's priorities (with owners), the risks, sites and news/warning
  topics it watches. It is shared with everyone who opens the tab and records who set it.
- When open, the bar shows the detail live: each risk's current score, each site's impact, incidents and guards on post,
  and topic hits in the last 24 hours. Priorities can be ticked off.
- Fold it with the arrow to a single line that shows the counts, the next open priority and anything that needs
  attention. Each person's open or folded choice is remembered per tab.
- Until something is chosen, the bar is a slim dashed line with a **Choose what matters** button.

## TTE on your phone: the installable app (27 Oct)

Open **https://wileenzh.github.io/ite-console/app/** on the phone and add it to the home screen:
- **iPhone / iPad:** in Safari, tap **Share** › **Add to Home Screen** › **Add**.
- **Android:** in Chrome, tap **⋮** › **Install app** (or **Add to Home screen**). Where Chrome offers it, the app's own
  **Install** button does it in one tap.

On the desktop, the new **phone button** in the header shows a QR code to scan and the same steps. On a phone,
**More › Install this app on your phone** shows them too.

What the installed app does:
- opens full screen from the home screen with the PSOC icon, on each person's role screens (guard, site security
  manager, DSOM, RSOM, APAC director, PSOC officer);
- opens without signal on the last version loaded (live data loads when back online) and picks up the newest version
  each time it opens with signal;
- on Android, pressing and holding the icon gives shortcuts to **My duties**, **Site alerts**, **Decisions** and
  **Map** (`app/?go=<tab>` opens that tab after sign-in).

Fixed on the way:
- the security gateway's page guard was removing the app's own start-up script, so the offline copy and the install
  hint never started; the script is now marked as the console's own;
- on real phones the sign-in screen opened zoomed in and cut off, because the desktop header made the page wider than
  the screen before the phone layout started; touch screens can no longer be widened.

## Fast decisions (Microsoft-Decision-1), NOTAMs, notices to mariners and AIS (27 Oct)

### Fast decisions — Response › Fast decisions
[Microsoft-Decision-1](https://openrouter.ai/microsoft) is Microsoft's decision model (October 2026). It answers fixed
questions with a probability for each option instead of writing text, in a fraction of a second, for about US$0.04 per
million input tokens. In TTE it:
- puts a **recommendation on every pending item in the Action queue**: the next step (the queue's own choices), the
  priority (P1–P4) and whether to alert the duty manager. **Use** opens the decide window with the recommendation marked;
  the watch officer still chooses and records the reason;
- judges whether each **NOTAM and navigational warning affects us**, and whether a **ship lingering near a site** needs
  a check.

Set it up under Response › Fast decisions. TTE can reach it three ways:
- **OpenRouter:** the Decisions API (`POST https://openrouter.ai/api/alpha/decisions`, model
  `microsoft/microsoft-decision-1`). The key stays in this browser.
- **PSOC server:** `POST /api/decisions` with the same body. The server forwards it to Microsoft Foundry or OpenRouter
  with the organisation's key.
- **Your own gateway:** any address that accepts the same body, with an optional header.

Site codes and names are replaced with neutral labels ("Site A") before anything is sent. A test bench shows the
probabilities for any situation you type, and the page keeps a log of recent recommendations with timing and cost.

### Air & sea notices — Intelligence Monitoring › Air & sea notices
- **NOTAMs** for the main airport of every city with our sites (31 airports; more can be added by ICAO code). They come
  from the FAA NOTAM API (worldwide, free client ID and secret) or the PSOC server (`GET /api/notams?icao=WSSS,VHHH,…`,
  returning the FAA GeoJSON or a list). Each is sorted by kind: airport closures, airspace restrictions and exercises,
  volcanic ash, GPS interference, drones, runways, navigation aids and obstacles.
- **Navigational warnings and notices to mariners:** NGA Maritime Safety Information broadcast warnings (HYDROPAC by
  default), plus your port authority's notices as an RSS or Atom feed. Positions in the text (for example
  `01-10.00N 103-55.00E`) are read to give the distance to the nearest city with our sites.
- **Send to Action queue** puts any notice in the queue, where Decision-1 recommends what to do.

### Sea traffic (AIS) — Visual Command Centre › Sea traffic (AIS)
- Ship positions around every coastal city with our sites, on a map and in a list, from aisstream.io (free key; it may
  refuse connections from a browser) or the PSOC server (`GET /api/ais?boxes=…`, returning `[{mmsi, name, lat, lon,
  sog, cog, heading, status, t}]`).
- A ship is flagged as **lingering** when it stays within 3 km of a site, slower than 1 knot, for 20 minutes or more.
  Both values can be changed. It can be sent to the Action queue as a site check.

**Demo mode** (Sources › "Show demo notices and ships") fills both pages with clearly marked made-up examples until the
real feeds are connected. Keys for the FAA, aisstream.io and OpenRouter stay in the browser. Feeds a browser can't reach
directly go through the PSOC server relay.

## My feeds: Inoreader and any RSS (27 Oct)

Intelligence Monitoring › **My feeds** shows the team's own reading in full, newest first:
- Inoreader folders, tags or **Starred** items (as output feeds), or any RSS, Atom or JSON feed.
- Each story is tagged with the security topic and the cities it mentions.
- Filters: **Everything**, **Our cities** and **Security topics**, plus a search box and a choice of feed.
- **Send to Action queue** works on any story, and **⚡ Does it affect us?** asks Decision-1 when it's set up.

**To add an Inoreader feed:** in Inoreader, hover over a folder, tag or **Starred** › **⋯** › **Export as RSS**. Paste
the link into **Add a feed** on the page, or under Integrations › More news. The address of the Inoreader dashboard
itself is refused, because it is a web page that needs signing in, not a feed.

Stories about a hazard in one of our cities also go into the main news feed and onto the map. Feed links are kept in the
browser. Anyone who has an Inoreader output link can read that folder, so only export folders that are fine to share.
Feeds the browser can't fetch directly are retried through the PSOC server relay.

**Importing a whole subscription list (OPML).** My feeds › **Import OPML** reads an OPML export, either chosen as a
file or pasted. In Inoreader it is under Preferences › Import/Export › Export OPML.
- The import lists every feed, grouped by folder, with duplicates removed and feeds already added greyed out.
- **Only security, data centres and Asia news** picks the relevant ones; you can also select all or none.
- Up to 150 feeds are read, six at a time, each keeping its own name. The side panel shows how many work and how many
  fail, and **Remove failing** clears the dead ones.
- The main news feed reuses what My feeds has fetched, rather than downloading the feeds a second time.
- Many news sites don't let a browser read their feeds directly; those come through the PSOC server relay. With a paid
  Inoreader plan, a lighter alternative is to group the subscriptions into a few Inoreader folders and add each
  folder's **Export as RSS** link. Inoreader then does the fetching, and the console reads 3–5 links.

## Virtual guard: running sites remotely (27 Oct)

Security Operations › Patrol & response › **Virtual guard** brings remote-guarding functions into the console:
- **Now:** one list of what needs attention: virtual patrols that are due or overdue, unusual activity, overstays,
  watch-list matches, mobile units on low power or out of signal, and keys not returned.
- **Virtual patrols:** a scheduled round of a site's cameras, for example every hour from 22:00 to 06:00.
  - The operator steps through each camera and records **All clear**, **Issue** (with a note) or **Camera not
    available**. The camera's last analytics frame is shown when there is one.
  - Issues and unavailable cameras go to the Action queue, and every patrol is recorded with who did it and how long it
    took.
- **Unusual activity (self-learning):** no rules to write.
  - The console keeps 60 days of camera alarms, access-control alarms, incidents and intercom calls, and learns how
    often each kind happens at each site at each hour of the week.
  - It flags activity that is far above normal for that hour (more than three standard deviations), at a time of day
    it has never happened at that site, or new to the site. Similar events are grouped into one.
  - Each kind of event can be set to High, Normal or Ignore. Unusual activity can go to the Action queue, where
    Decision-1 recommends what to do.
- **Visitors and contractors:** register them ahead of time, then check them in, **release the door remotely**
  (logged) and check them out. Overstays are flagged, and a watch list of names, companies and plates flags matches.
  Records are kept for 90 days.
- **Intercom and talk-down:** log intercom calls and their outcomes. Calls that end in dispatching an officer or calling
  the police go to the Action queue. Standard talk-down announcements, which can be edited, are spoken through the
  computer's speakers for routing to the site's speaker, and logged.
- **Mobile units and robots:** mobile camera towers, patrol and concierge robots and drone docks. The register records
  site, location, power, link, the analytics running on each unit and the end of its deployment. Warnings cover low
  power, lost signal and deployments about to end. Live status can be read from the PSOC server (`GET /api/fleet`).
- **Keys:** issue, due back, returned, and overdue keys.
- **Monthly report:** per site, covering patrols and issues, unusual activity, visitors and overstays, calls and
  talk-downs, keys and units. It can be downloaded as CSV.

Also moved: **My feeds** now sits under Intelligence › News, and **Air & sea notices** under Intelligence › Security.

## Web version and mobile version (27 Oct)

The console now comes as two separate HTML files, both built from the same code:

| File | What it is | Use it on |
|---|---|---|
| `web.html` (wileenzh.github.io/ite-console/web.html) | The full desktop console: every screen, set-up, analysis, the dashboards and the command screens. It never switches to the phone layout; on a tablet or phone it opens as the desktop page. | Computers, PSOC workstations, video walls |
| `mobile.html` (and the installable app at `/app/`, and the store app) | The phone layout only. Each role gets its own tabs, and **More** lists only the screens meant for a phone. On a computer it is shown as a phone in the middle of the screen. Screens that are web-only open the role's first tab instead. | Phones (guards, site security managers, DSOM, RSOM, the director, PSOC officers on the move) |

`index.html` stays adaptive (desktop on a computer, phone layout on a phone), so existing links keep working.
`tools/build_editions.py` makes both files from `index.html`. The installable app (`tools/build_app.py mobile.html`)
and the store app (`mobile/scripts/build-web.mjs`) are built from the mobile version.

**Screens in the mobile version:**
- **Role tabs:** Shift, Patrol, Desk, Report and Alerts (guard); Site, Roster, Desk, Risk and Cameras (site security
  manager); Country, Decisions, Workforce and Sites (DSOM); Region, Decisions, Risk and Workforce (RSOM); APAC,
  Decisions, Risk & value and Campuses (director); Home, Map, Queue and Incidents (PSOC officer).
- **Also under More:** the live map and cities, the Action queue, incidents, alerts, the to-do list, the live alert
  stream, news and My feeds, typhoons, earthquakes, weather, the 48-hour forecast, air quality, official warnings,
  protests, intelligence events, travel, escalation timers, welfare checks, comms, the chatbot, RFI query, live
  operations and the video and camera walls.

**New on the phone: the Site desk** (Desk tab for guards and site security managers):
- the day's visitors for your site, with **Arrived**, **Release door** and **Check out**;
- watch-list and overstay warnings;
- logging an intercom call and speaking the talk-down announcements;
- keys out at your site, with **Returned**.

The guard's **Alerts** tab now also shows the site's Virtual guard warnings: overstays, watch-list matches, overdue
keys, unusual activity and ships lingering near the site.

**Feed links.** `web.html#addfeeds=<list>` opens My feeds with the import window filled in, for adding a whole feed list
in one click. The list is compressed after the `#`, so it is never sent to the server or stored on the site.

**When a site blocks the browser.** Many news sites, and sometimes Inoreader, don't allow a web page to read their feeds
directly. My feeds › **How feeds are fetched** offers three choices:
- **Directly** (then the PSOC server, when it is set up);
- **Through a public relay:** corsproxy.io, falling back to allorigins.win and codetabs.com. These services see the
  feed addresses only;
- **Through my own relay:** any address with `{url}` in it, for example a small Cloudflare Worker.

Each feed remembers which way worked. A personal copy of the app can carry its owner's feed list
(`window.TTE_PRESET`), applied once on first open. Such copies are made for one person and are not kept in this
repository.

## My feeds, analysed and on the map (27 Oct)

My feeds is still its own tab (Intelligence › News › My feeds), but the console now analyses everything in it and puts
the results on the map:
- **Placed:** each story is tied to one of our cities, an APAC country, or a country or region elsewhere (about 50,
  such as the Middle East, Ukraine and Russia, the South China Sea and the Red Sea).
- **Labelled by topic:** the hazard categories, plus cyber, data centres and cloud, geopolitics and conflict, economy
  and markets, and AI and technology.
- **Grouped into developing stories:** reports of the same thing from different sources, within 48 hours, become one
  story. It shows how many reports and sources it has, and when it was first and last seen.
- **Scored 0–10** for how much it matters to us: number of sources, a security topic, our sites in that city, and
  how recent it is.
- **On the main map:** a new **My feeds** layer (quick-bar chip and layer panel) puts one marker per place. Hovering
  lists the developing stories; clicking opens them in My feeds. The tab now keeps the map beside the list.
- **"What your feeds are saying"** at the top of the tab: stories by topic and by region (our cities, the rest of APAC,
  the rest of the world), the top developing stories with links to each source, **Map**, **Send to Action queue**
  and Decision-1's "affects us" score (automatic for stories scoring 5 or more).
- **Write a brief:** a short written brief of the top 15 stories, produced by the PSOC server's language model.

Stories about a hazard in one of our cities also feed the news count on the city cards, the news layer and the
dashboards, as before.

**In the Visual Command Centre** (Command view):
- the command map shows the developing stories from the team's feeds (score 3 and up) as markers with a story count,
  pulsing when a story scores 7 or more. Hovering lists them; clicking opens them in My feeds;
- a **Feed stories that matter** readout (score 5 and up) sits with the other readouts;
- the right-hand column lists the top five **developing stories** under Live news. Clicking one moves the map there.

### Damage assessment (HASTE)

*Intelligence Monitoring › Overview › Damage assessment.* Web, and on the phone in the mobile version under More.

HASTE (High-speed Assessment and Satellite Tracking for Emergencies, open source from Microsoft) compares satellite images from
before and after a typhoon, flood, earthquake, fire or blast, and marks each building damaged or intact. The console:

- **Reads the results.** It can take them from the team's own HASTE deployment: set the API address, the key, and how the key is
  sent (Function key header, API Management header, `?code=` or none). It reads the projects, the latest finished model for each
  image layer, the assessment report (the damaged-building estimate with its 95% range) and the predicted-damage GeoPackage.
  Alternatively, import a file exported from HASTE: the GeoPackage (read in the browser, including UTM projections), the
  validation GeoJSON, or a published STAC item.
- **Works out what it means for us.** For each site it counts the damaged buildings within 1 km (adjustable) and within 3 km, and
  finds the nearest damaged building. It then grades the site Severe, High, Moderate or Watch. The worst-hit blocks become impact
  zones, so they also appear in Operational impact, "What matters" (sites we watch) and the dashboards.
- **Shows it everywhere it matters.**
  - On the page: a map with each building as a dot (red damaged, grey intact, purple cloud) and rings around the sites, plus an
    optional satellite base and the post-event imagery through HASTE's tile server.
  - A "Satellite damage (HASTE)" layer and quick-bar chip on the main map, with building dots once zoomed in.
  - A readout and the assessed areas in the Visual Command Centre.
  - Decision-1 ("does it affect us?") for each affected site.
  - High and Severe sites go to the Action queue automatically (P1 for Severe; this can be turned off).
  - A "Satellite damage" item in the guard's phone Alerts tab.
- **Keeps keys and data local.** The key and the building data stay in the browser. Only the counts for each site are shared with
  the team. A clearly marked demo shows the page before HASTE is connected.
