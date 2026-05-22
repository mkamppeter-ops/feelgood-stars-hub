import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserCog, CalendarRange, Plane, Thermometer, AlertTriangle, Check, X, Users, Search, TrendingUp, TrendingDown } from "lucide-react";
import { useT } from "@/lib/use-t";
import {
  SHIFT_SUMMARY, VACATION_REQUESTS, SICK_LEAVES, SICK_STATS, EMPLOYEES, getPubName,
  type VacationStatus, type EmploymentType,
} from "@/lib/hr-mock";
import { PUBS } from "@/lib/pubs-mock";
import { useRangeLabels, type DateRange } from "@/components/date-range-picker";
import { PubScheduleDialog } from "@/components/hq/pub-schedule-dialog";

// Scale factors relative to the base mock data.
// Shifts base = 1 week; sick stats base = 1 month.
const SHIFT_PERIOD_FACTOR: Record<DateRange, number> = {
  today: 1 / 7,
  yesterday: 1 / 7,
  last7: 1,
  last30: 30 / 7,
  last90: 90 / 7,
  thisMonth: 30 / 7,
  lastMonth: 30 / 7,
  thisQuarter: 90 / 7,
  thisYear: 365 / 7,
  lastYear: 365 / 7,
  custom: 1,
};
const SICK_PERIOD_FACTOR: Record<DateRange, number> = {
  today: 1 / 30,
  yesterday: 1 / 30,
  last7: 7 / 30,
  last30: 1,
  last90: 3,
  thisMonth: 1,
  lastMonth: 1,
  thisQuarter: 3,
  thisYear: 12,
  lastYear: 12,
  custom: 1,
};

