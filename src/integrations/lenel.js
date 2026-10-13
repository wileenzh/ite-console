// Lenel OnGuard, behind one small interface so the console never cares where events come from.
//   SimulatedOnGuard — the prototype: OpenAccess-shaped events for doors at fictional sites, generated in this browser.
//   OpenAccessOnGuard — production (not in this build): runs on the PSOC server, which holds the OpenAccess
//     application ID and a read-only service account, signs in at POST /api/access/onguard/openaccess/authentication,
//     subscribes to live events over SignalR, and forwards to the console only door, reader and alarm events —
//     never cardholder names or photos.
// Either way the console receives the same shape: { id, time, type, device, site, badge, severity, text }.

const DOORS = [
  { device: "TOK83 Main Entrance Reader 01", site: "TOK83", cam: "CAM-01" },
  { device: "TOK83 Perimeter Gate N", site: "TOK83", cam: "CAM-02" },
  { device: "SIG97 Loading Dock Door 02", site: "SIG97", cam: "CAM-03" },
  { device: "SIG97 Lobby Turnstile 03", site: "SIG97", cam: "CAM-04" },
  { device: "SIG97 Server Hall B Reader 11", site: "SIG97", cam: null } ];
export const TYPES = { granted: ["Access Granted", 0], denied: ["Access Denied", 1], forced: ["Door Forced Open", 3], held: ["Door Held Open", 2], offline: ["Reader Offline", 2], commloss: ["Panel Communication Lost", 2], restored: ["Communications Restored", 0] };
const masked = () => "Badge ••" + String(1000 + Math.floor(Math.random() * 8999));

export class SimulatedOnGuard {
  constructor(){ this.name = "Lenel OnGuard (simulated)"; this.on = () => {}; this.timer = null; this.n = 0; }
  connect(onEvent){ this.on = onEvent; if (this.timer) return; this.timer = setInterval(() => this.tick(), 4000); }
  disconnect(){ clearInterval(this.timer); this.timer = null; }
  emit(kind, door, extra = {}){ const [type, severity] = TYPES[kind]; const e = Object.assign({ id: "og" + Date.now().toString(36) + (this.n++), time: Date.now(), type, kind, device: door.device, site: door.site, cam: door.cam, badge: kind === "granted" || kind === "denied" ? masked() : "", severity }, extra);
    e.text = `${e.type} at ${e.device}${e.badge ? ` (${e.badge})` : ""}.`; this.on(e); return e; }
  // routine traffic: mostly granted, the odd denied; faults rarely
  tick(){ const r = Math.random(), door = DOORS[Math.floor(Math.random() * DOORS.length)];
    if (r < .55) this.emit("granted", door); else if (r < .62) this.emit("denied", door); else if (r < .625){ this.emit("offline", DOORS[4]); setTimeout(() => this.emit("restored", DOORS[4]), 45e3); } }
  door(cam){ return DOORS.find(d => d.cam === cam) || DOORS[0]; }
}
export const DOOR_LIST = DOORS;
