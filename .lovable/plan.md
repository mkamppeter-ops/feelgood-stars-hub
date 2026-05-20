## Ziel

Im HQ → Tab **Sortiment** eine kompakte Vergleichsansicht ergänzen, die auf einen Blick zeigt, **welches Produkt in welcher Filiale über- oder unterdurchschnittlich läuft**. Klick führt in die Filial-Detailseite.

## Neue Komponente: „Sortiment nach Filiale" (Heatmap)

Position: Unterhalb der bestehenden Sortiment-Ansicht im HQ-Tab, als eigene Card.

### Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Sortiment nach Filiale            [Alle ▾] [Drinks Food …]  │
│ Index vs. Kettendurchschnitt (100 = Schnitt)                │
├─────────────────────────────────────────────────────────────┤
│                  Crown  Red    Foggy  Old    Iron   …       │
│                  &Anch. Lion   Dog    Oak    Barrel         │
│ Pils 0,3l         142    98     76    104     88    …       │
│ Helles 0,4l        88   151    102     94    110    …       │
│ Daddy Spritz      210    45     12*    98    130    …       │
│ Classic Hotdog    105   118     92    101     87    …       │
│ …                                                            │
└─────────────────────────────────────────────────────────────┘
* = signifikant unter Schnitt (Lücke prüfen)
```

### Zellenlogik

- **Wert** = `(Filialen-Menge / Ø Kettenmenge) × 100`, gerundet.
- **Farbe** (semantisch über vorhandene Tokens):
  - ≥ 130 → kräftiges Grün (Top-Performer)
  - 110–129 → leichtes Grün
  - 91–109 → neutral (muted)
  - 71–90 → leichtes Rot
  - ≤ 70 → kräftiges Rot + kleines Warn-Icon (Sortiments­lücke)
- **Tooltip** pro Zelle: absolute Menge, Umsatz, Abweichung in % und €.
- **Klick auf Zelle / Spaltenkopf** → Navigation zur Filial-Detailseite.

### Filter

- Kategorie-Filter (Alle / Drinks / Food / Cocktails) — übernimmt die bestehenden Buttons-Stil aus `sortiment.tsx`.
- Sortier-Dropdown: „Nach Umsatz", „Größte Streuung" (= max−min Index, hilft, Ausreißer-Produkte zu finden).

### Insights-Leiste (über der Tabelle)

Drei kleine Stat-Chips, automatisch berechnet:
- 🏆 **Top-Abweichler oben**: „Daddy Spritz @ Crown & Anchor +110 %"
- ⚠️ **Größte Lücke**: „Daddy Spritz @ Foggy Dog −88 %"
- 📊 **Streuung gesamt**: Ø Spreizung über alle Produkte (Indikator für Sortiments­konsistenz)

## Daten

Datenquelle: `SALES_BY_PUB` (existiert bereits, enthält `topSellers` pro Pub mit Name/Kategorie/Qty/Revenue).

Neue Helper in `src/lib/sales-mock.ts`:
- `getProductMatrix()` → liefert `{ products: TopSeller[], byPub: Record<pubId, Record<productName, {qty, revenue}>>, avgQty: Record<productName, number> }`.
- Reine Aggregations-Funktion, keine Mock-Änderung nötig — die echte Pub-&-Go-Karte ist schon drin.

## Dateien

- **Neu**: `src/components/sortiment-matrix.tsx` — die Heatmap-Komponente.
- **Bearbeiten**: `src/lib/sales-mock.ts` — Helper `getProductMatrix()` exportieren.
- **Bearbeiten**: `src/routes/hq.index.tsx` — `<SortimentMatrix />` unter dem bestehenden `<Sortiment />` im Tab einbinden.

## Bewusst NICHT enthalten

- Keine Änderung an der Filial-Detailseite (`hq.$pubId.tsx`) — dort bleibt das einzelne Sortiment wie gehabt.
- Keine neuen Tabs/Routen.
- Keine Zeitreihen pro Produkt × Filiale (zu viel Daten für den Mehrwert hier).

## Responsives Verhalten

- ≥ `md`: volle Heatmap, alle Filialen sichtbar.
- `<md`: horizontal scrollbar im Container, erste Spalte (Produktname) sticky links — übliches Tabellen-Pattern, kein Card-Stacking.

## Akzeptanzkriterien

1. Tab „Sortiment" zeigt unter der bestehenden Liste eine Heatmap mit allen 11 Produkten × allen Pubs.
2. Farbcodierung folgt der oben definierten Schwelle, lesbar in Light & Dark Mode (semantische Tokens).
3. Kategorie-Filter funktioniert und wirkt auf Heatmap + Insights-Chips.
4. Klick auf einen Spaltenkopf öffnet die Filial-Detailseite.
5. Insights-Leiste zeigt korrekt Top-Abweichler / größte Lücke automatisch berechnet.
6. Mobile: horizontales Scrollen funktioniert, Produktspalte bleibt sichtbar.
