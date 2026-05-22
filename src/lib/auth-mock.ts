import { useEffect, useState } from "react";

export type Role =
  | "hq_admin"
  | "pub_manager"
  | "bar_staff"
  | "it_admin"
  | "facility_admin"
  | "ops_admin";

/** Sub-admins in HQ each own one ticket category.
 *  ops_admin = Operations (Felix & Paul) handles logistics-style topics. */
export const ROLE_TICKET_CATEGORY: Partial<Record<Role, "it" | "facility" | "logistics">> = {
  it_admin: "it",
  facility_admin: "facility",
  ops_admin: "logistics",
};
export type Session = { role: Role; loggedInAt: number; pubId?: string };

const KEY = "pubgo.session";

/** Migrate legacy "hr_admin" sessions to "ops_admin" silently. */
function migrate(parsed: { role?: string } & Record<string, unknown>): Session | null {
  if (!parsed?.role) return null;
  const role = parsed.role === "hr_admin" ? "ops_admin" : (parsed.role as Role);
  return {
    role,
    loggedInAt: typeof parsed.loggedInAt === "number" ? parsed.loggedInAt : Date.now(),
    pubId: typeof parsed.pubId === "string" ? parsed.pubId : undefined,
  };
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = migrate(parsed);
    if (session && session.role !== parsed.role) {
      // persist the migration
      window.localStorage.setItem(KEY, JSON.stringify(session));
    }
    return session;
  } catch {
    return null;
  }
}

export function setSession(role: Role, pubId?: string): void {
  if (typeof window === "undefined") return;
  const session: Session = { role, loggedInAt: Date.now(), pubId };
  window.localStorage.setItem(KEY, JSON.stringify(session));
  // Manually notify same-tab listeners (storage event only fires cross-tab)
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function useSession(): Session | null {
  const [session, setLocal] = useState<Session | null>(() => getSession());

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key && e.key !== KEY) return;
      setLocal(getSession());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return session;
}

export const ROLE_LABEL: Record<Role, string> = {
  hq_admin: "HQ Admin",
  pub_manager: "Pub Manager",
  bar_staff: "Bar Staff",
  it_admin: "IT Admin",
  facility_admin: "Facility Admin",
  ops_admin: "Operations",
};

/** Real person(s) behind each role — used in login screen & topbar avatar. */
export const ROLE_PERSON: Record<Role, { name: string; subtitle: string; initials: string }> = {
  hq_admin:       { name: "Louis Kamppeter",       subtitle: "Marketing & Active Ops",  initials: "LK" },
  ops_admin:      { name: "Felix & Paul",          subtitle: "Operations",              initials: "OP" },
  facility_admin: { name: "Tomasz Kaplanski",      subtitle: "Facility",                initials: "TK" },
  it_admin:       { name: "Supervista IA",         subtitle: "IT",                      initials: "IT" },
  pub_manager:    { name: "Pub Manager",           subtitle: "Pub-Manager Demo",        initials: "PM" },
  bar_staff:      { name: "Bar Staff",             subtitle: "Bar-Staff Demo",          initials: "BS" },
};

/** Each HQ role lands on its own tab by default — but sees all tabs. */
export const ROLE_DEFAULT_TAB: Partial<Record<Role, string>> = {
  hq_admin:       "marketing",
  ops_admin:      "hr",
  facility_admin: "inbox",
  it_admin:       "inbox",
};

/** Owner label per tab — shown as subtle "Owner: …" pill next to the page title. */
export const TAB_OWNER: Record<string, Role> = {
  // overview & pubs sind geteilte Übersichten — kein einzelner Lead
  marketing:   "hq_admin",
  "active-ops":"hq_admin",
  events:      "hq_admin",
  hr:          "ops_admin",
  staff:       "ops_admin", // Personalplan — Lead Felix & Paul
  sortiment:   "ops_admin",
  sales:       "ops_admin",
  feedback:    "ops_admin",
  "hq-news":   "ops_admin",
  inbox:       "ops_admin", // multi-owner (per category); default lead = ops
  settings:    "it_admin",
};


/** Roles that may publish HQ News & Briefings (Composer write). */
export const NEWS_PUBLISHER_ROLES: Role[] = ["hq_admin", "ops_admin"];

const HQ_ROLES: Role[] = ["hq_admin", "it_admin", "facility_admin", "ops_admin"];
export function isHqRole(role: Role): boolean {
  return HQ_ROLES.includes(role);
}

export function defaultRouteForRole(role: Role): string {
  if (isHqRole(role)) return "/hq";
  if (role === "pub_manager") return "/pub?mode=manager";
  return "/pub?mode=staff";
}
