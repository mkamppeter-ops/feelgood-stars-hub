# QA-Check vor Team-Sharing

Dev-Server läuft sauber (HTTP 200, keine aktuellen Build-Fehler). Die zwei realen Probleme sind ein **Hydration-Bug** und **Übersetzungslücken** in den neuesten Features (Personalplan, Teile von Data Settings).

---

## 🔴 1. Hydration-Mismatch beim Sprach-Switcher

**Beobachtet** (Runtime-Errors): `+ title="Sprache"` / `- title="Language"` und `+ DE` / `- EN` direkt nach dem Login-Bildschirm.

**Ursache:** `i18next-browser-languagedetector` liest auf dem Client aus `localStorage` (`pubgo.lang`), beim SSR-Rendering existiert aber kein `localStorage` → Server rendert immer `fallbackLng: "de"`. Hat der Nutzer EN gespeichert, springt der Client nach Hydration auf EN um → React-Hydration-Mismatch.

**Fix:**
- `LanguageSwitcher` zeigt sprachabhängige Texte erst nach Mount (`useEffect` + `mounted`-State), oder
- `suppressHydrationWarning` auf dem sprachabhängigen Wrapper + Klartext-Render erst nach Mount für `title`, `DE/EN`-Label und `SelectValue`.

Empfehlung: Variante mit `mounted`-State – sauberer, kein Warning-Unterdrücken nötig.

---

## 🟠 2. Personalplan komplett auf Deutsch (keine EN-Variante)

`src/components/pub/staff-schedule.tsx`, `src/components/hq/staff-overview.tsx` und `src/lib/staff-schedule.ts` nutzen **keine** `useT()`-/`useTranslation()`-Helper. Betroffene Strings:

**Pub-Ansicht (staff-schedule.tsx):**
- Header: `Personalplan · {pub}`, `KW {n} · ... aktive Mitarbeiter · Öffnungszeiten: ...`, Button `Heute`, `Mitarbeiter`
- Empty State: `Noch keine Mitarbeiter gepflegt. Über „Mitarbeiter" anlegen oder später aus P&I synchronisieren.`
- Tabelle: `Mitarbeiter`, `Stunden gesamt`, `Wochensumme: ... Std.`
- Editor-Dialog: `Schicht bearbeiten/hinzufügen`, `Slot`, `Von`, `Bis`, `Notiz (optional)`, `Achtung: Schicht liegt außerhalb der Öffnungszeiten ...`, `Löschen`, `Abbrechen`, `Speichern`
- Toasts: `Schicht gespeichert/entfernt`, `Fehler beim Laden/Speichern/Löschen`, `Bitte Vor- und Nachname angeben`, `Mitarbeiter hinzugefügt`
- Staff-Manager: `Mitarbeiter verwalten`, `Mitarbeiterstammdaten werden später automatisch aus P&I LogaHR übernommen ...`, `Vorname/Nachname/Rolle`, `Aktiv`, `Deaktiviert`, `Schließen`

**HQ-Übersicht (staff-overview.tsx):**
- `Personalplan · Übersicht`, `Geplante Schichten aller Pubs · Lead: Felix & Paul`
- KPIs: `Schichten`, `Stunden`, `Pubs geplant`, `Ohne Plan`
- Warning: `Pubs ohne Schichtplan in KW {n}:`
- Zellen: `Sch.` (Schichten-Suffix), `Keine Schichten an diesem Tag.`
- Drilldown-Datum: `toLocaleDateString("de-DE", ...)` → muss `lang`-abhängig sein

**Lib (staff-schedule.ts):**
- `SHIFT_SLOT_META.label`: `Früh / Spät / Nacht` → in i18n-Keys verschieben (Konsumenten holen Labels über `t()`)
- `STAFF_ROLES = ["Bar", "Service", "Küche", "Floor"]` → Werte bleiben in DB, aber UI-Anzeige übersetzen

**Vorgehen:**
- Neue i18n-Sektion `staff:` in `src/lib/i18n.ts` (DE + EN) mit allen Strings
- `SHIFT_SLOT_META` ohne `label`; Labels per Hook `t("staff.slots.early")` etc.
- Inline-`tt("Mitarbeiter", "Staff")`-Pattern wie in den anderen neuen Komponenten

---

## 🟡 3. Data Settings — drei kleine Lücken

`src/components/data-settings.tsx`:
- **L190**: `Werbemittel-Sortiment` (Tab-Label, hardcoded DE)
- **L191**: `HR-System (P&I)` (Tab-Label, hardcoded DE)
- **L404-412**: Ziel-Auslastung-Card nutzt die DE-Strings inline, obwohl die Keys `settings.occupancyTitle`/`occupancySub`/`setHours` **bereits existieren** – nur das Mapping fehlt.

**Fix:** Auf `t("settings.*")` umstellen + zwei neue Keys (`settings.tabPromo`, `settings.tabPI`).

---

## ✅ Nicht-Probleme (geprüft, alles OK)

- Build-Status: Dev-Server antwortet 200; die Log-Einträge `data-settings.tsx 442:6` sind 25 min alt und stammen von einer früheren Zwischenversion.
- `data-settings.tsx` JSX-Tags balanciert (manuell durchgezählt).
- Auth-Mock-Migration `hr_admin → ops_admin` ist drin (silent).
- Andere neue Komponenten (`promo-shop`, `promo-fulfillment`, `pi-hr-integration`, `pub-events`) nutzen konsequent `useT()`.
- `Dialog`-Komponenten ohne `Description` werfen nur Radix-A11y-Warnings (kein Bug, optional).

---

## Umsetzungsumfang nach Freigabe

1. Hydration-Fix im `LanguageSwitcher` (~10 Zeilen)
2. i18n-Block `staff:` in `i18n.ts` (DE + EN, ~30 Keys)
3. `staff-schedule.tsx` + `staff-overview.tsx` auf `useT()` / `useTranslation()` umstellen
4. `staff-schedule.ts`: `SHIFT_SLOT_META.label` entfernen → Labels in Komponenten via `t()`
5. Data Settings: 2 Tab-Labels + Auslastung-Card auf `t()` umstellen

Keine DB-Migrationen, keine Logik-Änderungen, rein UI/i18n.