import { useSyncExternalStore } from "react";
import { HQ_NEWS, type HQNewsItem, type NewsCategory } from "./hq-news-mock";

const STORAGE_KEY = "pubgo.hq-news.v1";

function loadInitial(): HQNewsItem[] {
  if (typeof window === "undefined") return HQ_NEWS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return HQ_NEWS;
    const parsed = JSON.parse(raw) as HQNewsItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return HQ_NEWS;
    return parsed;
  } catch {
    return HQ_NEWS;
  }
}

let state: HQNewsItem[] = HQ_NEWS;
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
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export interface NewHQNewsInput {
  category: NewsCategory;
  titleDe: string;
  titleEn: string;
  excerptDe: string;
  excerptEn: string;
  bodyDe?: string;
  bodyEn?: string;
  author: string;
  authorRole: string;
  pinned?: boolean;
  requiresAck?: boolean;
}

export const hqNewsStore = {
  get: () => {
    ensureHydrated();
    return state;
  },
  getServerSnapshot: () => HQ_NEWS,
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
  add: (input: NewHQNewsInput) => {
    ensureHydrated();
    const id = `n-${Date.now().toString(36)}`;
    // If new item is pinned, unpin previously pinned items
    const next: HQNewsItem[] = input.pinned
      ? state.map((n) => ({ ...n, pinned: false }))
      : [...state];
    next.unshift({
      ...input,
      id,
      publishedAt: new Date().toISOString(),
    });
    state = next;
    emit();
  },
  remove: (id: string) => {
    ensureHydrated();
    state = state.filter((n) => n.id !== id);
    emit();
  },
  togglePin: (id: string) => {
    ensureHydrated();
    state = state.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned } : { ...n, pinned: n.pinned && false }
    );
    // simpler: only one pinned at a time
    const justPinned = state.find((n) => n.id === id && n.pinned);
    if (justPinned) {
      state = state.map((n) => (n.id === id ? n : { ...n, pinned: false }));
    }
    emit();
  },
  reset: () => {
    state = HQ_NEWS;
    emit();
  },
};

export function useHQNews(): HQNewsItem[] {
  return useSyncExternalStore(
    hqNewsStore.subscribe,
    hqNewsStore.get,
    hqNewsStore.getServerSnapshot,
  );
}
