import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Package, Sparkles, Instagram, Image as ImageIcon, Film, FileText } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";

const DIGITAL = [
  { id: "d1", de: "Happy Hour – Instagram Story", en: "Happy Hour – Instagram Story", icon: Instagram, tone: "from-pink-500/20 to-purple-500/10" },
  { id: "d2", de: "Wochenkarte – IG Post", en: "Weekly menu – IG Post", icon: ImageIcon, tone: "from-amber-500/20 to-orange-500/10" },
  { id: "d3", de: "Live-Musik Reel-Cover", en: "Live music reel cover", icon: Film, tone: "from-violet-500/20 to-indigo-500/10" },
  { id: "d4", de: "Brunch Sonntag – Story", en: "Sunday brunch – Story", icon: Instagram, tone: "from-emerald-500/20 to-teal-500/10" },
];

const PRINT = [
  { id: "p1", de: "Bierdeckel (100 Stk.)", en: "Beer coasters (100 pcs)", stock: 240, icon: "🍺" },
  { id: "p2", de: "Tischaufsteller A6", en: "Table standee A6", stock: 18, icon: "📋" },
  { id: "p3", de: "Plakat A3 – Aktion", en: "Poster A3 – Promo", stock: 6, icon: "🖼️" },
  { id: "p4", de: "Flyer DIN lang", en: "Flyer DL", stock: 320, icon: "📰" },
];

export function MarketingHub() {
  const tt = useT();

  return (
    <div className="space-y-5">
      {/* Campaign highlight */}
      <Card className="overflow-hidden relative border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent pointer-events-none" />
        <CardContent className="p-5 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Aktuelle Kampagne", "Current campaign")}</div>
              <div className="text-2xl font-bold tracking-tight leading-tight">Happy Hour 🍻</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tt("17–19 Uhr · gültig bis 30.06.", "5–7 PM · valid until June 30")}
              </div>
            </div>
          </div>
          <Button onClick={() => toast.info(tt("Material wird geladen…", "Loading material…"))}>
            {tt("Material ansehen", "View material")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Digital templates */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{tt("Digitale Vorlagen", "Digital templates")}</h2>
            <p className="text-xs text-muted-foreground">{tt("Social-Media-ready, anpassbar mit eurem Logo", "Social-media-ready, customizable with your logo")}</p>
          </div>
          <div className="space-y-2">
            {DIGITAL.map((d) => {
              const Icon = d.icon;
              return (
                <Card key={d.id} className="shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-md bg-gradient-to-br ${d.tone} flex items-center justify-center shrink-0`}>
                      <Icon className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tt(d.de, d.en)}</div>
                      <div className="text-[11px] text-muted-foreground">PNG · 1080×1920</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => toast.success(tt("Download gestartet", "Download started"))}>
                      <Download className="h-3.5 w-3.5 mr-1" />{tt("Download", "Download")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Print */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{tt("Print bestellen", "Order print")}</h2>
            <p className="text-xs text-muted-foreground">{tt("Lieferung an deinen Standort in 3–5 Werktagen", "Delivery to your location in 3–5 business days")}</p>
          </div>
          <div className="space-y-2">
            {PRINT.map((p) => {
              const low = p.stock < 20;
              return (
                <Card key={p.id} className="shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-2xl shrink-0">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{tt(p.de, p.en)}</div>
                      <div className="flex items-center gap-2 text-[11px] mt-0.5">
                        <span className="text-muted-foreground">{tt("Bestand", "Stock")}: <span className="tabular-nums font-medium">{p.stock}</span></span>
                        {low && <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 h-4 text-[10px]">{tt("Niedrig", "Low")}</Badge>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => toast.success(tt("Nachbestellung ausgelöst", "Reorder placed"))}>
                      <Package className="h-3.5 w-3.5 mr-1" />{tt("Nachbestellen", "Reorder")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            <Card className="shadow-sm border-dashed">
              <CardContent className="p-3 flex items-center gap-3 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-xs">{tt("Individuelles Material anfragen", "Request custom material")}</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
