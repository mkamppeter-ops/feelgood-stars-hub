import { Navigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useSession, clearSession, type Role } from "@/lib/auth-mock";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const session = useSession();
  if (!session) return <Navigate to="/" />;
  if (!roles.includes(session.role)) return <Navigate to="/" />;
  return <>{children}</>;
}

export function LogoutButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const session = useSession();
  if (!session) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => {
        clearSession();
        window.location.href = "/";
      }}
      title={`${t("common.loggedInAs")} ${t(`roles.${session.role}`)}`}
    >
      <LogOut className="h-4 w-4 mr-1.5" />
      <span className="hidden sm:inline">{t("common.logout")}</span>
    </Button>
  );
}
