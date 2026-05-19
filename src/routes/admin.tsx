import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, Copy } from "lucide-react";

const PROJECT_REF = "mlrbsgkrptbucbmuanrb";
const CONNECTION_DETAILS: { label: string; value: string; hint?: string }[] = [
  { label: "Host (Transaction Pooler, empfohlen)", value: `aws-0-eu-central-1.pooler.supabase.com`, hint: "Region ggf. im Backend prüfen" },
  { label: "Host (Direct)", value: `db.${PROJECT_REF}.supabase.co` },
  { label: "Port (Pooler)", value: "6543" },
  { label: "Port (Direct)", value: "5432" },
  { label: "Database", value: "postgres" },
  { label: "User (Pooler)", value: `postgres.${PROJECT_REF}` },
  { label: "User (Direct)", value: "postgres" },
];

function CopyButton({ value }: { value: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success("Kopiert");
      }}
    >
      <Copy /> Kopieren
    </Button>
  );
}

function ConnectionDetails() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Make.com – PostgreSQL Connection</CardTitle>
        <p className="text-xs text-muted-foreground">
          Passwort separat im Backend unter Project Settings → Database setzen/zurücksetzen.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {CONNECTION_DETAILS.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{d.label}</p>
              <p className="truncate font-mono text-sm">{d.value}</p>
              {d.hint && <p className="text-xs text-muted-foreground">{d.hint}</p>}
            </div>
            <CopyButton value={d.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin – Feedback" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Feedback = {
  id: string;
  created_at: string;
  location: string | null;
  rating_drinks: number | null;
  rating_atmosphere: number | null;
  rating_service: number | null;
  rating_cleanliness: number | null;
  problem_tags: string[];
  free_text: string | null;
  photo_url: string | null;
  status: string;
};

function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-sm">–</span>;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function statusVariant(status: string) {
  if (status === "approved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

function AdminPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load feedbacks:", error);
      toast.error("Fehler beim Laden", { description: error.message });
      setLoading(false);
      return;
    }
    setItems((data ?? []) as Feedback[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("feedbacks")
      .update({ status })
      .eq("id", id);
    setUpdatingId(null);

    if (error) {
      console.error("Update failed:", error);
      toast.error("Aktualisierung fehlgeschlagen", { description: error.message });
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    toast.success(status === "approved" ? "Freigegeben" : "Abgelehnt");
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Feedback Admin</h1>
            <p className="text-muted-foreground text-sm">Interne Übersicht für das Qualitäts-Team</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Lädt…" : "Aktualisieren"}
          </Button>
        </header>

        <ConnectionDetails />

        {loading ? (
          <p className="text-muted-foreground">Lade Einträge…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">Keine Feedback-Einträge vorhanden.</p>
        ) : (
          <div className="space-y-4">
            {items.map((f) => (
              <Card key={f.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{f.location ?? "Unbekannte Filiale"}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(f.created_at).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <Badge variant={statusVariant(f.status)}>{f.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Getränke</p>
                      <Stars value={f.rating_drinks} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Atmosphäre</p>
                      <Stars value={f.rating_atmosphere} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <Stars value={f.rating_service} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sauberkeit</p>
                      <Stars value={f.rating_cleanliness} />
                    </div>
                  </div>

                  {f.problem_tags && f.problem_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {f.problem_tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {f.free_text && (
                    <p className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{f.free_text}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => updateStatus(f.id, "approved")}
                      disabled={updatingId === f.id || f.status === "approved"}
                    >
                      Freigeben
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(f.id, "rejected")}
                      disabled={updatingId === f.id || f.status === "rejected"}
                    >
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
