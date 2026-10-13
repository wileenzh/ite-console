// House style. Everything the PSOC sends — SITREPs, handovers, leadership and welfare updates, channel posts,
// stakeholder emails, close-outs and log notes — is held to one written style:
//   1. a style guide, words to avoid, preferred terms, required headings and endings per report type (checked offline,
//      instantly, with no model involved);
//   2. example reports per type that the language model copies for structure and tone when it rewrites a draft;
//   3. a fact guard: after a rewrite, any figure, time or site code that was not in the draft is flagged for review.
// The defaults come from the PULSE templates; examples of your own past reports make the model follow them closely.
import { load, save, nid, emit } from "./core.js";
import { llm, llmReady } from "./llm.js";

export const TYPES = { sitrep: "SITREP", handover: "Shift handover", leadership: "Leadership update", welfare: "Welfare update", intel: "Intelligence Channel post", stakeholders: "Site stakeholders email", closeout: "Close-out report", note: "Log note or summary" };

const GUIDE = `Write as PSOC, in the third person: "PSOC has identified", "PSOC is monitoring". Never "I" or "we".
Lead with what happened, where and when; then the impact to personnel, sites and operations; then what PSOC is doing.
State facts only. Mark anything not yet confirmed "(unconfirmed)", or "(confirm)" where a value is still needed. No speculation and no alarming adjectives.
Times on the 24-hour clock with the zone: "1415 SGT", or "0614 hours (UTC)" in leadership updates. Dates as "14 Oct 2026".
Sites by code (TOK39); distances in km; earthquakes as "M6.1"; shaking as "MMI IV"; wind in km/h.
Name official sources in full on first use: "the U.S. Geological Survey (USGS)", "the Japan Meteorological Agency (JMA)".
Short paragraphs. Sentences under 30 words. Plain words.
Leadership and welfare updates end with "Monitoring is ongoing."
Use "datacenter" as one word.`;
const SITREP_EX = `PSOC APAC | Daily Situation Report
14 Oct 2026

Executive summary
This report from the Physical Security Operations Center (PSOC) includes an overview of the current events in APAC and is provided for situational awareness.
Assigned PSOC officer: (name)

Regional events
EVENT 1 | STATUS: Active
Country: Japan
Impacted area: Tokyo Region (mainland)
Event category: Adverse Weather (Typhoon/Tropical Storm)
Effective dates: From: 14 Oct 2026 To: 15 Oct 2026
Time identified: 14 Oct 2026, 0655 SGT
Description: Very strong Typhoon TESTSTORM (No. 2614) is forecast to bring storm-force winds to the Tokyo area from 0855 SGT. The Japan Meteorological Agency (JMA) has issued a Level 3 heavy rain warning for the Tokyo Region.

Closest datacenter(s)
Site code | Site class | Proximity (km) | Operational status
TOK51 | Class A | 5 | Operational
TOK39 | Class C | 5 | Operational

Closest corporate office(s): Demo Corp Office (Tokyo)
Data source strength: High — official JMA warning and forecast track.`;
const LEAD_EX = `Hachioji, Japan | Earthquake | M6.1

At 1414 hours (UTC), PSOC has identified a magnitude 6.1 earthquake approximately 40 km south of Hachioji, Japan, at a depth of 30 km.

No tsunami warning has been issued. The PAGER alert level was assessed as Yellow by the U.S. Geological Survey (USGS).

The closest site, located in Tokyo, is approximately 37 km north-east of the epicenter. At this time, no impacts to personnel, assets, or operations have been identified.

Monitoring is ongoing.`;
const WELF_EX = `Following updates from welfare checks on site:

At the time of reporting, no impacts to personnel, assets, or operations have been identified. Welfare checks with personnel at TOK39 and TOK51 confirmed normal operations and personnel safety.

Monitoring is ongoing.`;
const ex = (type, text) => ({ id: "builtin-" + type, text, title: "From the PULSE template", builtin: true });
const DEFAULTS = { guide: GUIDE, maxWords: 30,
  avoid: ["!", "ASAP", "FYI", "kindly", "please be informed", "I think", "maybe", "probably", "massive", "huge", "etc."],
  prefer: [["data center", "datacenter"], ["data centre", "datacenter"], ["datacentre", "datacenter"], ["Singapore time", "SGT"], ["e-mail", "email"], ["approx.", "approximately"]],
  types: { sitrep: { headings: ["Executive summary", "Regional events"], endsWith: "", examples: [ex("sitrep", SITREP_EX)] },
    handover: { headings: ["OPEN ESCALATIONS", "WAITING FOR A DECISION", "ACTIONS FOR THE INCOMING SHIFT"], endsWith: "", examples: [] },
    leadership: { headings: [], endsWith: "Monitoring is ongoing.", examples: [ex("leadership", LEAD_EX)] },
    welfare: { headings: [], endsWith: "Monitoring is ongoing.", examples: [ex("welfare", WELF_EX)] },
    intel: { headings: [], endsWith: "", examples: [] }, stakeholders: { headings: [], endsWith: "", examples: [] }, closeout: { headings: ["Summary"], endsWith: "", examples: [] }, note: { headings: [], endsWith: "", examples: [] } } };

