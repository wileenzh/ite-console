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

## Desktop app (Windows)

**Download:** [ITE-Setup-1.0.0.exe](https://github.com/wileenzh/ite-console/raw/main/download/ITE-Setup-1.0.0.exe)

The desktop app runs the console with its own built-in server on your computer only, so the video wall,
channel look-ups and blocked news sources all work without any hosting. The app isn't code-signed, so Windows
may show "Windows protected your PC": click **More info → Run anyway**.

## The rebuilt console (preview)

**Open it:** https://wileenzh.github.io/ite-console/next/

A clean rebuild organised around the officer's workflow, running alongside the current console until it replaces it:

- **Watch** — one map and one feed. Every source (earthquakes, official warnings from each national agency, typhoons, volcanoes, floods and fires, unrest, news, travel advisories, city conditions) lands here; hazard type is a filter, not a page.
- **Inbox** — only what needs a decision, the one due soonest first. Escalate, notify, monitor or dismiss, one key each.
- **Events** — each escalation in one place: the 12-hour and 24-hour update timers, the event notice, sites and welfare checks, the messages to send, the log and the close-out.
- **Reports** — the shift handover and the SITREP, written from the live picture, plus everything saved.
- **Sites** — the estate, each site's contacts, and what is affecting it now. The estate is fictional by design (PULSE-style codes such as TOK39, classes and contacts at made-up positions); every other feed is real.

Also from PULSE, done once instead of eight times: the REN TTP v2.2, built in and used inside every escalation (update cadence, close criteria and PSOC actions as a checklist), USGS ShakeMap contours, per-site typhoon timing, Copy brief on every report, a 7-day detection history, address search against the estate, a Summary view, typhoon forecast playback, the 7-day city outlook, live TV, the PSOC Copilot, a built-in guide (press ?) and export of everything to Excel. A house-style engine checks everything written for sending as you type and, with a language model connected (Anthropic or a company gateway), rewrites drafts in the style of the team's own example reports while keeping every fact. Protest events also come from ACLED with a myACLED account. findaprotest.info is not used: it has no API and its terms forbid automated collection and monitoring.

On first start it brings over the current console's settings, keys and open escalations from the same browser (not its sites); the current console is not changed.

Source code is in `src/` and is built into the single page `next/index.html`: `npm install`, then `npm run build` (or `npm run watch`).
