// PSOC Copilot: Claude with the live picture (open escalations, the Inbox, hazards touching sites, this shift's
// decisions). It uses the officer's own Anthropic key, sent only to api.anthropic.com from this browser.
import { $, esc, sgt, dur, copyText } from "../core.js";
import { CFG } from "../config.js";
import { STATE, openEvents, openItems, timers, cad, REN, SOP_REF, decided, dueAt, who, audit } from "../model.js";
import { ttpFor, ttpName } from "../ttp.js";
import { dialog } from "./kit.js";
import { go } from "./state.js";

const MODEL = "claude-sonnet-5-5";
let chat = [];
function picture(){ const now = Date.now(), L = [`Now: ${sgt(now)} SGT. Officer: ${who()}.`];
  const ev = openEvents(); L.push("", `OPEN ESCALATIONS (${ev.length})`);
  ev.forEach(e => { const t = timers(e), c = cad(e), w = Object.entries(e.welfare || {});
    L.push(`- [${e.sev}] ${e.title} | ${(SOP_REF[e.cat] || {}).label || e.cat} | ${e.country || "?"} | event notice ${REN[e.ren].toLowerCase()} | ${t.state === "awaiting" ? "timers wait for the notice" : t.state === "immediate" ? "update as it develops" : `Manager update every ${c.m} h due ${t.d12 < 0 ? "OVERDUE by " + dur(-t.d12) : "in " + dur(t.d12)}; Intel/SLT every ${c.i} h due ${t.d24 < 0 ? "OVERDUE by " + dur(-t.d24) : "in " + dur(t.d24)}`} | sites: ${e.sites.slice(0, 15).join(", ") || "none"} | welfare: ${w.map(([k, v]) => k + " " + v.status).join(", ") || "none checked"}`);
    e.log.slice(-4).forEach(l => L.push(`    log ${sgt(l.t)}: ${l.m}`)); });
  const items = openItems(); L.push("", `WAITING FOR A DECISION (${items.length})`); items.slice(0, 25).forEach(i => L.push(`- ${i.pri} ${i.title}${dueAt(i) < now ? " (LATE)" : ""}`));
  const hz = STATE.list.filter(s => s.tier >= 1 && (s.sites.length || s.cities.length) && s.kind !== "conditions").slice(0, 40);
  L.push("", `HAZARDS TOUCHING OUR SITES (${hz.length})`); hz.forEach(s => L.push(`- level ${s.tier} ${s.kind}: ${s.title} | ${s.area || s.cities.join(", ")} | ${s.sites.length} sites | reported ${sgt(s.t)}${s.text ? " | " + s.text.slice(0, 220) : ""}`));
  const d = decided(now - 12 * 3600e3); L.push("", `DECIDED THIS SHIFT (${d.length})`); d.slice(0, 25).forEach(i => L.push(`- ${i.decision}: ${i.title}${i.reason ? " (" + i.reason + ")" : ""} by ${i.by}`));
  const cats = [...new Set(ev.map(e => e.cat))].filter(ttpFor); if (cats.length){ L.push("", `${ttpName()} FOR THE OPEN CATEGORIES`);
    cats.forEach(k => { const t = ttpFor(k); L.push(`${t.label}: manager trigger: ${t.mgr.trig.join("; ")} | intel trigger: ${t.intel.trig.join("; ")} | REN when: ${t.ren.crit.join("; ")} | close when: ${t.close.join("; ")}`.replace(/\*\*/g, "")); }); }
  return L.join("\n"); }
const SYSTEM = "You are the PSOC Copilot inside ITE, a physical security operations console for Asia-Pacific. Answer from the live picture given; never invent events, sites, times, figures or contacts. If something is not in the picture, say so. Be brief and operational: lead with what needs doing, use SGT times, and name sites by code. Draft messages in plain text ready to paste.";

async function ask(text, box){ const key = CFG.keys.claude; chat.push({ role: "user", content: text }); draw(box, true);
  try{ const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: SYSTEM + "\n\nLIVE PICTURE\n" + picture(), messages: chat.slice(-12) }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(r.status === 401 ? "the API key was rejected" : (j.error && j.error.message) || "HTTP " + r.status);
    chat.push({ role: "assistant", content: (j.content || []).map(b => b.text || "").join("").trim() }); audit("Asked Copilot", text.slice(0, 120)); }
  catch(e){ chat.push({ role: "assistant", content: "Could not reach Claude: " + e.message + ".", err: true }); }
  draw(box, false); }
function draw(box, busy){ box.innerHTML = chat.map((m, i) => `<div class="msg ${m.role}${m.err ? " err" : ""}">${esc(m.content).replace(/\n/g, "<br>")}${m.role === "assistant" && !m.err ? `<button class="linkbtn" data-cpcopy="${i}">Copy</button>` : ""}</div>`).join("") + (busy ? `<div class="msg assistant help">Thinking…</div>` : "");
  box.scrollTop = box.scrollHeight; }

export function openCopilot(){ if (!CFG.keys.claude){ dialog("PSOC Copilot", `<p class="prose">Copilot answers questions about the live picture, summarises what is active and drafts reports. It uses your own Anthropic API key, kept in this browser and sent only to api.anthropic.com.</p>`,
    `<button class="btn" data-close>Close</button><button class="btn primary" id="cpKey">Add the key in Settings</button>`); $("#cpKey").onclick = () => { go("settings", { setSel: "keys" }); document.querySelector("[data-close]").click(); }; return; }
  dialog("PSOC Copilot", `<div class="cpquick">${[["Summarise what is active", "Summarise what is active now for a shift lead: open escalations and their next deadlines, what is waiting for a decision, and anything touching our sites that has no escalation yet."],
      ["What should I do next?", "Given the live picture, list the next three things I should do, most urgent first, each with why and by when."],
      ["Draft the SITREP", "Draft today's APAC SITREP from the live picture: executive summary, then each open event (country, category, severity, time identified, description, closest sites, event notice status), then items under observation."]].map(([l, q]) => `<button class="btn small" data-cpq="${esc(q)}">${esc(l)}</button>`).join("")}</div>
    <div class="cplog" id="cpLog"></div><form class="note" id="cpForm"><input id="cpIn" placeholder="Ask about the live picture" aria-label="Ask Copilot" autocomplete="off"><button class="btn small primary">Ask</button></form>
    <p class="help">Answers use the open escalations, the Inbox, hazards touching our sites and this shift's decisions${ttpName() ? " and the " + esc(ttpName()) : ""}. Check before sending anything.</p>`, `<button class="btn" id="cpClear">Clear</button><button class="btn" data-close>Close</button>`, { wide: true });
  const box = $("#cpLog"); draw(box, false);
  $("#cpForm").onsubmit = e => { e.preventDefault(); const v = $("#cpIn").value.trim(); if (!v) return; $("#cpIn").value = ""; ask(v, box); };
  $("#dialog").onclick = async e => { const q = e.target.closest("[data-cpq]"), c = e.target.closest("[data-cpcopy]"); if (q) ask(q.dataset.cpq, box); if (c){ const ok = await copyText(chat[+c.dataset.cpcopy].content); c.textContent = ok ? "Copied" : "Copy failed"; } };
  $("#cpClear").onclick = () => { chat = []; draw(box, false); }; }
