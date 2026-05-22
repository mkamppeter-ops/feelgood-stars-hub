import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Laptop, Users, Wrench, Truck, MoreHorizontal, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";
import {
  useTickets, ticketsStore,
  type TicketCategory as Category,
  type TicketStatus as Status,
  type TicketPriority as Priority,
} from "@/lib/tickets-store";

const CAT_ICON: Record<Category, React.ComponentType<{ className?: string }>> = {
  it: Laptop, hr: Users, facility: Wrench, logistics: Truck,
};

export function HQConnect() {
  const tt = useT();
  const tickets = useTickets();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; desc: string; category: Category; priority: Priority }>({
    title: "", desc: "", category: "it", priority: "med",
  });

  const columns: { key: Status; label: string; tone: string }[] = [
    { key: "open", label: tt("Offen", "Open"), tone: "bg-red-500/10 text-red-600 border-red-200" },
    { key: "progress", label: tt("In Bearbeitung", "In progress"), tone: "bg-amber-500/10 text-amber-600 border-amber-200" },
    { key: "done", label: tt("Gelöst", "Resolved"), tone: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  ];

  const catLabel = (c: Category) => ({
    it: "IT", hr: "HR", facility: tt("Facility", "Facility"), logistics: tt("Logistik", "Logistics"),
  }[c]);

  const prioTone = (p: Priority) => ({
    low: "bg-muted text-muted-foreground",
    med: "bg-amber-500/10 text-amber-600",
    high: "bg-red-500/10 text-red-600",
  }[p]);

  const prioLabel = (p: Priority) => ({
    low: tt("Niedrig", "Low"),
    med: tt("Mittel", "Medium"),
    high: tt("Hoch", "High"),
  }[p]);

  const move = (id: string, to: Status) => {
    ticketsStore.setStatus(id, to);
    toast.success(tt("Status aktualisiert", "Status updated"));
  };

  const submit = () => {
    if (!form.title.trim()) return;
    ticketsStore.add({
      title: form.title,
      desc: form.desc,
      category: form.category,
      priority: form.priority,
      author: tt("Du", "You"),
    });
    setForm({ title: "", desc: "", category: "it", priority: "med" });
    setOpen(false);
    toast.success(tt("Ticket erstellt", "Ticket created"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{tt("HQ Connect", "HQ Connect")}</h2>
          <p className="text-sm text-muted-foreground">{tt("Support & Tickets für deinen Standort", "Support & tickets for your location")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />{tt("Neues Ticket", "New ticket")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tt("Neues Ticket erstellen", "Create new ticket")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{tt("Titel", "Title")}</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={tt("Kurze Zusammenfassung", "Short summary")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tt("Kategorie", "Category")}</label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="facility">{tt("Facility", "Facility")}</SelectItem>
                      <SelectItem value="logistics">{tt("Logistik", "Logistics")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{tt("Priorität", "Priority")}</label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{tt("Niedrig", "Low")}</SelectItem>
                      <SelectItem value="med">{tt("Mittel", "Medium")}</SelectItem>
                      <SelectItem value="high">{tt("Hoch", "High")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{tt("Beschreibung", "Description")}</label>
                <Textarea rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>{tt("Abbrechen", "Cancel")}</Button>
              <Button onClick={submit}>{tt("Erstellen", "Create")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const list = tickets.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={col.tone}>{col.label}</Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">{list.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {list.map((tk) => {
                  const Icon = CAT_ICON[tk.category];
                  return (
                    <Card key={tk.id} className="shadow-sm">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{catLabel(tk.category)} · {tk.id}</div>
                              <div className="text-sm font-medium leading-tight truncate">{tk.title}</div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {columns.filter((c) => c.key !== tk.status).map((c) => (
                                <DropdownMenuItem key={c.key} onClick={() => move(tk.id, c.key)}>
                                  {tt("Verschieben nach", "Move to")} {c.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{tk.desc}</p>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className={`px-1.5 py-0.5 rounded ${prioTone(tk.priority)}`}>
                            {tk.priority === "high" && <AlertCircle className="h-3 w-3 inline -mt-0.5 mr-0.5" />}
                            {prioLabel(tk.priority)}
                          </span>
                          <span>{tk.author} · {tk.ago}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {list.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">
                    {tt("Keine Tickets", "No tickets")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
