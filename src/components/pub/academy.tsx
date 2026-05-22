import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Gift, CheckCircle2, Clock, Coins, Lock } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";

interface Training {
  id: string;
  titleDe: string;
  titleEn: string;
  duration: string;
  points: number;
  progress: number;
  tone: string;
}

const TRAININGS: Training[] = [
  { id: "t1", titleDe: "Kassensystem 101", titleEn: "POS System 101", duration: "18 min", points: 50, progress: 100, tone: "from-blue-500/20 to-blue-500/5" },
  { id: "t2", titleDe: "Perfekt Zapfen", titleEn: "Perfect Pour", duration: "12 min", points: 80, progress: 70, tone: "from-amber-500/20 to-amber-500/5" },
  { id: "t3", titleDe: "Hygiene-Basics", titleEn: "Hygiene Basics", duration: "25 min", points: 60, progress: 30, tone: "from-emerald-500/20 to-emerald-500/5" },
  { id: "t4", titleDe: "Cocktail-Grundlagen", titleEn: "Cocktail Fundamentals", duration: "32 min", points: 120, progress: 0, tone: "from-violet-500/20 to-violet-500/5" },
  { id: "t5", titleDe: "Gästekommunikation", titleEn: "Guest Communication", duration: "20 min", points: 70, progress: 0, tone: "from-rose-500/20 to-rose-500/5" },
  { id: "t6", titleDe: "Inventur leicht gemacht", titleEn: "Easy Inventory", duration: "15 min", points: 40, progress: 0, tone: "from-cyan-500/20 to-cyan-500/5" },
];

const REWARDS = [
  { de: "10€ Gutschein", en: "€10 Voucher", cost: 200, icon: "🎫" },
  { de: "Pub&Go T-Shirt", en: "Pub&Go T-Shirt", cost: 350, icon: "👕" },
  { de: "Freie Schicht (4h)", en: "Free shift (4h)", cost: 500, icon: "🛌" },
  { de: "Cocktail-Kurs", en: "Cocktail course", cost: 800, icon: "🍸" },
  { de: "Wochenende-Gutschein", en: "Weekend voucher", cost: 1200, icon: "🏖️" },
];

export function Academy() {
  const tt = useT();
  const [points, setPoints] = useState(450);

  const claim = (cost: number, label: string) => {
    if (cost > points) {
      toast.error(tt("Nicht genug Punkte", "Not enough points"));
      return;
    }
    setPoints((p) => p - cost);
    toast.success(tt(`Eingelöst: ${label}`, `Redeemed: ${label}`));
  };

  return (
    <div className="space-y-5">
      {/* Gamification banner */}
      <Card className="overflow-hidden relative border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <CardContent className="p-5 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Coins className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Dein Punktestand", "Your points")}</div>
              <div className="text-3xl font-bold tabular-nums leading-tight">{points} <span className="text-base font-normal text-muted-foreground">🪙</span></div>
              <div className="text-xs text-muted-foreground mt-0.5">{tt("Lerne weiter und sammle Coins!", "Keep learning to earn coins!")}</div>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button><Gift className="h-4 w-4 mr-1.5" />{tt("Belohnungen", "Rewards")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tt("Belohnungen einlösen", "Redeem rewards")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {REWARDS.map((r) => {
                  const can = points >= r.cost;
                  const label = tt(r.de, r.en);
                  return (
                    <div key={r.de} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xl">{r.icon}</div>
                        <div>
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-xs text-muted-foreground">{r.cost} 🪙</div>
                        </div>
                      </div>
                      <Button size="sm" variant={can ? "default" : "outline"} disabled={!can} onClick={() => claim(r.cost, label)}>
                        {can ? tt("Einlösen", "Redeem") : <><Lock className="h-3 w-3 mr-1" />{tt("Gesperrt", "Locked")}</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold tracking-tight">{tt("Trainings", "Trainings")}</h2>
        <p className="text-sm text-muted-foreground">{tt("Kurze Videos, sofort anwendbar", "Short videos, immediately applicable")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRAININGS.map((tr) => {
          const done = tr.progress >= 100;
          return (
            <Card key={tr.id} className="shadow-sm overflow-hidden">
              <div className={`relative h-32 bg-gradient-to-br ${tr.tone} flex items-center justify-center`}>
                <div className="h-12 w-12 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-sm">
                  {done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Play className="h-5 w-5 text-primary ml-0.5" />}
                </div>
                {done && (
                  <Badge className="absolute top-2 right-2 bg-emerald-500/15 text-emerald-700 border-0">{tt("Abgeschlossen", "Completed")}</Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <div className="text-sm font-semibold leading-tight">{tt(tr.titleDe, tr.titleEn)}</div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tr.duration}</span>
                    <span className="flex items-center gap-1"><Coins className="h-3 w-3" />{tr.points}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={tr.progress} className="h-1.5" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{tr.progress}%</span>
                    <Button size="sm" variant={done ? "outline" : "default"} className="h-7 text-xs">
                      {done ? tt("Wiederholen", "Replay") : tr.progress > 0 ? tt("Weiterlernen", "Continue") : tt("Starten", "Start")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