export function HROverview({ range = "last7" }: { range?: DateRange } = {}) {
  const tt = useT();
  const rangeLabels = useRangeLabels();
  const [tab, setTab] = useState("employees");
  const [vacations, setVacations] = useState(VACATION_REQUESTS);
  const periodLabel = rangeLabels[range];
  const shiftFactor = SHIFT_PERIOD_FACTOR[range];
  const sickFactor = SICK_PERIOD_FACTOR[range];

  const scaledShifts = useMemo(
    () =>
      SHIFT_SUMMARY.map((s) => ({
        ...s,
        weekTargetHours: Math.round(s.weekTargetHours * shiftFactor),
        weekActualHours: Math.round(s.weekActualHours * shiftFactor),
        openShifts: Math.max(0, Math.round(s.openShifts * shiftFactor)),
      })),
    [shiftFactor]
  );
  const scaledSick = useMemo(
    () =>
      SICK_STATS.map((s) => {
        const sickDaysMonth = Math.max(0, Math.round(s.sickDaysMonth * sickFactor));
        const monthWorkdays = s.staffCount * 22 * sickFactor;
        const ratePct = monthWorkdays > 0 ? +((sickDaysMonth / monthWorkdays) * 100).toFixed(1) : 0;
        return { ...s, sickDaysMonth, ratePct };
      }),
    [sickFactor]
  );

  const totals = useMemo(() => {
    const target = scaledShifts.reduce((s, x) => s + x.weekTargetHours, 0);
    const actual = scaledShifts.reduce((s, x) => s + x.weekActualHours, 0);
    const openShifts = scaledShifts.reduce((s, x) => s + x.openShifts, 0);
    const staff = scaledShifts.reduce((s, x) => s + x.staffCount, 0);
    return { target, actual, openShifts, staff, util: target > 0 ? Math.round((actual / target) * 100) : 0 };
  }, [scaledShifts]);

  const pending = vacations.filter((v) => v.status === "pending");
  const decided = vacations.filter((v) => v.status !== "pending");
  const activeSick = SICK_LEAVES.filter((s) => s.active);

  const decide = (id: string, status: VacationStatus) =>
    setVacations((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{tt("HR-Übersicht", "HR Overview")}</h2>
          <p className="text-xs text-muted-foreground">
            {tt("Dienstpläne, Urlaub & Krankmeldungen über alle Filialen", "Schedules, vacation & sick leave across all branches")}
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label={tt("Mitarbeiter gesamt", "Total staff")} value={String(totals.staff)} />
        <KpiTile
          label={tt("Wochenauslastung", "Weekly utilization")}
          value={`${totals.util}%`}
          tone={totals.util >= 95 ? "emerald" : totals.util >= 85 ? "amber" : "red"}
        />
        <KpiTile
          label={tt("Offene Schichten", "Open shifts")}
          value={String(totals.openShifts)}
          tone={totals.openShifts === 0 ? "emerald" : totals.openShifts > 8 ? "red" : "amber"}
        />
        <KpiTile
          label={tt("Offene Urlaubsanträge", "Pending requests")}
          value={String(pending.length)}
          tone={pending.length > 0 ? "amber" : "emerald"}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {tt("Mitarbeiter", "Employees")}
          </TabsTrigger>
          <TabsTrigger value="shifts" className="gap-1.5">
            <CalendarRange className="h-3.5 w-3.5" />
            {tt("Dienstpläne", "Schedules")}
          </TabsTrigger>
          <TabsTrigger value="vacation" className="gap-1.5">
            <Plane className="h-3.5 w-3.5" />
            {tt("Urlaub", "Vacation")}
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sick" className="gap-1.5">
            <Thermometer className="h-3.5 w-3.5" />
            {tt("Krankheit", "Sick leave")}
            {activeSick.length > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-medium">
                {activeSick.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Employee roster (Crewmeister-style) */}
        <TabsContent value="employees" className="mt-0">
          <EmployeeRoster range={range} periodLabel={periodLabel} shiftFactor={shiftFactor} />
        </TabsContent>

        {/* Schedule overview */}
        <TabsContent value="shifts" className="mt-0">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{tt("Dienstplan-Übersicht", "Schedule overview")}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {tt("Stunden pro Filiale · Soll vs. Ist", "Hours per branch · target vs. actual")} · <span className="font-medium text-foreground">{periodLabel}</span>
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tt("Pub", "Pub")}</TableHead>
                    <TableHead className="text-right">{tt("Mitarbeiter", "Staff")}</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">{tt("Soll (h)", "Target (h)")}</TableHead>
                    <TableHead className="text-right">{tt("Ist (h)", "Actual (h)")}</TableHead>
                    <TableHead className="text-right">{tt("Auslastung", "Utilization")}</TableHead>
                    <TableHead className="text-right">{tt("Offen", "Open")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scaledShifts.map((s) => {
                    if (s.weekTargetHours === 0) return null;
                    const util = Math.round((s.weekActualHours / s.weekTargetHours) * 100);
                    const utilTone = util >= 95 ? "text-emerald-600" : util >= 85 ? "text-foreground" : "text-amber-600";
                    return (
                      <TableRow key={s.pubId}>
                        <TableCell className="font-medium">{getPubName(s.pubId)}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.staffCount}</TableCell>
                        <TableCell className="text-right tabular-nums hidden sm:table-cell text-muted-foreground">{s.weekTargetHours}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.weekActualHours}</TableCell>
                        <TableCell className={`text-right tabular-nums font-semibold ${utilTone}`}>{util}%</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {s.openShifts > 0 ? (
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 tabular-nums">
                              {s.openShifts}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vacation */}
        <TabsContent value="vacation" className="mt-0 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {tt("Offene Urlaubsanträge", "Pending vacation requests")}
                <Badge variant="secondary" className="font-normal">{pending.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
                  {tt("Keine offenen Anträge", "No pending requests")}
                </div>
              )}
              {pending.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{v.employee}</div>
                    <div className="text-xs text-muted-foreground">
                      {getPubName(v.pubId)} · {v.from} – {v.to} · {v.days} {tt("Tage", "days")}
                    </div>
                    {(v.reasonDe || v.reasonEn) && (
                      <div className="text-[11px] text-muted-foreground italic mt-0.5">
                        {tt(v.reasonDe ?? "", v.reasonEn ?? "")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => decide(v.id, "approved")} className="bg-emerald-500 hover:bg-emerald-600 text-white h-8">
                      <Check className="h-3.5 w-3.5 mr-1" />{tt("Genehmigen", "Approve")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(v.id, "rejected")} className="h-8">
                      <X className="h-3.5 w-3.5 mr-1" />{tt("Ablehnen", "Reject")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{tt("Bearbeitet", "Decided")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tt("Mitarbeiter", "Employee")}</TableHead>
                    <TableHead>{tt("Pub", "Pub")}</TableHead>
                    <TableHead>{tt("Zeitraum", "Period")}</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decided.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.employee}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{getPubName(v.pubId)}</TableCell>
                      <TableCell className="text-xs">{v.from} – {v.to} <span className="text-muted-foreground">({v.days}t)</span></TableCell>
                      <TableCell className="text-right">
                        {v.status === "approved" ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                            {tt("Genehmigt", "Approved")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                            {tt("Abgelehnt", "Rejected")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sick leave */}
        <TabsContent value="sick" className="mt-0 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {tt("Aktuell krank", "Currently out sick")}
                <Badge variant="secondary" className="font-normal">{activeSick.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeSick.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
                  {tt("Niemand krank gemeldet", "No active sick leave")}
                </div>
              )}
              {activeSick.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{s.employee}</div>
                    <div className="text-xs text-muted-foreground">
                      {getPubName(s.pubId)} · {tt("seit", "since")} {s.from} · {s.days} {tt("Tag(e)", "day(s)")}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
                    {tt("aktiv", "active")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{tt("Krankheitsquote pro Filiale", "Sick leave rate per branch")}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {tt("Zeitraum", "Period")}: <span className="font-medium text-foreground">{periodLabel}</span>
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tt("Pub", "Pub")}</TableHead>
                    <TableHead className="text-right">{tt("Krankheitstage", "Sick days")}</TableHead>
                    <TableHead className="text-right">{tt("Quote", "Rate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...scaledSick].sort((a, b) => b.ratePct - a.ratePct).map((s) => {
                    const high = s.ratePct >= 5;
                    return (
                      <TableRow key={s.pubId}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {getPubName(s.pubId)}
                          {high && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{s.sickDaysMonth}</TableCell>
                        <TableCell className={`text-right tabular-nums font-semibold ${high ? "text-amber-600" : "text-foreground"}`}>
                          {s.ratePct}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" | "red" }) {
  const toneCls =
    tone === "emerald" ? "text-emerald-600" :
    tone === "amber" ? "text-amber-600" :
    tone === "red" ? "text-red-600" : "text-foreground";
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

const EMP_LABEL: Record<EmploymentType, { de: string; en: string }> = {
  fulltime: { de: "Vollzeit", en: "Full-time" },
  parttime: { de: "Teilzeit", en: "Part-time" },
  minijob: { de: "Minijob", en: "Mini-job" },
  student: { de: "Werkstudent", en: "Student" },
};

function EmployeeRoster({
  range,
  periodLabel,
  shiftFactor,
}: {
  range: DateRange;
  periodLabel: string;
  shiftFactor: number;
}) {
  const tt = useT();
  const [query, setQuery] = useState("");
  const [pubFilter, setPubFilter] = useState<string>("all");
  const [empFilter, setEmpFilter] = useState<string>("all");

  const rows = useMemo(() => {
    return EMPLOYEES
      .filter((e) => pubFilter === "all" || e.pubId === pubFilter)
      .filter((e) => empFilter === "all" || e.employment === empFilter)
      .filter((e) =>
        query.trim() === ""
          ? true
          : e.name.toLowerCase().includes(query.toLowerCase()) ||
            e.role.toLowerCase().includes(query.toLowerCase())
      )
      .map((e) => {
        const target = +(e.contractHoursWeek * shiftFactor).toFixed(1);
        const actual = +(e.avgWorkedHoursWeek * shiftFactor).toFixed(1);
        const diff = +(actual - target).toFixed(1);
        return { ...e, periodTarget: target, periodActual: actual, periodDiff: diff };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, pubFilter, empFilter, shiftFactor]);

  const totals = useMemo(() => {
    const target = rows.reduce((s, r) => s + r.periodTarget, 0);
    const actual = rows.reduce((s, r) => s + r.periodActual, 0);
    const balance = rows.reduce((s, r) => s + r.balanceHours, 0);
    return { target: +target.toFixed(0), actual: +actual.toFixed(0), balance: +balance.toFixed(1) };
  }, [rows]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{tt("Mitarbeiter-Übersicht", "Employee overview")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {tt("Arbeitszeiten, Über-/Minusstunden, Urlaub & Krankheit", "Working time, overtime/minus, vacation & sick days")}
              {" · "}
              <span className="font-medium text-foreground">{periodLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tt("Suche…", "Search…")}
                className="h-8 pl-7 w-[180px]"
              />
            </div>
            <Select value={pubFilter} onValueChange={setPubFilter}>
              <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tt("Alle Filialen", "All branches")}</SelectItem>
                {PUBS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tt("Alle Verträge", "All contracts")}</SelectItem>
                {(Object.keys(EMP_LABEL) as EmploymentType[]).map((k) => (
                  <SelectItem key={k} value={k}>{tt(EMP_LABEL[k].de, EMP_LABEL[k].en)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Totals strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <SumTile label={tt("Personen", "People")} value={String(rows.length)} />
          <SumTile label={tt("Soll im Zeitraum", "Target in period")} value={`${totals.target} h`} />
          <SumTile label={tt("Ist im Zeitraum", "Actual in period")} value={`${totals.actual} h`} />
          <SumTile
            label={tt("Stundenkonto gesamt", "Hours balance total")}
            value={`${totals.balance > 0 ? "+" : ""}${totals.balance} h`}
            tone={totals.balance >= 0 ? "emerald" : "red"}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tt("Mitarbeiter", "Employee")}</TableHead>
                <TableHead className="hidden md:table-cell">{tt("Filiale", "Branch")}</TableHead>
                <TableHead className="hidden lg:table-cell">{tt("Vertrag", "Contract")}</TableHead>
                <TableHead className="text-right">{tt("Soll (h)", "Target (h)")}</TableHead>
                <TableHead className="text-right">{tt("Ist (h)", "Actual (h)")}</TableHead>
                <TableHead className="text-right">{tt("Diff", "Diff")}</TableHead>
                <TableHead className="text-right">{tt("Stundenkonto", "Balance")}</TableHead>
                <TableHead className="text-right hidden sm:table-cell">{tt("Urlaub", "Vacation")}</TableHead>
                <TableHead className="text-right hidden sm:table-cell">{tt("Krank (J.)", "Sick (yr)")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8 text-sm">
                    {tt("Keine Mitarbeiter gefunden", "No employees found")}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => {
                const diffPos = r.periodDiff >= 0;
                const balPos = r.balanceHours >= 0;
                const vacLeft = r.vacationTotalDays - r.vacationUsedDays;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.role}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {getPubName(r.pubId)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="font-normal text-[11px]">
                        {tt(EMP_LABEL[r.employment].de, EMP_LABEL[r.employment].en)} · {r.contractHoursWeek}h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{r.periodTarget}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.periodActual}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${diffPos ? "text-emerald-600" : "text-amber-600"}`}>
                      <span className="inline-flex items-center gap-0.5 justify-end">
                        {diffPos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {diffPos ? "+" : ""}{r.periodDiff}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={`tabular-nums font-medium ${
                          balPos
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                            : "bg-red-500/10 text-red-600 border-red-200"
                        }`}
                      >
                        {balPos ? "+" : ""}{r.balanceHours} h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell text-xs">
                      <span className="text-foreground">{r.vacationUsedDays}</span>
                      <span className="text-muted-foreground">/{r.vacationTotalDays}</span>
                      <div className="text-[10px] text-muted-foreground">{vacLeft} {tt("offen", "left")}</div>
                    </TableCell>
                    <TableCell className={`text-right tabular-nums hidden sm:table-cell ${r.sickDaysYear >= 6 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                      {r.sickDaysYear}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          {tt(
            "Hinweis: Soll/Ist im Zeitraum sind aus den vertraglichen Wochenstunden hochgerechnet. Das Stundenkonto ist der aktuelle Saldo (kumuliert), unabhängig vom Filter.",
            "Note: Target/Actual in period are extrapolated from contractual weekly hours. The hours balance is the current cumulative saldo, independent of the filter."
          )}
          {" "}
          <span className="opacity-70">({range})</span>
        </p>
      </CardContent>
    </Card>
  );
}

function SumTile({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "red" }) {
  const toneCls = tone === "emerald" ? "text-emerald-600" : tone === "red" ? "text-red-600" : "text-foreground";
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}
