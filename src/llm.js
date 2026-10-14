// The one connection to a large language model. Copilot, the house-style rewrite and report drafting all use it.
// Either Anthropic's API with the officer's own key (sent only to api.anthropic.com from this browser), or a company
// gateway that accepts the same Messages API (for organisations that route models through their own endpoint).
import { CFG } from "./config.js";
import { redactor } from "./security.js";

export const MODELS = { "claude-sonnet-5-5": "Claude Sonnet 5.5 — fast, good for most drafting", "claude-opus-5-5": "Claude Opus 5.5 — slower, strongest at following a strict style" };
export const llmReady = () => CFG.llm.provider === "gateway" ? !!CFG.llm.url : !!CFG.keys.claude;
export const llmName = () => CFG.llm.provider === "gateway" ? "the company gateway" : (MODELS[CFG.llm.model] || CFG.llm.model).split(" — ")[0];

export async function llm({ system, messages, max = 1800 }){
  if (!llmReady()) throw new Error("connect a language model in Settings › Writing style first");
  const gw = CFG.llm.provider === "gateway", url = gw ? CFG.llm.url : "https://api.anthropic.com/v1/messages";
  const headers = { "content-type": "application/json", "anthropic-version": "2023-06-01" };
  if (gw){ if (CFG.llm.header && CFG.llm.headerValue) headers[CFG.llm.header] = CFG.llm.headerValue; }
  else Object.assign(headers, { "x-api-key": CFG.keys.claude, "anthropic-dangerous-direct-browser-access": "true" });
  // site codes and names leave as SITE-1, SITE-2 … and are put back in the answer (Settings › Writing style can turn this off)
  const R = redactor(), hideMsg = m => ({ role: m.role, content: typeof m.content === "string" ? R.hide(m.content) : m.content.map(b => b.type === "text" ? Object.assign({}, b, { text: R.hide(b.text) }) : b) });
  const body = { model: CFG.llm.model || "claude-sonnet-5-5", max_tokens: max, system: R.hide(system), messages: messages.map(hideMsg) };
  let r; try{ r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) }); }
  catch(e){ throw new Error(gw ? "the gateway could not be reached from this browser" : "api.anthropic.com could not be reached from this network"); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "the key was rejected" : (j.error && j.error.message) || "HTTP " + r.status);
  return R.show((j.content || []).map(b => b.text || "").join("").trim()); }
