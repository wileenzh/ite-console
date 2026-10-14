// Interface building blocks: dialogs, toasts, small formatted pieces.
import { $, esc, sgt, ago, dur } from "../core.js";
import { TIER } from "../model.js";

let lastFocus = null, onClose = null;
export function dialog(title, body, foot = "", opts = {}){ lastFocus = document.activeElement; const d = $("#dialog"); d.onclick = null; d.className = "dialog" + (opts.wide ? " wide" : "");
  d.innerHTML = `<header><h2>${esc(title)}</h2><button class="x" data-close aria-label="Close">×</button></header><div class="body">${body}</div>${foot ? `<footer>${foot}</footer>` : ""}`;
  $("#scrim").hidden = false; onClose = opts.onClose || null; setTimeout(() => { const f = d.querySelector("[autofocus], input, textarea, select, button.primary"); if (f) f.focus(); }, 20); return d; }
export function closeDialog(){ $("#scrim").hidden = true; $("#dialog").innerHTML = ""; if (onClose){ const f = onClose; onClose = null; f(); } if (lastFocus && lastFocus.focus) lastFocus.focus(); }
document.addEventListener("click", e => { if (e.target.closest("[data-close]") || e.target.id === "scrim") closeDialog(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#scrim").hidden){ e.stopPropagation(); closeDialog(); } }, true);
export function confirmBox(title, msg, okLabel = "Confirm"){ return new Promise(res => { dialog(title, `<p class="prose">${msg}</p>`, `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cfOk">${esc(okLabel)}</button>`, { onClose: () => res(false) });
  $("#cfOk").onclick = () => { onClose = null; closeDialog(); res(true); }; }); }
export function toast(title, body = "", tier = null, go = null, ms = null){ ms = ms || (tier >= 2 ? 8000 : 3500); const box = $("#toasts"); while (box.children.length >= 3) box.firstElementChild.remove(); const t = document.createElement("div"); t.className = "toast"; if (tier != null) t.style.setProperty("--c", `var(--t${tier})`);
  t.innerHTML = `<b>${esc(title)}</b>${body ? esc(body) : ""}`; t.onclick = () => { t.remove(); if (go) go(); }; box.appendChild(t); setTimeout(() => t.remove(), ms); }
export const tierWord = t => `<span class="tierword t${t}">${esc(TIER[t].label)}</span>`;
export const priChip = p => `<span class="pri ${p}">${p}</span>`;
export const when = t => `<span title="${esc(sgt(t))} SGT">${esc(ago(t))}</span>`;
export function dueText(ms){ return ms < 0 ? `<span class="late">late ${esc(dur(-ms))}</span>` : ms < 5 * 60e3 ? `<span class="soon">due in ${esc(dur(ms))}</span>` : `due in ${esc(dur(ms))}`; }
export const field = (label, inner, wide) => `<label class="fld${wide ? " wide" : ""}">${esc(label)}${inner}</label>`;
