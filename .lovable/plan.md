## Ziel

1. Alle Mock-Inhalte (Pubs, Menü, Events, Aktionen, HR) auf das **echte Pub&Go-Konzept** ausrichten — Quelle ist das Schwesterprojekt `Pub&Go-Operations_ES`.
2. **HQ-Rechte** so vereinfachen, dass jede Person *alles* sehen kann, aber mit einem klaren Standard-Bereich landet, der zu ihrer Aufgabe passt.

---

## Teil 1 — Inhalte an Pub&Go anpassen

Quelle: `Pub&Go-Operations_ES` (gleicher Owner, kanonische Pub&Go-Daten, nur spanisch lokalisiert). DE/EN-Sprache und aktuelles UI bleiben — nur die Inhalte werden 1:1 übernommen und übersetzt.

| Bereich | Übernahme aus ES-Projekt |
|---|---|
| **Pubs** (`pubs-mock.ts`) | Pub&Go-Namens­konvention "Pub&Go {Stadt} {Bezirk}" — auf den DACH-Markt portiert: Berlin Mitte, Berlin Prenzlauer Berg, Hamburg Schanze, München Glockenbach, Köln Belgisches Viertel, Frankfurt Bahnhofs­viertel, Stuttgart Westend, Düsseldorf Altstadt. Manager-Namen / Telefon / KPIs aus ES als Vorlage. |
| **Sortiment / Top-Seller** (`sales-mock.ts`, evtl. `sortiment.tsx`) | Echte Pub&Go-Karte: Caña 0,3l, Tinto de Verano, Vermut, Patatas Bravas, Tortilla, Tabla Ibérica … in DE-Übersetzung wo nötig (z. B. Caña → "Bier 0,3l", Tabla Ibérica behalten). |
| **Events** (`events-mock.ts`) | 14-Tage-Programm aus `events-data.ts` der App: Pub Quiz, Karaoke Night, Live Sports (La Liga / Bundesliga), DJ-Set, Comedy, Tasting. Tisch-Layout 6×2 + 8×4 + 4×6 = 68 Plätze beibehalten. |
| **Active Ops / Marketing** (`active-ops-mock.ts`, Marketing-Tab) | Pub&Go-typische Frequenz-Aktionen: Happy Hour, Stamp-Card-Push, Event-Boost, Walk-In-Challenge. |
| **HQ News / Briefings** (`hq-news-mock.ts`) | Beispiel-Briefings die zum Konzept passen: neue Karte, neues Quiz-Format, Saison-Aktion, Stamp-Card-Update. |
| **HR** (`hr-mock.ts`) | Rollen (Bartender, Bar Manager, Kellner:in, Küche, Barista) bleiben — Namen DE-typisch, sonst wie heute. |

Output: bilingual (DE primär, EN als Übersetzung in `i18n.ts`). Keine Logik-Änderungen, nur Daten.

---

## Teil 2 — Rollen & Rechte

### Personen → Rollen

| Person | Rolle (technisch) | Default-Landing | Sichtbarkeit | Schreibrecht |
|---|---|---|---|---|
| **Louis Kamppeter** | `hq_admin` (Super) | Tab **Marketing** | alle Tabs | alle |
| **Felix Hartmann + Paul Karwinkel** | `ops_admin` (gemeinsame Rolle) | Tab **HR / Operations Hub** | alle Tabs | HR, Sortiment, Live Feedback, HQ News, Logistik-Inbox |
| **Tomasz Kaplanski** | `facility_admin` | Tab **Inbox** (gefiltert: Facility) | alle Tabs (read) | Facility-Inbox, eigene Tickets |
| **Supervista IA** | `it_admin` | Tab **Inbox** (gefiltert: IT) | alle Tabs (read) | IT-Inbox |

Keine `pub_manager`/`bar_staff`-Änderung — bleibt wie heute.

### Was sich konkret ändert

1. **`hr_admin` entfällt** — verschmilzt in `ops_admin`. Felix+Paul nutzen *dasselbe* Login "Operations" (eine Rolle, ein Avatar). HR-Tab gehört jetzt zu ops, Tickets-Kategorie `logistics` ebenfalls.
2. **Sidebar zeigt für alle HQ-Rollen alle Tabs** (heute werden bei `hr_admin` viele Tabs versteckt — entfällt). Damit niemand "verloren" geht.
3. **Default-Tab pro Rolle** statt heute nur „overview": Louis → `marketing`, Ops → `hr`, Facility → `inbox`, IT → `inbox`. Inbox wird automatisch nach Kategorie der Rolle vor­gefiltert.
4. **Owner-Badge pro Tab** (subtiler Pill rechts oben im Tab-Header, z. B. „Owner: Operations" / „Owner: Marketing") — macht ohne Re­strik­tio­nen sichtbar, wer für den Bereich Lead ist. Reduziert Verwirrung, ohne Zugriff zu blockieren.
5. **HQ-News-Composer** (Senden) bleibt sichtbar für alle HQ-Rollen, aber „Veröffentlichen"-Button ist nur für `hq_admin` (Louis) und `ops_admin` (Felix/Paul) aktiv — Tomasz/Supervista sehen Read-only-Liste.
6. **Login-Screen** zeigt jetzt Personen statt Rollen-Bezeichnung:
   - „Louis Kamppeter — Marketing & Active Ops"
   - „Felix & Paul — Operations"
   - „Tomasz Kaplanski — Facility"
   - „Supervista IA — IT"
   plus weiterhin Pub Manager / Bar Staff Demo-Buttons.
7. **Topbar-Avatar** zeigt Initialen der Person (LK / OP / TK / IT) statt generisch „HQ".

### Technische Details

- `src/lib/auth-mock.ts`: `Role` ohne `hr_admin`; neue Konstanten `ROLE_PERSON` (Anzeige­name) und `ROLE_DEFAULT_TAB`; `isHqRole` unverändert.
- `src/routes/hq.index.tsx`: Tab-Filter `show:` für HQ-Rollen immer `true`; `defaultTab` aus `ROLE_DEFAULT_TAB[session.role]`; neuer kleiner `<OwnerBadge owner="…">`-Helper im Tab-Header.
- `src/routes/index.tsx` (Login): Button-Liste auf Personen umgestellt, Icons bleiben.
- `src/components/hq/hq-news-composer.tsx`: `canPublish = role === "hq_admin" || role === "ops_admin"`; sonst Read-only-Hinweis.
- `src/lib/tickets-store.ts` + `ROLE_TICKET_CATEGORY`: HR-Mapping entfernen, `ops_admin → logistics` bleibt.

### Migration / Demo

Vorhandene `localStorage`-Sessions mit Rolle `hr_admin` werden beim Laden auf `ops_admin` gemappt (`getSession()` patcht still) — kein Login-Bruch.

---

## Was *nicht* Teil dieses Plans ist

- Echtes Auth-System (bleibt Mock).
- Multi-User pro Rolle / Audit-Log wer was geändert hat.
- Granulare Per-Tab-Permissions (alle HQ-Rollen sehen weiterhin alles read-only).