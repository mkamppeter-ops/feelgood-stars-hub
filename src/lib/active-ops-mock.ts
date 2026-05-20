// Live-Ops Mock-Daten pro Pub. Wird per pubId mit PUBS gejoint.
// Stundenziel-Kurve: typisches Pub-Profil (Mittag flach, Peak 19–22 Uhr).

import { PUBS } from "./pubs-mock";

export type LiveOps = {
  pubId: string;
  liveGuests: number;
  capacity: number;
  hourlyTarget: number[]; // 24 Werte, Index = Stunde 0..23
  pushReachable: number;
  lastCampaignAt: number | null;
};

// Basis-Kurve (relativ, 0..1). Wird je Pub mit Kapazität skaliert.
const BASE_CURVE = [
  0.02, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
  0.0, 0.0, 0.05, 0.18, 0.35, 0.30, 0.22, 0.25,
  0.40, 0.55, 0.78, 0.92, 0.98, 0.95, 0.80, 0.45,
];

function makeHourlyTarget(capacity: number): number[] {
  return BASE_CURVE.map((r) => Math.round(capacity * r));
}

// Pseudo-zufällige aber deterministische Live-Werte (für stabilen Mock).
function pseudoLive(pubId: string, capacity: number): number {
  const hour = new Date().getHours();
  const target = Math.round(capacity * BASE_CURVE[hour]);
  // Hash aus pubId für ±35% Abweichung
  let h = 0;
  for (let i = 0; i < pubId.length; i++) h = (h * 31 + pubId.charCodeAt(i)) >>> 0;
  const variance = ((h % 71) / 100) - 0.35; // -0.35 .. +0.35
  return Math.max(0, Math.round(target * (1 + variance)));
}

const CAPACITIES: Record<string, number> = {
  "crown-anchor": 140,
  "red-lion": 130,
  "foggy-dog": 110,
  "old-oak": 100,
  "iron-barrel": 95,
  "black-sheep": 90,
  "tipsy-fox": 80,
  "whistling-kettle": 75,
};

export const LIVE_OPS: LiveOps[] = PUBS.map((p) => {
  const capacity = CAPACITIES[p.id] ?? 100;
  return {
    pubId: p.id,
    liveGuests: pseudoLive(p.id, capacity),
    capacity,
    hourlyTarget: makeHourlyTarget(capacity),
    pushReachable: Math.round(p.activeAppUsers * 0.6),
    lastCampaignAt: null,
  };
});

export function getLiveOps(pubId: string): LiveOps | undefined {
  return LIVE_OPS.find((l) => l.pubId === pubId);
}

export function getCurrentHourTarget(ops: LiveOps, hour = new Date().getHours()): number {
  return ops.hourlyTarget[hour] ?? 0;
}

export type LiveStatus = "over" | "ontrack" | "under";

export function getStatus(ops: LiveOps): { status: LiveStatus; delta: number; target: number } {
  const target = getCurrentHourTarget(ops);
  const delta = ops.liveGuests - target;
  if (target === 0) return { status: "ontrack", delta: 0, target };
  const pct = delta / Math.max(1, target);
  if (pct >= 0.05) return { status: "over", delta, target };
  if (pct <= -0.1) return { status: "under", delta, target };
  return { status: "ontrack", delta, target };
}

// Simuliert eine kleine Live-Schwankung für den 30s-Refresh.
export function tickLive(ops: LiveOps): LiveOps {
  const drift = Math.round((Math.random() - 0.5) * Math.max(2, ops.liveGuests * 0.08));
  const next = Math.max(0, Math.min(ops.capacity, ops.liveGuests + drift));
  return { ...ops, liveGuests: next };
}

export const PUSH_COOLDOWN_MIN = 90;
