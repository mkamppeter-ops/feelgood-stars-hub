import { useSyncExternalStore } from "react";

export type TicketStatus = "open" | "progress" | "done";
export type TicketCategory = "it" | "hr" | "facility" | "logistics";
export type TicketPriority = "low" | "med" | "high";

export interface Ticket {
  id: string;
  title: string;
  desc: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  author: string;
  pubId?: string;
  ago: string;
}

const INITIAL: Ticket[] = [
  { id: "T-104", title: "Kasse Terminal 2 hängt sich auf", desc: "Beim Stornieren friert das Display ein.", category: "it", status: "open", priority: "high", author: "Lisa M.", pubId: "crown-anchor", ago: "vor 2h" },
  { id: "T-103", title: "Neue Schürzen fehlen", desc: "3 Mitarbeiter ohne saubere Schürzen für Wochenende.", category: "hr", status: "open", priority: "med", author: "Tom B.", pubId: "red-lion", ago: "vor 5h" },
  { id: "T-102", title: "Zapfanlage tropft", desc: "Hahn 4 zieht nach. Sammelschale läuft schnell voll.", category: "facility", status: "progress", priority: "high", author: "Markus K.", pubId: "foggy-dog", ago: "gestern" },
  { id: "T-101", title: "Biernachschub Augustiner", desc: "Bestellung für Mi noch nicht bestätigt.", category: "logistics", status: "progress", priority: "med", author: "Sarah L.", pubId: "old-oak", ago: "gestern" },
  { id: "T-100", title: "WLAN Gäste-Netz instabil", desc: "Mehrfach Beschwerden am Wochenende.", category: "it", status: "progress", priority: "low", author: "Lisa M.", pubId: "iron-barrel", ago: "vor 2 Tagen" },
  { id: "T-099", title: "Stuhl Tisch 7 wackelt", desc: "Schraube nachziehen oder austauschen.", category: "facility", status: "done", priority: "low", author: "Tom B.", pubId: "black-sheep", ago: "vor 3 Tagen" },
  { id: "T-098", title: "Onboarding neuer Aushilfskraft", desc: "Unterlagen fehlen noch im System.", category: "hr", status: "done", priority: "med", author: "Markus K.", pubId: "tipsy-fox", ago: "vor 4 Tagen" },
  { id: "T-097", title: "Lieferung Reinigungsmittel", desc: "Eingegangen und eingeräumt.", category: "logistics", status: "done", priority: "low", author: "Sarah L.", pubId: "whistling-kettle", ago: "vor 5 Tagen" },
];

const STORAGE_KEY = "pubgo.tickets";

function loadInitial(): Ticket[] {
  if (typeof window === "undefined") return INITIAL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as Ticket[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL;
  } catch {
    return INITIAL;
  }
}

let state: Ticket[] = INITIAL;
let hydrated = false;
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = loadInitial();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export const ticketsStore = {
  get: () => {
    ensureHydrated();
    return state;
  },
  getServerSnapshot: () => INITIAL,
  subscribe: (l: () => void) => {
    ensureHydrated();
    listeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== STORAGE_KEY) return;
      state = loadInitial();
      l();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
  add: (t: Omit<Ticket, "id" | "ago" | "status"> & { status?: TicketStatus }) => {
    ensureHydrated();
    const id = `T-${String(Math.floor(Math.random() * 900) + 100)}`;
    state = [{ ...t, id, status: t.status ?? "open", ago: "gerade" }, ...state];
    emit();
  },
  setStatus: (id: string, status: TicketStatus) => {
    ensureHydrated();
    state = state.map((t) => (t.id === id ? { ...t, status } : t));
    emit();
  },
};

export function useTickets(): Ticket[] {
  return useSyncExternalStore(
    ticketsStore.subscribe,
    ticketsStore.get,
    ticketsStore.get,
  );
}
