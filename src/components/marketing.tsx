import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Megaphone, Users, Euro, TrendingDown, Activity, AlertCircle } from "lucide-react";
import { PUBS } from "@/lib/pubs-mock";
import { formatEUR } from "@/lib/sales-mock";
import { useT } from "@/lib/use-t";
import { getPlausibleRegistrations } from "@/lib/plausible.functions";

type Period = "7d" | "30d" | "month";

// Map Plausible utm_source values → internal channel keys
const UTM_TO_CHANNEL: Record<string, ChannelKey> = {
  meta: "meta", facebook: "meta", instagram: "meta", fb: "meta", ig: "meta",
  google: "google", googleads: "google", google_ads: "google", adwords: "google",
  tiktok: "tiktok", tt: "tiktok",
  paid_newsletter: "paid_newsletter", paidnewsletter: "paid_newsletter",
  united_internet: "united_internet", unitedinternet: "united_internet", web_de: "united_internet", gmx: "united_internet",
  direct: "direct", "(direct)": "direct", "": "direct",
  whatsapp: "whatsapp", wa: "whatsapp",
  newsletter: "newsletter", crm: "newsletter", email: "newsletter",
};

type ChannelGroup = "paid" | "crm";
type ChannelKey =
  | "meta" | "google" | "tiktok" | "paid_newsletter" | "united_internet" | "direct"
  | "whatsapp" | "newsletter";

type Channel = {
  key: ChannelKey;
  group: ChannelGroup;
  label: string;
};

const CHANNELS: Channel[] = [
  { key: "meta",            group: "paid", label: "Meta" },
  { key: "google",          group: "paid", label: "Google" },
  { key: "tiktok",          group: "paid", label: "TikTok" },
  { key: "paid_newsletter", group: "paid", label: "Paid Newsletter" },
  { key: "united_internet", group: "paid", label: "United Internet" },
  { key: "direct",          group: "paid", label: "Direct" },
  { key: "whatsapp",        group: "crm",  label: "WhatsApp" },
  { key: "newsletter",      group: "crm",  label: "Newsletter" },
];

