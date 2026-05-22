import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateRange as CalendarRange } from "react-day-picker";

export type DateRange =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "last90"
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "thisYear"
  | "lastYear"
  | "custom";

// Multiplier applied to KPI numbers to simulate filter effect.
// 1.0 = baseline (last 7 days). Larger ranges scale up, smaller down.
export const RANGE_FACTOR: Record<DateRange, number> = {
  today: 0.18,
  yesterday: 0.2,
  last7: 1.0,
  last30: 4.1,
  last90: 11.8,
  thisMonth: 4.3,
  lastMonth: 4.2,
  thisQuarter: 12.6,
  thisYear: 46,
  lastYear: 52,
  custom: 1.0,
};

export const RANGE_LABELS: Record<DateRange, string> = {
  today: "Heute",
  yesterday: "Gestern",
  last7: "Letzte 7 Tage",
  last30: "Letzte 30 Tage",
  last90: "Letzte 90 Tage",
  thisMonth: "Dieser Monat",
  lastMonth: "Letzter Monat",
  thisQuarter: "Dieses Quartal",
  thisYear: "Dieses Jahr",
  lastYear: "Letztes Jahr",
  custom: "Benutzerdefiniert…",
};

export function useRangeLabels(): Record<DateRange, string> {
  const { t } = useTranslation();
  return {
    today: t("date.today"),
    yesterday: t("date.yesterday"),
    last7: t("date.last7"),
    last30: t("date.last30"),
    last90: t("date.last90"),
    thisMonth: t("date.thisMonth"),
    lastMonth: t("date.lastMonth"),
    thisQuarter: t("date.thisQuarter"),
    thisYear: t("date.thisYear"),
    lastYear: t("date.lastYear"),
    custom: t("date.custom"),
  };
}

export interface CustomDateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (v: DateRange, custom?: CustomDateRange) => void;
  customRange?: CustomDateRange;
}

export function DateRangePicker({ value, onChange, customRange }: DateRangePickerProps) {
  const labels = useRangeLabels();
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("de") ? de : enUS;
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<CalendarRange | undefined>(
    customRange?.from ? { from: customRange.from, to: customRange.to } : undefined
  );

  useEffect(() => {
    if (customRange?.from) setDraft({ from: customRange.from, to: customRange.to });
  }, [customRange?.from, customRange?.to]);

  const customLabel = useMemo(() => {
    if (value !== "custom" || !customRange?.from) return labels.custom;
    const f = format(customRange.from, "dd.MM.yyyy", { locale });
    const t = customRange.to ? format(customRange.to, "dd.MM.yyyy", { locale }) : f;
    return `${f} – ${t}`;
  }, [value, customRange, labels.custom, locale]);

  const triggerLabel = value === "custom" ? customLabel : labels[value];

  const handleChange = (v: string) => {
    if (v === "custom") {
      setCustomOpen(true);
      return;
    }
    onChange(v as DateRange);
  };

  const applyCustom = () => {
    if (draft?.from) {
      onChange("custom", { from: draft.from, to: draft.to ?? draft.from });
      setCustomOpen(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-card shadow-sm pl-3 pr-1 h-9">
      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="h-7 border-0 shadow-none px-1 focus:ring-0 text-sm font-medium w-[180px]">
          <SelectValue>{triggerLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[200px]">
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels.today.startsWith("H") ? "Tage" : "Days"}
            </SelectLabel>
            <SelectItem value="today">{labels.today}</SelectItem>
            <SelectItem value="yesterday">{labels.yesterday}</SelectItem>
            <SelectItem value="last7">{labels.last7}</SelectItem>
            <SelectItem value="last30">{labels.last30}</SelectItem>
            <SelectItem value="last90">{labels.last90}</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels.thisMonth.startsWith("D") ? "Monat & Quartal" : "Month & quarter"}
            </SelectLabel>
            <SelectItem value="thisMonth">{labels.thisMonth}</SelectItem>
            <SelectItem value="lastMonth">{labels.lastMonth}</SelectItem>
            <SelectItem value="thisQuarter">{labels.thisQuarter}</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {labels.thisYear.startsWith("D") ? "Jahr" : "Year"}
            </SelectLabel>
            <SelectItem value="thisYear">{labels.thisYear}</SelectItem>
            <SelectItem value="lastYear">{labels.lastYear}</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="custom">{labels.custom}</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-hidden className="sr-only" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={2}
            locale={locale}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          <div className="flex items-center justify-between gap-2 border-t p-2">
            <div className="text-xs text-muted-foreground px-1">
              {draft?.from
                ? `${format(draft.from, "dd.MM.yyyy", { locale })}${
                    draft.to ? " – " + format(draft.to, "dd.MM.yyyy", { locale }) : ""
                  }`
                : locale === de
                  ? "Zeitraum wählen"
                  : "Select a range"}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>
                {locale === de ? "Abbrechen" : "Cancel"}
              </Button>
              <Button size="sm" onClick={applyCustom} disabled={!draft?.from}>
                {locale === de ? "Übernehmen" : "Apply"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
