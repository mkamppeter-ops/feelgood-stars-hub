import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Laptop, Users, Wrench, Truck, Inbox, AlertCircle } from "lucide-react";
import { useT } from "@/lib/use-t";
import { useSession, ROLE_TICKET_CATEGORY, type Role } from "@/lib/auth-mock";
import { useTickets, ticketsStore, type TicketCategory, type TicketStatus, type TicketPriority } from "@/lib/tickets-store";

const CAT_ICON = { it: Laptop, hr: Users, facility: Wrench, logistics: Truck };

export function TicketInbox() {
  const tt = useT();
  const session = useSession();
  const tickets = useTickets();
  if (!session) return null;

  const myCat = ROLE_TICKET_CATEGORY[session.role as Role];
  const isSuper = session.role === "hq_admin";
  const visible = isSuper ? tickets : tickets.filter((t) => t.category === myCat);

  const catLabel = (c: TicketCategory) =>
    ({ it: "IT", hr: "HR", facility: tt("Facility", "Facility"), logistics: tt("Logistik", "Logistics") }[c]);

  const statusLabel = (s: TicketStatus) =>
    ({ open: tt("Offen", "Open"), progress: tt("In Bearbeitung", "In progress"), done: tt("Gelöst", "Resolved") }[s]);

  const statusTone = (s: TicketStatus) =>
    ({
      open: "bg-red-500/10 text-red-600 border-red-200",
      progress: "bg-amber-500/10 text-amber-600 border-amber-200",
      done: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    }[s]);

  const prioTone = (p: TicketPriority) =>
    ({ low: "bg-muted text-muted-foreground", med: "bg-amber-500/10 text-amber-600", high: "bg-red-500/10 text-red-600" }[p]);

  const prioLabel = (p: TicketPriority) =>
    ({ low: tt("Niedrig", "Low"), med: tt("Mittel", "Medium"), high: tt("Hoch", "High") }[p]);

  const open = visible.filter((t) => t.status === "open").length;
  const inProg = visible.filter((t) => t.status === "progress").length;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            {tt("Ticket-Inbox", "Ticket Inbox")}
            {!isSuper && myCat && (
              <Badge variant="secondary" className="font-normal">{catLabel(myCat)}</Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isSuper
              ? tt("Alle Tickets aus allen Filialen", "All tickets from all locations")
              : tt(`Tickets in deiner Zuständigkeit: ${catLabel(myCat!)}`, `Tickets in your area: ${catLabel(myCat!)}`)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">{open} {tt("offen", "open")}</Badge>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">{inProg} {tt("aktiv", "active")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-md">
            {tt("Keine Tickets in deiner Inbox", "No tickets in your inbox")}
          </div>
        )}
        {visible.map((tk) => {
          const Icon = CAT_ICON[tk.category];
          return (
            <div key={tk.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {catLabel(tk.category)} · {tk.id}
                  </span>
                  <Badge variant="outline" className={statusTone(tk.status)}>{statusLabel(tk.status)}</Badge>
                  <span className={`px-1.5 py-0.5 rounded text-[11px] ${prioTone(tk.priority)}`}>
                    {tk.priority === "high" && <AlertCircle className="h-3 w-3 inline -mt-0.5 mr-0.5" />}
                    {prioLabel(tk.priority)}
                  </span>
                </div>
                <div className="text-sm font-medium leading-tight mt-1">{tk.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tk.desc}</p>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {tk.author}{tk.pub ? ` · ${tk.pub}` : ""} · {tk.ago}
                </div>
              </div>
              <div className="shrink-0">
                <Select value={tk.status} onValueChange={(v) => ticketsStore.setStatus(tk.id, v as TicketStatus)}>
                  <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{statusLabel("open")}</SelectItem>
                    <SelectItem value="progress">{statusLabel("progress")}</SelectItem>
                    <SelectItem value="done">{statusLabel("done")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
        {visible.length > 0 && (
          <div className="pt-2 text-right">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" disabled>
              {tt("Insgesamt", "Total")}: {visible.length}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
