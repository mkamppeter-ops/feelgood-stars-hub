import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Building2, Beer, User, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession, getSession, defaultRouteForRole, type Role } from "@/lib/auth-mock";
import { PUBS } from "@/lib/pubs-mock";
import { LanguageSwitcher } from "@/components/language-switcher";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — Pub&Go" },
      { name: "description", content: "Sign in to access your Pub&Go dashboard." },
    ],
  }),
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) navigate({ to: defaultRouteForRole(s.role) });
  }, [navigate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.info(t("login.demoMode"), { description: t("login.demoModeRoles") });
  }

  function loginAs(role: Role) {
    const pubId = role === "hq_admin" ? undefined : PUBS[2].id;
    setSession(role, pubId);
    navigate({ to: defaultRouteForRole(role) });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-muted/40 to-background">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-lg tracking-tight">P&G</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{t("common.appName")}</h1>
          <p className="text-sm text-muted-foreground">{t("common.subtitle")}</p>
        </div>

        <Card className="p-6 shadow-xl border-border/60">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-foreground">{t("login.welcome")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("login.description")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@pubandgo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.password")}</Label>
                <button
                  type="button"
                  onClick={() => toast.info(t("login.demoMode"), { description: t("login.demoResetDisabled") })}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("login.forgot")}
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
                  aria-label={showPw ? t("login.hidePw") : t("login.showPw")}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              {t("login.submit")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                {t("login.demoDivider")}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => loginAs("hq_admin")}>
              <Building2 className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">{t("login.loginAs", { role: t("roles.hq_admin") })}</span>
              <span className="text-xs text-muted-foreground">/hq</span>
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => loginAs("pub_manager")}>
              <Beer className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">{t("login.loginAs", { role: t("roles.pub_manager") })}</span>
              <span className="text-xs text-muted-foreground">/pub</span>
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start gap-3 h-11" onClick={() => loginAs("bar_staff")}>
              <User className="h-4 w-4 text-primary" />
              <span className="flex-1 text-left">{t("login.loginAs", { role: t("roles.bar_staff") })}</span>
              <span className="text-xs text-muted-foreground">/pub</span>
            </Button>
          </div>
        </Card>

        <div className="mt-6 text-center space-y-3">
          <a
            href="/feedback"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            {t("login.guestQR")}
          </a>
          <p className="text-xs text-muted-foreground">{t("login.noAuth")}</p>
        </div>
      </div>
    </div>
  );
}
