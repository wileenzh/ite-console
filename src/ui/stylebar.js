// The house-style bar under every text box whose words leave the console: it checks as you type (offline),
// fixes wording locally, and rewrites in the house style with the language model when one is connected.
// Any text box with data-style="<type>" gets one; the bar is the element with data-sbar="<box id>".
import { $, esc } from "../core.js";
import { lint, fixLocal, rewrite, TYPES } from "../style.js";
import { llmReady, llmName } from "../llm.js";
import { toast } from "./kit.js";

export const styleBar = (id, type) => `<div class="stylebar" data-sbar="${esc(id)}" data-stype="${esc(type)}"></div>`;
function paint(bar){ const box = document.getElementById(bar.dataset.sbar); if (!box) return; if (!box.value.trim() && !NOTE[bar.dataset.sbar]){ bar.innerHTML = ""; return; } const type = bar.dataset.stype, iss = lint(box.value, type), err = iss.filter(i => i.level !== "info"), fixable = iss.some(i => i.fix);
  bar.innerHTML = `<span class="sb-sum ${err.length ? "bad" : "ok"}">${err.length ? `${err.length} house-style point${err.length === 1 ? "" : "s"}` : "Meets the house style"}</span>
    ${fixable ? `<button class="linkbtn" type="button" data-sfix>Fix wording</button>` : ""}${llmReady() ? `<button class="linkbtn" type="button" data-sllm>Rewrite in house style</button>` : err.length ? `<span class="help">To rewrite automatically, connect a language model in Settings › Writing style.</span>` : ""}
    ${iss.length ? `<ul>${iss.map(i => `<li class="${i.level}">${esc(i.msg)}</li>`).join("")}</ul>` : ""}${NOTE[bar.dataset.sbar] ? `<p class="sb-note">${NOTE[bar.dataset.sbar]}</p>` : ""}`; }
export function paintBars(root){ (root || document).querySelectorAll("[data-sbar]").forEach(paint); }
const set = (box, v) => { box.value = v; box.dispatchEvent(new Event("input", { bubbles: true })); };
let t = null; const NOTE = {}, PREV = {};   // kept by text box, so a screen refresh does not lose them
document.addEventListener("input", e => { const id = e.target.id; if (!id) return; const bar = document.querySelector(`[data-sbar="${CSS.escape(id)}"]`); if (!bar) return; clearTimeout(t); t = setTimeout(() => paint(bar), 250); });
document.addEventListener("click", async e => { const b = e.target.closest("[data-sfix],[data-sllm]"); if (!b) return; const bar = b.closest("[data-sbar]"), box = bar && document.getElementById(bar.dataset.sbar); if (!box) return;
  if (b.dataset.sfix !== undefined){ set(box, fixLocal(box.value, bar.dataset.stype)); NOTE[bar.dataset.sbar] = ""; paint(bar); return; }
  const before = box.value; b.disabled = true; b.textContent = `Rewriting with ${llmName()}…`;
  try{ const r = await rewrite(before, bar.dataset.stype); set(box, r.text); PREV[bar.dataset.sbar] = before;
    NOTE[bar.dataset.sbar] = `${r.added.length ? `<b>Check before sending:</b> these were not in your draft — ${esc(r.added.slice(0, 8).join(", "))}. ` : "Every figure and site code came from your draft. "}${r.issues.length ? "Some points are still open (listed above). " : ""}<button class="linkbtn" type="button" data-sundo>Undo the rewrite</button>`;
    paint(bar); }
  catch(err){ toast("Could not rewrite", err.message, 2); b.disabled = false; b.textContent = "Rewrite in house style"; } });
document.addEventListener("click", e => { const u = e.target.closest("[data-sundo]"); if (!u) return; const bar = u.closest("[data-sbar]"), box = bar && document.getElementById(bar.dataset.sbar); if (!box || PREV[bar.dataset.sbar] == null) return; set(box, PREV[bar.dataset.sbar]); PREV[bar.dataset.sbar] = null; NOTE[bar.dataset.sbar] = ""; paint(bar); });
export { TYPES };
