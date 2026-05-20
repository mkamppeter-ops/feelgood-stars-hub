## Ziel

Direkter Zugriff auf einzelne Pub-Detailseiten (`/hq/$pubId`) aus dem HQ-Dashboard heraus — über einen neuen Tab „Pubs“ mit einer Karten-Übersicht aller Filialen.

## Änderungen

### 1. Sidebar (`src/routes/hq.index.tsx`)
- Neuen Eintrag **„Pubs“** zwischen „Overview“ und „Active Ops“ einfügen (Icon: `Building2`), gekoppelt an `tab: "pubs"`.

### 2. Tabs-Leiste
- Neuen `TabsTrigger value="pubs"` mit Label „Pubs“ + Building2-Icon, direkt nach „Overview“.

### 3. Neuer `TabsContent value="pubs"`
- Responsives Grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) mit einer Card pro Pub aus `PUBS`.
- Jede Card zeigt:
  - Pub-Name + Stadt
  - Score-Badge (farbig nach Schwellwert wie im Leaderboard)
  - Mini-KPIs: Umsatz-Ziel %, Walk-In %, Feedback ⭐, Booking %
  - Manager-Name klein unten
- Komplette Card ist klickbar → `navigate({ to: "/hq/$pubId", params: { pubId: p.id } })`.
- Hover-States konsistent mit den bestehenden Booking/App-Reach-Cards (`hover:border-primary/40 hover:bg-muted/30`).

### 4. Optional Sort/Filter (leichtgewichtig)
- Kleine Toolbar oben im Tab: Sort-Toggle (Score ↓ / Name A–Z) — kein Suchfeld, da bei aktuell überschaubarer Pub-Anzahl unnötig.

## Nicht im Scope
- Keine Änderung an `/hq/$pubId` selbst.
- Keine neuen Routen.
- Keine Backend-Änderungen — alles auf Basis von `PUBS` aus `pubs-mock`.
