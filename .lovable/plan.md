
## Ziel

Eine neue Kern-Kennzahl **„Aktive App-Nutzer"** einführen, die zeigt, wie viele über Marketing aktivierte Nutzer wir aktuell haben — gemessen gegen einen **Zielwert pro Pub**, der nötig ist, um den Zielumsatz zu erreichen. So wird sichtbar, ob die Marketing-Pipeline die Pubs ausreichend „füllt".

## Datenmodell (`src/lib/pubs-mock.ts`)

Pro Pub zwei neue Felder:
- `activeAppUsers: number` — aktuelle Nutzer (z. B. 7-Tage-aktive App-User im Einzugsgebiet)
- `appUsersTarget: number` — Zielwert, der für 100 % Umsatzziel nötig ist

Plus abgeleitete Kennzahl (Helper):
- `appUsersReach = activeAppUsers / appUsersTarget × 100` (in %)

Mock-Werte werden so gesetzt, dass die Top-Pubs ~100–115 % Reach haben, die schlechtesten ~60–75 % — passend zu ihrem Umsatzziel-Wert.

## Score-Anbindung — bewusst NEIN

Der Performance-Score bleibt wie vereinbart: **Umsatz-Ziel + Walk-In + Feedback**. App-Reach ist die *Erklärungs*-Kennzahl ("warum wird das Umsatzziel verfehlt?"), kein zusätzlicher Score-Faktor. Sonst wäre er doppelt gewichtet (App-Reach → Umsatzziel → Score).

## UI-Platzierung

### 1) HQ Overview (`src/routes/hq.index.tsx`)

**a) Neue KPI-Kachel** in der oberen KPI-Reihe — Reihe wird von 4 auf **5 Kacheln** (auf xl-Grid `xl:grid-cols-5`):
- Icon: `Smartphone` (lucide)
- Label: „Ø App-User Reach"
- Wert: z. B. „92 %" (Mittel über alle Pubs)
- Sub: kleine Zahl „14.230 / 15.400 User"
- Ton: grün ≥ 100 %, amber 80–99 %, rot < 80 %

**b) Neue Card „App-User Reach nach Filiale"** unterhalb der Booking-Ratio-Card. Selbes Grid-Layout wie Booking-Ratio (4er-Grid mit Mini-Progress-Bar), zeigt pro Pub:
- aktuelle User vs. Ziel (z. B. „1.840 / 2.000")
- Reach in %, farbcodiert
- Progress-Bar
- Klick → Pub-Detailseite

### 2) Pub-Detailseite (`src/routes/hq.$pubId.tsx`)

Neue KPI-Kachel im Header-KPI-Block:
- „Aktive App-Nutzer"
- Anzeige: `1.840 / 2.000` + Reach-%-Badge
- Kurzer Hinweistext: „Ziel sichert 100 % Umsatzziel"

Optional kleiner Insight-Hinweis, wenn Reach < 80 %: „⚠ Marketing aufstocken — App-Reach unter Zielmarke; Umsatzziel gefährdet."

## Bewusst NICHT enthalten

- Keine Zeitreihe der App-User (kein Chart) — nur aktueller Stand vs. Ziel, das reicht für die Aussage.
- Keine Score-Formel-Änderung.
- Keine neuen Tabs/Routen.
- Keine Marketing-Detailseite (Quellen, Kampagnen) — kann später folgen.

## Dateien

- **Bearbeiten** `src/lib/pubs-mock.ts` — Felder `activeAppUsers`, `appUsersTarget` ergänzen, Helper `getAppReach()` exportieren.
- **Bearbeiten** `src/routes/hq.index.tsx` — 5. KPI-Kachel + neue „App-User Reach"-Card.
- **Bearbeiten** `src/routes/hq.$pubId.tsx` — KPI-Kachel im Pub-Header.

## Akzeptanzkriterien

1. HQ Overview zeigt Ø App-User Reach in der KPI-Reihe.
2. Neue Card listet alle 8 Pubs mit „aktuell / Ziel" und Reach-% farbcodiert.
3. Pub-Detailseite zeigt die Kennzahl prominent.
4. Mock-Werte sind plausibel: höhere Reach-Werte korrelieren grob mit höheren `revenueTarget`-Werten.
5. Layout bleibt auf 815px-Viewport sauber (KPI-Reihe wickelt korrekt auf 2 Spalten).
