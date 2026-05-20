import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Beer, User, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession, getSession, defaultRouteForRole, type Role } from "@/lib/auth-mock";
import { PUBS } from "@/lib/pubs-mock";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — Pub&Go" },
      { name: "description", content: "Melde dich an, um auf dein Pub&Go Dashboard zuzugreifen." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    const s = getSession();
    if (s) navigate({ to: defaultRouteForRole(s.role) });
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.info("Demo-Modus", {
      description: "Bitte nutze einen der Rollen-Buttons unten, um dich anzumelden.",
    });
  }

  function loginAs(role: Role) {
    // Demo: assign a fixed pub to non-HQ roles
    const pubId = role === "hq_admin" ? undefined : PUBS[2].id;
    setSession(role, pubId);
    navigate({ to: defaultRouteForRole(role) });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-muted/40 to-background">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-lg tracking-tight">P&G</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Pub&Go</h1>
          <p className="text-sm text-muted-foreground">Operations Console</p>
        </div>

        <Card className="p-6 shadow-xl border-border/60">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-foreground">Willkommen zurück</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Melde dich an, um auf dein Dashboard zuzugreifen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="du@pubandgo.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <button
                  type="button"
                  onClick={() => toast.info("Demo-Modus", { description: "Passwort-Reset ist im Demo-Modus deaktiviert." })}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Passwort vergessen?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                oder Demo-Zugang
              </span>
            </div>
          </div>

          {/* Demo role buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-3 h-11"
              onClick={() => loginAs("hq_admin")}
            >
              <Building2 className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">Login als HQ Admin</span>
              <span className="text-xs text-muted-foreground">/hq</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-3 h-11"
              onClick={() => loginAs("pub_manager")}
            >
              <Beer className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">Login als Pub Manager</span>
              <span className="text-xs text-muted-foreground">/pub</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-3 h-11"
              onClick={() => loginAs("bar_staff")}
            >
              <User className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">Login als Bar Staff</span>
              <span className="text-xs text-muted-foreground">/pub</span>
            </Button>
          </div>
        </Card>

        <div className="mt-6 text-center space-y-3">
          <a
            href="/feedback"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            🍺 Als Gast Feedback geben (QR-Demo)
          </a>
          <p className="text-xs text-muted-foreground">
            Demo-Modus · keine echte Authentifizierung
          </p>
        </div>
      </div>
    </div>
  );
}
