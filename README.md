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

## Finding your way

- **Go to… (Ctrl+K, ⌘K on a Mac)**: type any part of a screen, product, site code or action — "protest", "cyber
  brief", "XSG11", "new escalation", "status board" — and press Enter. Recent screens are listed first.
- **? Guide**: how the PSOC workflow runs in ITE — detect, triage, escalate, respond, report, and the video wall — with
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
built on ITE's own data with ITE's own names and look. A full map with a **Feeds** panel — Search; **Alerts**;
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
An agentic-SOC scorecard shows where ITE stands.

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
**Add to Home Screen**. ITE then opens from its own icon, full screen, with a phone layout (Home, Map, Queue,
Incidents, More). It is the same console with the same features; on a phone it keeps its own data and settings.
The app page is rebuilt from the console with `python3 tools/build_app.py`.

## Desktop app (Windows)

**Download:** [ITE-Setup-1.0.0.exe](https://github.com/wileenzh/ite-console/raw/main/download/ITE-Setup-1.0.0.exe)

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
