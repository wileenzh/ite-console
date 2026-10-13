// What the interface is showing. Saved per browser so a refresh lands where you were.
import { load, save, emit } from "../core.js";

export const UI = Object.assign({ ws: "watch", watchSel: null, watchMode: "feed", watchKinds: [], watchAll: false, q: "", inboxSel: null, inboxShowDone: false,
  eventSel: null, eventShowClosed: false, siteSel: null, siteQ: "", reportSel: "handover", setSel: "sources" }, load("ui", {}));
export const saveUI = () => save("ui", UI);
export function go(ws, patch){ Object.assign(UI, patch || {}); UI.ws = ws; saveUI(); emit("route"); }
