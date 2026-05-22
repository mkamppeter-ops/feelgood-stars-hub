import { useEffect, useState } from "react";

export type Role =
  | "hq_admin"
  | "pub_manager"
  | "bar_staff"
  | "it_admin"
  | "hr_admin"
  | "facility_admin"
  | "ops_admin";

/** Sub-admins in HQ each own one ticket category.
 *  HR is intentionally NOT here — HR-Admin manages schedules/vacation/sick leave,
 *  not tickets. Operational HR-like topics go to ops_admin (logistics). */
export const ROLE_TICKET_CATEGORY: Partial<Record<Role, "it" | "facility" | "logistics">> = {
  it_admin: "it",
  facility_admin: "facility",
  ops_admin: "logistics",
};
export type Session = { role: Role; loggedInAt: number; pubId?: string };

const KEY = "pubgo.session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.role) return null;
    return parsed;
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
  hr_admin: "HR Admin",
  facility_admin: "Facility Admin",
  ops_admin: "Logistik Admin",
};

const HQ_ROLES: Role[] = ["hq_admin", "it_admin", "hr_admin", "facility_admin", "ops_admin"];
export function isHqRole(role: Role): boolean {
  return HQ_ROLES.includes(role);
}

export function defaultRouteForRole(role: Role): string {
  if (isHqRole(role)) return "/hq";
  if (role === "pub_manager") return "/pub?mode=manager";
  return "/pub?mode=staff";
}
