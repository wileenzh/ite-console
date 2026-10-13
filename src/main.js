// Entry point: bring over what the current console holds (first start only), register every source, start.
import { loadRaw, setRelay } from "./core.js";
import { CFG, migrateFromCurrentConsole } from "./config.js";
import { STATE, migrateData, rebuildMetros, recompute } from "./model.js";
import { SOURCES, startSchedule, runSource } from "./sources/index.js";
import "./sources/quakes.js";
import "./sources/agencies.js";
import "./sources/hazards.js";
import "./sources/people.js";
import "./sources/conditions.js";
import { start } from "./ui/shell.js";
import { leafletMap } from "./ui/map.js";
import { toast } from "./ui/kit.js";

import { applyCSP } from "./security.js";
const brought = [...(migrateFromCurrentConsole() || []), ...migrateData(loadRaw)];
setRelay(CFG.relay || CFG.server);
applyCSP();
rebuildMetros();
recompute();
start();
startSchedule();
import { startSim } from "./sim/cameras.js";
import { load as loadPref } from "./core.js";
if (loadPref("camRun", false) === true) startSim();      // the camera prototype keeps running if it was left running
if (brought.length) setTimeout(() => toast("Brought over from the current console", brought.join(", ") + ". The current console is unchanged.", 0, null, 12000), 800);
window.ITE = { STATE, SOURCES, CFG, runSource, map: leafletMap };   // for support: inspect sources and signals from the browser console