const clone = o => JSON.parse(JSON.stringify(o));
function merged(){ const s = load("style", null), d = clone(DEFAULTS); if (!s) return d;
  const out = Object.assign(d, s, { types: d.types }); Object.keys(d.types).forEach(k => { if (s.types && s.types[k]) out.types[k] = Object.assign(d.types[k], s.types[k]); }); return out; }
export let STYLE = merged();
export function saveStyle(){ save("style", STYLE); emit("style"); }
export function resetStyle(){ save("style", null); STYLE = merged(); emit("style"); }
export function addExample(type, text, title, by){ STYLE.types[type].examples.unshift({ id: nid("ex"), text: String(text).trim(), title: title || "Example", by: by || "", at: Date.now() }); STYLE.types[type].examples = STYLE.types[type].examples.slice(0, 12); saveStyle(); }
export function removeExample(type, id){ STYLE.types[type].examples = STYLE.types[type].examples.filter(e => e.id !== id); saveStyle(); }
export const styleBrief = () => `\n\nHOUSE STYLE — follow it for anything you draft:\n${STYLE.guide}\nAvoid: ${STYLE.avoid.join(", ")}.`;

/* ---------- the offline check ---------- */
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordRe = w => /^[\w ]+$/.test(w) ? new RegExp(`\\b${reEsc(w)}\\b`, "gi") : new RegExp(reEsc(w), "gi");
export function lint(text, type){ const t = String(text || ""), cfg = STYLE.types[type] || {}, out = [], add = (level, msg, fix) => out.push({ level, msg, fix: !!fix });
  STYLE.avoid.forEach(w => { const m = t.match(wordRe(w)); if (m) add("error", `Avoid “${w}”${m.length > 1 ? ` (${m.length}×)` : ""}`); });
  STYLE.prefer.forEach(([a, b]) => { const m = t.match(wordRe(a)); if (m) add("error", `Write “${b}”, not “${a}”`, true); });
  const fp = t.match(/\b(I|I'm|I've|we|we're|we've)\b/g); if (fp && type !== "note") add("error", `First person (${[...new Set(fp)].join(", ")}): write as PSOC`);
  const ampm = t.match(/\b\d{1,2}(?::\d\d)?\s?(?:am|pm|a\.m\.|p\.m\.)(?=\W|$)/gi); if (ampm) add("error", `Use the 24-hour clock with a zone, not “${ampm[0]}”`);
  const long = t.replace(/\n+/g, " . ").split(/(?<=[.?!])\s+/).filter(sn => sn.split(/\s+/).filter(Boolean).length > STYLE.maxWords);
  if (long.length) add("warn", `${long.length} sentence${long.length === 1 ? "" : "s"} over ${STYLE.maxWords} words: “${long[0].split(/\s+/).slice(0, 8).join(" ")}…”`);
  (cfg.headings || []).forEach(h => { if (!new RegExp(`^\\s*${reEsc(h)}\\b`, "im").test(t)) add("error", `Missing heading “${h}”`); });
  if (cfg.endsWith && !t.trim().endsWith(cfg.endsWith)) add("error", `End with “${cfg.endsWith}”`, true);
  const ph = t.match(/\[[^\]\n]{2,40}\]/g); if (ph) add("error", `Template placeholder left in: ${ph[0]}`);
  if (/ {2,}| ,|\s+\./.test(t)) add("warn", "Stray spaces", true);
  const conf = (t.match(/\((?:confirm|unconfirmed)\)/gi) || []).length; if (conf) add("info", `${conf} item${conf === 1 ? "" : "s"} marked to confirm before sending`);
  return out; }
