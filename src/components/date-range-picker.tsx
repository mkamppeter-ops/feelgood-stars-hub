import { Calendar } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type DateRange = "today" | "yesterday" | "last7" | "thisMonth";

export const RANGE_LABELS: Record<DateRange, string> = {
  today: "Heute",
  yesterday: "Gestern",
  last7: "Letzte 7 Tage",
  thisMonth: "Dieser Monat",
};

// Multiplier applied to KPI numbers to simulate filter effect
export const RANGE_FACTOR: Record<DateRange, number> = {
  today: 0.92,
  yesterday: 0.97,
  last7: 1.0,
  thisMonth: 1.05,
};

export function DateRangePicker({
  value, onChange,
}: { value: DateRange; onChange: (v: DateRange) => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border bg-card shadow-sm pl-3 pr-1 h-9">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as DateRange)}>
        <SelectTrigger className="h-7 border-0 shadow-none px-1 focus:ring-0 text-sm font-medium w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {(Object.keys(RANGE_LABELS) as DateRange[]).map((k) => (
            <SelectItem key={k} value={k}>{RANGE_LABELS[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
