import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGS, type Lang } from "@/lib/i18n";

const LABELS: Record<Lang, string> = { de: "Deutsch", en: "English" };
const SHORT: Record<Lang, string> = { de: "DE", en: "EN" };

export function LanguageSwitcher({ compact = true }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  // Avoid SSR/client hydration mismatch: server renders fallback ("de"),
  // but the browser detector may resolve to a different language from localStorage.
  // Render the language-dependent bits only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = (mounted ? (i18n.resolvedLanguage as Lang) : "de") ?? "de";

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-md border bg-card h-9 px-2"
      title={mounted ? t("common.language") : undefined}
      suppressHydrationWarning
    >
      <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Select value={current} onValueChange={(v) => i18n.changeLanguage(v)}>
        <SelectTrigger className="h-7 border-0 shadow-none px-1 focus:ring-0 text-xs font-medium w-[58px]">
          <SelectValue>
            <span suppressHydrationWarning>{compact ? SHORT[current] : LABELS[current]}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {SUPPORTED_LANGS.map((l) => (
            <SelectItem key={l} value={l} className="text-sm">
              {LABELS[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
