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

## Channels (Vision Command Centre › Channels)

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

## Operator console (Vision Command Centre › Operator console)

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
