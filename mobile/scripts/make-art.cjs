// Draw the app icon, adaptive-icon layers, splash and notification icon (run once; outputs in resources/)
const { chromium } = require("/opt/node-tools/node_modules/playwright"); const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "../resources");
const radar = (s, col = "#4FC3B5", red = "#F05A5A", mono) => `
  <g transform="translate(${s / 2} ${s * .44})">
    <path d="M0 0 L${-s * .09} ${-s * .3} A${s * .31} ${s * .31} 0 0 1 ${s * .03} ${-s * .31} Z" fill="${mono ? "none" : col}" opacity=".28"/>
    ${[.31, .21, .095].map(r => `<circle r="${s * r}" fill="none" stroke="${col}" stroke-width="${s * .022}" opacity="${r === .31 ? 1 : .8}"/>`).join("")}
    <line x1="0" y1="0" x2="${s * .165}" y2="${-s * .14}" stroke="${col}" stroke-width="${s * .016}" stroke-linecap="round"/>
    <circle r="${s * .022}" fill="${col}"/>
    ${mono ? "" : `<circle cx="${s * .165}" cy="${-s * .14}" r="${s * .1}" fill="url(#glow)"/>`}<circle cx="${s * .165}" cy="${-s * .14}" r="${s * .045}" fill="${mono ? col : red}"/>
  </g>`;
const defs = `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16262D"/><stop offset="1" stop-color="#0B1418"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#F05A5A" stop-opacity=".7"/><stop offset="1" stop-color="#F05A5A" stop-opacity="0"/></radialGradient></defs>`;
const label = (s, y) => `<text x="${s / 2}" y="${y}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${s * .15}" fill="#EEF3F5" letter-spacing="${s * .01}">ITE</text>`;
const icon = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${defs}<rect width="${s}" height="${s}" fill="url(#bg)"/><g transform="translate(${s * .1} ${s * .03}) scale(.8)">${radar(s)}</g>${label(s, s * .86)}</svg>`;
// adaptive foreground: content kept inside the central 66% safe zone
const fg = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${defs}<g transform="translate(${s * .19} ${s * .19}) scale(.62)"><g transform="translate(${s * .1} ${s * .03}) scale(.8)">${radar(s)}</g>${label(s, s * .86)}</g></svg>`;
const bgOnly = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${defs}<rect width="${s}" height="${s}" fill="url(#bg)"/></svg>`;
const splash = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${defs}<rect width="${s}" height="${s}" fill="#0E171C"/><g transform="translate(${s * .4} ${s * .38}) scale(.2)"><g transform="translate(${s * .1} ${s * .03}) scale(.8)">${radar(s)}</g>${label(s, s * .86)}</g>
  <text x="${s / 2}" y="${s * .62}" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="${s * .018}" fill="#8FA1B3" letter-spacing="${s * .002}">INTELLIGENCE TO THE EDGE</text></svg>`;
const stat = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><g transform="translate(0 ${s * .07})">${radar(s, "#FFFFFF", "#FFFFFF", true)}</g></svg>`;
(async () => { const b = await chromium.launch(), p = await b.newPage();
  const draw = async (svg, s, out, transparent) => { await p.setViewportSize({ width: s, height: s }); await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`); await p.screenshot({ path: out, omitBackground: !!transparent, clip: { x: 0, y: 0, width: s, height: s } }); };
  await draw(icon(1024), 1024, path.join(R, "icon-only.png")); await draw(fg(1024), 1024, path.join(R, "icon-foreground.png"), true); await draw(bgOnly(1024), 1024, path.join(R, "icon-background.png"));
  await draw(splash(2732), 2732, path.join(R, "splash.png")); await draw(splash(2732), 2732, path.join(R, "splash-dark.png")); await draw(stat(96), 96, path.join(R, "ic_stat_ite.png"), true);
  await b.close(); console.log("resources drawn"); })();