// Deterministic mock seed per pub + channel
function seeded(pubId: string, channel: ChannelKey) {
  let h = 0;
  const s = `${pubId}::${channel}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const r = Math.abs(Math.sin(h)) ;
  return r - Math.floor(r);
}

function spendFor(pubId: string, channel: Channel): number {
  const base: Record<ChannelKey, number> = {
    meta: 1800, google: 2200, tiktok: 900, paid_newsletter: 600,
    united_internet: 450, direct: 350,
    whatsapp: 180, newsletter: 220,
  };
  const jitter = 0.55 + seeded(pubId, channel.key) * 0.9; // 0.55–1.45
  return Math.round(base[channel.key] * jitter);
}

function cprFor(channel: Channel): number {
  // EUR per registration assumption per channel
  const cpr: Record<ChannelKey, number> = {
    meta: 4.5, google: 3.8, tiktok: 6.2, paid_newsletter: 5.5,
    united_internet: 7.0, direct: 2.5,
    whatsapp: 1.2, newsletter: 1.8,
  };
  return cpr[channel.key];
}

type Row = {
  pubId: string;
  pubName: string;
  city: string;
  byChannel: Record<ChannelKey, { spend: number; registrations: number }>;
  spendPaid: number;
  spendCrm: number;
  spendTotal: number;
  regsPaid: number;
  regsCrm: number;
  regsTotal: number;
};

function useMarketingData(): { rows: Row[]; totals: Row } {
  return useMemo(() => {
    const rows: Row[] = PUBS.map((p) => {
      const byChannel = {} as Row["byChannel"];
      let spendPaid = 0, spendCrm = 0, regsPaid = 0, regsCrm = 0;
      for (const c of CHANNELS) {
        const spend = spendFor(p.id, c);
        const registrations = Math.max(1, Math.round(spend / cprFor(c)));
        byChannel[c.key] = { spend, registrations };
        if (c.group === "paid") { spendPaid += spend; regsPaid += registrations; }
        else { spendCrm += spend; regsCrm += registrations; }
      }
      return {
        pubId: p.id, pubName: p.name, city: p.city, byChannel,
        spendPaid, spendCrm, spendTotal: spendPaid + spendCrm,
        regsPaid, regsCrm, regsTotal: regsPaid + regsCrm,
      };
    });

    const totals: Row = {
      pubId: "__all__", pubName: "Total", city: "",
      byChannel: {} as Row["byChannel"],
      spendPaid: 0, spendCrm: 0, spendTotal: 0,
      regsPaid: 0, regsCrm: 0, regsTotal: 0,
    };
    for (const c of CHANNELS) {
      totals.byChannel[c.key] = { spend: 0, registrations: 0 };
    }
    for (const r of rows) {
      for (const c of CHANNELS) {
        totals.byChannel[c.key].spend += r.byChannel[c.key].spend;
        totals.byChannel[c.key].registrations += r.byChannel[c.key].registrations;
      }
      totals.spendPaid += r.spendPaid; totals.spendCrm += r.spendCrm;
      totals.spendTotal += r.spendTotal;
      totals.regsPaid += r.regsPaid; totals.regsCrm += r.regsCrm;
      totals.regsTotal += r.regsTotal;
    }
    return { rows, totals };
  }, []);
}

function KpiCard({
  icon: Icon, label, value, sub, tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone?: "primary" | "emerald" | "amber" | "violet";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
  } as const;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Marketing() {
  const tt = useT();
  const { rows, totals } = useMarketingData();
  const [scope, setScope] = useState<"all" | string>("all");

  const current = scope === "all" ? totals : rows.find((r) => r.pubId === scope) ?? totals;
  const cpr = current.regsTotal > 0 ? current.spendTotal / current.regsTotal : 0;
  const paidCpr = current.regsPaid > 0 ? current.spendPaid / current.regsPaid : 0;
  const crmCpr = current.regsCrm > 0 ? current.spendCrm / current.regsCrm : 0;

  return (
    <div className="space-y-6">
      {/* Scope selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{tt("Bereich", "Scope")}:</span>
        <button
          onClick={() => setScope("all")}
          className={`px-3 py-1.5 text-xs rounded-md border ${
            scope === "all" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
          }`}
        >
          {tt("Gesamt (alle Stores)", "Total (all stores)")}
        </button>
        {rows.map((r) => (
          <button
            key={r.pubId}
            onClick={() => setScope(r.pubId)}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              scope === r.pubId ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
          >
            {r.pubName}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={Euro}
          tone="primary"
          label={tt("Marketing-Investment gesamt", "Total marketing spend")}
          value={formatEUR(current.spendTotal)}
          sub={tt(
            `Paid ${formatEUR(current.spendPaid)} · CRM ${formatEUR(current.spendCrm)}`,
            `Paid ${formatEUR(current.spendPaid)} · CRM ${formatEUR(current.spendCrm)}`,
          )}
        />
        <KpiCard
          icon={Users}
          tone="emerald"
          label={tt("Neue Registrierungen", "New registrations")}
          value={current.regsTotal.toLocaleString()}
          sub={tt(
            `Paid ${current.regsPaid.toLocaleString()} · CRM ${current.regsCrm.toLocaleString()}`,
            `Paid ${current.regsPaid.toLocaleString()} · CRM ${current.regsCrm.toLocaleString()}`,
          )}
        />
        <KpiCard
          icon={TrendingDown}
          tone="violet"
          label={tt("Kosten pro Registrierung", "Cost per registration")}
          value={formatEUR(+cpr.toFixed(2))}
          sub={tt(
            `Paid ${formatEUR(+paidCpr.toFixed(2))} · CRM ${formatEUR(+crmCpr.toFixed(2))}`,
            `Paid ${formatEUR(+paidCpr.toFixed(2))} · CRM ${formatEUR(+crmCpr.toFixed(2))}`,
          )}
        />
        <KpiCard
          icon={Megaphone}
          tone="amber"
          label={tt("Aktive Channels", "Active channels")}
          value={String(CHANNELS.length)}
          sub={tt("6 Paid/Direct · 2 CRM", "6 Paid/Direct · 2 CRM")}
        />
      </section>

      {/* Channel breakdown */}
      <Tabs defaultValue="paid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="paid">{tt("Paid / Direct", "Paid / Direct")}</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="all">{tt("Alle Channels", "All channels")}</TabsTrigger>
        </TabsList>

        {(["paid", "crm", "all"] as const).map((group) => {
          const channels = group === "all" ? CHANNELS : CHANNELS.filter((c) => c.group === group);
          return (
            <TabsContent key={group} value={group} className="mt-0">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {group === "paid"
                        ? tt("Paid / Direct Channels", "Paid / Direct channels")
                        : group === "crm"
                        ? tt("CRM Channels", "CRM channels")
                        : tt("Alle Channels", "All channels")}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {scope === "all"
                        ? tt("Gesamt über alle Stores", "Totals across all stores")
                        : current.pubName}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-normal">
                    {channels.length} {tt("Channels", "channels")}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tt("Channel", "Channel")}</TableHead>
                        <TableHead>{tt("Typ", "Type")}</TableHead>
                        <TableHead className="text-right">{tt("Investment", "Spend")}</TableHead>
                        <TableHead className="text-right">{tt("Registrierungen", "Registrations")}</TableHead>
                        <TableHead className="text-right">{tt("Kosten / Reg.", "Cost / reg.")}</TableHead>
                        <TableHead className="text-right hidden md:table-cell">{tt("Anteil Spend", "Share of spend")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((c) => {
                        const ch = current.byChannel[c.key];
                        const cprCh = ch.registrations > 0 ? ch.spend / ch.registrations : 0;
                        const share = current.spendTotal > 0 ? (ch.spend / current.spendTotal) * 100 : 0;
                        return (
                          <TableRow key={c.key}>
                            <TableCell className="font-medium">{c.label}</TableCell>
                            <TableCell>
                              <Badge variant={c.group === "paid" ? "default" : "secondary"} className="font-normal">
                                {c.group === "paid" ? tt("Paid", "Paid") : "CRM"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">{formatEUR(ch.spend)}</TableCell>
                            <TableCell className="text-right tabular-nums">{ch.registrations.toLocaleString()}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatEUR(+cprCh.toFixed(2))}</TableCell>
                            <TableCell className="text-right tabular-nums hidden md:table-cell text-muted-foreground">{share.toFixed(1)}%</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/40 font-medium">
                        <TableCell>{tt("Summe", "Total")}</TableCell>
                        <TableCell />
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatEUR(channels.reduce((s, c) => s + current.byChannel[c.key].spend, 0))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {channels.reduce((s, c) => s + current.byChannel[c.key].registrations, 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {(() => {
                            const sp = channels.reduce((s, c) => s + current.byChannel[c.key].spend, 0);
                            const rg = channels.reduce((s, c) => s + current.byChannel[c.key].registrations, 0);
                            return formatEUR(rg > 0 ? +(sp / rg).toFixed(2) : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden md:table-cell" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Per-store breakdown (only in total view) */}
      {scope === "all" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{tt("Pro Store", "Per store")}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {tt("Investment, Registrierungen und Kosten je Store", "Spend, registrations and cost per store")}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">{tt("Spend Paid", "Spend paid")}</TableHead>
                  <TableHead className="text-right">{tt("Spend CRM", "Spend CRM")}</TableHead>
                  <TableHead className="text-right">{tt("Spend gesamt", "Spend total")}</TableHead>
                  <TableHead className="text-right">{tt("Registrierungen", "Registrations")}</TableHead>
                  <TableHead className="text-right">{tt("Kosten / Reg.", "Cost / reg.")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rows].sort((a, b) => b.spendTotal - a.spendTotal).map((r) => {
                  const cprR = r.regsTotal > 0 ? r.spendTotal / r.regsTotal : 0;
                  return (
                    <TableRow key={r.pubId}>
                      <TableCell>
                        <div className="font-medium">{r.pubName}</div>
                        <div className="text-xs text-muted-foreground">{r.city}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatEUR(r.spendPaid)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatEUR(r.spendCrm)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{formatEUR(r.spendTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.regsTotal.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatEUR(+cprR.toFixed(2))}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/40 font-medium">
                  <TableCell>{tt("Summe", "Total")}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatEUR(totals.spendPaid)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatEUR(totals.spendCrm)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{formatEUR(totals.spendTotal)}</TableCell>
                  <TableCell className="text-right tabular-nums">{totals.regsTotal.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEUR(totals.regsTotal > 0 ? +(totals.spendTotal / totals.regsTotal).toFixed(2) : 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
