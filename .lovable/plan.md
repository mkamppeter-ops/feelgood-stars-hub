## Ziel

Login-Seite als zwingender Startpunkt unter `/`. Erst nach Auswahl einer Rolle (oder in der echten Welt: erfolgreichem Login) kommt man an `/hq` oder `/pub`. Für die Demo gibt es darunter drei Schnell-Buttons, die jeweils eine Rolle simulieren.

## Routing-Umbau

Aktuell ist `/` das **Kunden-Feedback-Formular** (QR-Code-Einstieg im Pub). Das verträgt sich nicht mit einer Pflicht-Login-Seite auf `/`.

Vorschlag:

| Pfad | Vorher | Nachher |
|---|---|---|
| `/` | Kunden-Feedback | **Login** |
| `/login` | — | Alias auf `/` (gleiche Komponente) |
| `/feedback` | — | Kunden-Feedback-Formular (öffentlich, kein Login — für QR-Codes) |
| `/hq` | HQ Dashboard | nur HQ Admin |
| `/pub?mode=manager` | Pub View | nur Pub Manager |
| `/pub?mode=staff` | — | nur Bar Staff (gleiche Komponente, eingeschränkter Modus später) |

Wenn du das Kunden-Feedback woanders willst (z. B. unter einer Pub-spezifischen URL `/f/$pubId`), sag Bescheid — sonst gehe ich mit `/feedback`.

## Login-Seite (`/`)

- **Card-Design**, zentriert, voller Viewport-Hintergrund mit dezentem Gradient.
- Inhalt:
  - Logo-Platzhalter (rundes Icon-Square mit Initialen „P&G" — passt zu „Pub&Go") + Wortmarke.
  - Headline „Willkommen zurück" + Subtext „Melde dich an, um auf dein Dashboard zuzugreifen."
  - Felder: E-Mail, Passwort (mit Show/Hide-Toggle), „Passwort vergessen?"-Link (Mock, ohne Ziel).
  - Primary-Button „Login" (zeigt nur Toast „Demo: Bitte einen Rollen-Button nutzen" — keine echte Auth).
  - Trenner „— oder Demo-Zugang —".
  - **Drei Demo-Buttons** (Outline-Style, Icons):
    - 🏢 **Login als HQ Admin** → setzt Rolle, navigiert nach `/hq`
    - 🍺 **Login als Pub Manager** → setzt Rolle, navigiert nach `/pub?mode=manager`
    - 👤 **Login als Bar Staff** → setzt Rolle, navigiert nach `/pub?mode=staff`
  - Footer-Text klein: „Demo-Modus · keine echte Authentifizierung".
- Design-Tokens aus `src/styles.css`, keine Hex-Werte hardcoden.

## Mock-Auth-Layer

Da noch keine echte Auth gewünscht ist (reine Demo), nutzen wir **localStorage** als Mock-Session-Store. Eine spätere Migration auf Supabase Auth ist mit minimalem Diff möglich.

Neue Datei: `src/lib/auth-mock.ts`

```ts
export type Role = "hq_admin" | "pub_manager" | "bar_staff";
export type Session = { role: Role; loggedInAt: number };

export function getSession(): Session | null { /* read localStorage */ }
export function setSession(role: Role): void { /* write localStorage */ }
export function clearSession(): void { /* remove */ }
export function useSession(): Session | null { /* hook mit storage-event */ }
```

`useSession` abonniert `window.storage` damit Logout in einem Tab auch andere Tabs aktualisiert.

## Route-Schutz

TanStack-Pattern: kein `beforeLoad`-Context-Refactor (Overkill für Mock), stattdessen ein kleiner **Guard-Wrapper** pro geschützter Route:

- In `hq.index.tsx` und `hq.$pubId.tsx`: prüfe `getSession()?.role === "hq_admin"`. Falls nein → `<Navigate to="/" />`.
- In `pub.tsx`: prüfe Rolle ∈ `["pub_manager", "bar_staff"]`. Falls nein → `<Navigate to="/" />`. Mode aus URL-Search-Param `mode` lesen (Default: aus Rolle ableiten).
- Auf `/` (Login): falls bereits eingeloggt → direkter Redirect ins passende Dashboard.

Begründung: Wir behalten die Files an Ort und Stelle (kein Verschieben unter `_authenticated/`), das hält den Diff klein und die bestehenden Routen ((`hq.index.tsx`, `hq.$pubId.tsx`, `pub.tsx`, `admin.tsx`) unverändert in ihrer Struktur. Bei späterer Migration auf Supabase Auth wandern die Checks ins `beforeLoad`.

`admin.tsx` bekommt denselben Schutz wie HQ.

## Header-Integration

In `hq.index.tsx` und `pub.tsx` Sidebar/Topbar kleine **„Abmelden"**-Aktion ergänzen (Avatar-Menü oder einfacher Button), die `clearSession()` aufruft und auf `/` navigiert. So kann man zwischen den Rollen demo-mäßig schnell wechseln.

## Bar-Staff-Modus (Stub)

`pub.tsx` bekommt einen `mode`-Search-Param. Für jetzt zeigt der Staff-Modus dieselbe View mit einem dezenten Badge „Staff-View" im Header. Welche Tabs/Aktionen Staff vs. Manager tatsächlich sehen darf, klären wir separat — bitte kurz Bescheid geben, was Staff *nicht* sehen soll (z. B. Sales, Sortiment-Margen?), dann baue ich das in einem Folge-Turn.

## Geänderte / neue Dateien

- **Neu**: `src/routes/login.tsx` (oder `src/routes/index.tsx` ersetzen — Login wird neue Index-Route).
- **Neu**: `src/lib/auth-mock.ts`.
- **Verschoben**: aktueller Inhalt von `src/routes/index.tsx` → `src/routes/feedback.tsx` (1:1, nur Route-Pfad ändert sich).
- **Edit**: `src/routes/hq.index.tsx`, `src/routes/hq.$pubId.tsx`, `src/routes/pub.tsx`, `src/routes/admin.tsx` — Guard + Logout-Button.

## Was bleibt unverändert

- Bestehende Komponenten (`ActiveOps`, `LiveFeedback`, `SalesOps`, …), Mock-Daten, Tabs-Struktur.
- Lovable Cloud / Supabase wird **nicht** angefasst — reine Frontend-Demo-Auth.
