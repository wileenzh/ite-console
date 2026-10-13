// Live TV in Watch: CNA, NHK WORLD, DW News and Al Jazeera English, played straight from each broadcaster's
// public stream. The player is kept between screen refreshes so a data update never interrupts it.
import { esc, loadScript, load, save } from "../core.js";

const HLS_JS = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js";
export const CHANNELS = {
  cna: { n: "CNA", u: ["https://d2e1asnsl7br7b.cloudfront.net/7782e205e72f43aeb4a48ec97f66ebbe/index.m3u8", "https://mediacorp-videosbclive.akamaized.net/dd724cfb0e8e4cdc921bbc4ac94614bf/ap-southeast-1/6057994443001/profile_1/chunklist.m3u8"], page: "https://www.youtube.com/watch?v=XWq5kBlakcQ" },
  nhk: { n: "NHK WORLD", u: ["https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8"], page: "https://www3.nhk.or.jp/nhkworld/en/live/" },
  dw: { n: "DW News", u: ["https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8"], page: "https://www.dw.com/en/live-tv/channel-english" },
  aje: { n: "Al Jazeera English", u: ["https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8", "https://live-hls-apps-aje-v3-fa.getaj.net/AJE/index.m3u8", "https://live-hls-web-aje-fa.thehlive.com/AJE/index.m3u8"], page: "https://www.aljazeera.com/live" } };
let box = null, video = null, hls = null, ch = load("tvChannel", "cna"), urlI = 0, state = "";

function ui(){ if (box) return box; box = document.createElement("div"); box.className = "tv";
  box.innerHTML = `<div class="filters tvch" role="group" aria-label="Channel">${Object.entries(CHANNELS).map(([k, c]) => `<button class="fchip" data-tvch="${k}">${esc(c.n)}</button>`).join("")}</div>
    <div class="tvframe"><video playsinline muted controls autoplay></video><div class="tvmsg" hidden></div></div><p class="help tvnote"></p>`;
  video = box.querySelector("video");
  box.addEventListener("click", e => { const b = e.target.closest("[data-tvch],[data-tvnext]"); if (!b) return; if (b.dataset.tvch){ ch = b.dataset.tvch; save("tvChannel", ch); urlI = 0; play(); } else { urlI++; play(); } });
  video.addEventListener("playing", () => msg(""));
  return box; }
function msg(t){ const m = box.querySelector(".tvmsg"); m.hidden = !t; m.innerHTML = t ? `<div>${t}</div>` : ""; }
function stopStream(){ if (hls){ try{ hls.destroy(); }catch(e){} hls = null; } video.removeAttribute("src"); try{ video.load(); }catch(e){} }
async function play(){ const c = CHANNELS[ch] || CHANNELS.cna; stopStream(); state = ch;
  box.querySelectorAll("[data-tvch]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tvch === ch));
  box.querySelector(".tvnote").innerHTML = `Starts muted; use the speaker control to listen. It pauses when you leave Live TV. If it won't play on this network, <a href="${esc(c.page)}" target="_blank" rel="noopener">watch ${esc(c.n)} on its own site</a>.`;
  if (urlI >= c.u.length){ msg(`<b>${esc(c.n)} did not play here.</b> Office networks often block live video. <a href="${esc(c.page)}" target="_blank" rel="noopener">Open it on the broadcaster's site</a> or <button class="linkbtn" data-tvnext>try again</button>.`); urlI = -1; return; }
  const url = c.u[Math.max(0, urlI)]; msg(`Connecting to ${esc(c.n)}…`);
  const fail = () => { if (state !== ch) return; urlI++; play(); };
  if (video.canPlayType("application/vnd.apple.mpegurl")){ video.src = url; video.onerror = fail; video.play().catch(() => {}); return; }
  try{ await loadScript(HLS_JS); }catch(e){ msg(`The video player could not load (cdnjs blocked). <a href="${esc(c.page)}" target="_blank" rel="noopener">Watch on the broadcaster's site</a>.`); return; }
  if (!window.Hls || !window.Hls.isSupported()){ msg("This browser can't play live streams."); return; }
  hls = new window.Hls({ lowLatencyMode: false, manifestLoadingTimeOut: 12000 }); hls.on(window.Hls.Events.ERROR, (e, d) => { if (d && d.fatal) fail(); });
  hls.loadSource(url); hls.attachMedia(video); video.play().catch(() => {}); }

// called after every Watch render: attach the kept player to the page, or stop it when Live TV is not showing
export function mountTV(host){ if (!host){ if (box && box.isConnected === false && (hls || video.src)) stopStream(), state = ""; return; }
  const first = !box; host.appendChild(ui()); if (first || !state){ urlI = 0; play(); } else if (video.paused && !box.querySelector(".tvmsg:not([hidden])")) video.play().catch(() => {}); }