// the fixes that need no model: preferred terms, stray spaces, exclamation marks, the required ending
export function fixLocal(text, type){ let t = String(text || ""); const cfg = STYLE.types[type] || {};
  STYLE.prefer.forEach(([a, b]) => { t = t.replace(wordRe(a), b); });
  t = t.replace(/!+/g, ".").replace(/[ \t]{2,}/g, " ").replace(/ ,/g, ",").replace(/[ \t]+\./g, ".");
  if (cfg.endsWith && !t.trim().endsWith(cfg.endsWith)) t = t.trimEnd() + "\n\n" + cfg.endsWith;
  return t; }

/* ---------- the fact guard ---------- */
// site codes, and every number wherever it sits (M6.1, 1414, 40 km); leading zeros ignored
const facts = t => new Set([...(String(t).match(/\b[A-Z]{2,5}\d{1,3}\b/g) || []), ...(String(t).replace(/(\d):(\d\d)/g, "$1$2").match(/\d+(?:\.\d+)?/g) || [])].map(x => x.replace(/^0+(?=\d)/, "")));
export function newFacts(before, after){ const a = facts(before); return [...facts(after)].filter(x => !a.has(x) && !/^(19|20)\d\d$/.test(x) && !/^[0-3]?\d$/.test(x)); }

/* ---------- the rewrite ---------- */
function system(type){ const cfg = STYLE.types[type] || {}, exs = (cfg.examples || []).slice(0, 6);
  return `You rewrite text for a physical security operations center (PSOC) into the organisation's house style. Match the examples' structure, headings, order, tone, punctuation and formatting as closely as the content allows.
Hard rules: keep every fact, name, number, time, date, distance and site code exactly as given in the draft. Do not add facts. Do not drop facts. Where the house format needs a value the draft does not have, write (confirm). Output only the rewritten text, with no preamble or commentary.
<style_guide>
${STYLE.guide}
Sentences under ${STYLE.maxWords} words.
</style_guide>
<avoid>${STYLE.avoid.join(" | ")}</avoid>
<preferred_terms>${STYLE.prefer.map(([a, b]) => `${b} (not ${a})`).join("; ")}</preferred_terms>
${cfg.headings && cfg.headings.length ? `<required_headings>${cfg.headings.join(" | ")}</required_headings>\n` : ""}${cfg.endsWith ? `<must_end_with>${cfg.endsWith}</must_end_with>\n` : ""}${exs.length ? `<examples type="${TYPES[type]}">\n${exs.map(e => `<example>\n${e.text}\n</example>`).join("\n")}\n</examples>` : ""}`; }
// returns { text, issues, added }: the rewritten text, any rules still broken, and figures or codes that were not in the draft
export async function rewrite(text, type){ if (!llmReady()) throw new Error("connect a language model in Settings › Writing style");
  let out = await llm({ system: system(type), messages: [{ role: "user", content: `Rewrite this ${TYPES[type] || "text"} in the house style.\n<draft>\n${text}\n</draft>` }], max: 2500 });
  out = fixLocal(out.replace(/^<draft>\s*|\s*<\/draft>$/g, ""), type); let issues = lint(out, type).filter(i => i.level === "error");
  if (issues.length){ out = fixLocal(await llm({ system: system(type), messages: [{ role: "user", content: `Rewrite this ${TYPES[type] || "text"} in the house style.\n<draft>\n${text}\n</draft>` }, { role: "assistant", content: out },
      { role: "user", content: `That still breaks these house-style rules:\n${issues.map(i => "- " + i.msg).join("\n")}\nFix only those. Keep everything else, and keep every fact exactly. Output only the text.` }], max: 2500 }), type); issues = lint(out, type).filter(i => i.level === "error"); }
  return { text: out, issues, added: newFacts(text, out) }; }
