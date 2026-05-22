import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Package, Truck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";
import { useSession, ROLE_PERSON } from "@/lib/auth-mock";
import { PUBS } from "@/lib/pubs-mock";
import {
  listProducts, listOrders, updateOrder, upsertProduct, deleteProduct,
  PROMO_CATEGORY_LABEL, PROMO_STATUS_LABEL,
  type PromoProduct, type PromoOrder, type PromoCategory, type PromoOrderStatus,
} from "@/lib/promo-shop";

const STATUS_FLOW: PromoOrderStatus[] = ["new", "accepted", "shipped", "delivered", "cancelled"];

/** Liste der eingehenden Werbemittel-Bestellungen — wird in der Facility-Inbox eingeblendet. */
export function PromoOrdersList() {
  const tt = useT();
  const [orders, setOrders] = useState<PromoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"open" | "all" | PromoOrderStatus>("open");

  const reload = async () => {
    try {
      const o = await listOrders();
      setOrders(o);
    } catch (e) {
      console.error(e);
      toast.error(tt("Laden fehlgeschlagen", "Failed to load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    if (statusFilter === "open") return orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const counts = useMemo(() => ({
    open: orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
    total: orders.length,
  }), [orders]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {tt("Werbemittel-Bestellungen", "Promo material orders")}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {tt("Eingehende Bestellungen aus den Bars — Bearbeitung & Versand durch Facility.", "Incoming orders from bars — fulfilled by Facility.")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline">{counts.open} {tt("offen", "open")}</Badge>
          <Badge variant="outline">{counts.total} {tt("gesamt", "total")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(["open", "all", ...STATUS_FLOW] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border text-muted-foreground"
              }`}
            >
              {s === "open" ? tt("Offen", "Open") : s === "all" ? tt("Alle", "All") : tt(PROMO_STATUS_LABEL[s].de, PROMO_STATUS_LABEL[s].en)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{tt("Lädt…", "Loading…")}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
            {tt("Keine Bestellungen in dieser Ansicht.", "No orders in this view.")}
          </div>
        ) : (
          filteredOrders.map((o) => <OrderRow key={o.id} order={o} onChanged={reload} />)
        )}
      </CardContent>
    </Card>
  );
}

function OrderRow({ order, onChanged }: { order: PromoOrder; onChanged: () => void }) {
  const tt = useT();
  const session = useSession();
  const person = session?.role ? ROLE_PERSON[session.role] : null;
  const pub = PUBS.find((p) => p.id === order.pub_id);
  const status = PROMO_STATUS_LABEL[order.status];
  const [busy, setBusy] = useState(false);
  const [carrier, setCarrier] = useState(order.tracking_carrier ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [internalNote, setInternalNote] = useState(order.internal_note ?? "");

  const setStatus = async (next: PromoOrderStatus) => {
    setBusy(true);
    try {
      await updateOrder(order.id, {
        status: next,
        handled_by: person?.name ?? null,
        tracking_carrier: carrier || null,
        tracking_number: tracking || null,
        internal_note: internalNote || null,
      });
      toast.success(tt("Status aktualisiert", "Status updated"));
      onChanged();
    } catch (e) {
      console.error(e); toast.error(tt("Update fehlgeschlagen", "Update failed"));
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold">
            {pub?.name ?? order.pub_id} · #{order.id.slice(0, 6).toUpperCase()}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {new Date(order.created_at).toLocaleString()} · {tt("von", "by")} {order.ordered_by_name}
            {order.requested_for && <> · {tt("benötigt bis", "needed by")} {order.requested_for}</>}
          </div>
        </div>
        <Badge variant="outline" className={status.tone}>{tt(status.de, status.en)}</Badge>
      </div>

      <div className="space-y-1 text-sm border-t pt-2">
        {(order.items ?? []).map((it) => (
          <div key={it.id} className="flex justify-between">
            <span className="text-muted-foreground">{it.product_name_snapshot}</span>
            <span className="tabular-nums font-medium">{it.quantity} {it.unit_snapshot}</span>
          </div>
        ))}
      </div>

      {order.note && (
        <div className="text-[11px] bg-muted/40 rounded-md p-2 border">
          <span className="font-medium">{tt("Notiz Bar:", "Bar note:")}</span> {order.note}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input placeholder={tt("Versanddienst (DHL, …)", "Carrier (DHL, …)")} value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-8" />
        <Input placeholder={tt("Sendungsnummer", "Tracking number")} value={tracking} onChange={(e) => setTracking(e.target.value)} className="h-8" />
        <Input placeholder={tt("Interne Notiz", "Internal note")} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="h-8" />
      </div>

      <div className="flex flex-wrap gap-2">
        {order.status === "new" && (
          <Button size="sm" disabled={busy} onClick={() => setStatus("accepted")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />{tt("Annehmen", "Accept")}</Button>
        )}
        {(order.status === "new" || order.status === "accepted") && (
          <Button size="sm" disabled={busy} onClick={() => setStatus("shipped")}><Truck className="h-3.5 w-3.5 mr-1" />{tt("Versendet", "Shipped")}</Button>
        )}
        {order.status === "shipped" && (
          <Button size="sm" disabled={busy} onClick={() => setStatus("delivered")}><Package className="h-3.5 w-3.5 mr-1" />{tt("Als geliefert markieren", "Mark delivered")}</Button>
        )}
        {order.status !== "delivered" && order.status !== "cancelled" && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus("cancelled")} className="text-destructive"><XCircle className="h-3.5 w-3.5 mr-1" />{tt("Stornieren", "Cancel")}</Button>
        )}
        {order.handled_by && (
          <span className="text-[11px] text-muted-foreground self-center ml-auto">
            {tt("bearbeitet von", "handled by")} {order.handled_by}
          </span>
        )}
      </div>
    </div>
  );
}

/** Sortiment des Werbemittel-Shops verwalten — wird unter Data Settings angezeigt. */
export function PromoCatalogManager() {
  const tt = useT();
  const [products, setProducts] = useState<PromoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PromoProduct> | null>(null);

  const reload = async () => {
    try {
      setLoading(true);
      const p = await listProducts({ includeInactive: true });
      setProducts(p);
    } catch (e) {
      console.error(e);
      toast.error(tt("Laden fehlgeschlagen", "Failed to load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({})}><Plus className="h-3.5 w-3.5 mr-1" />{tt("Produkt anlegen", "New product")}</Button>
          </DialogTrigger>
          {editing && (
            <ProductDialog
              initial={editing}
              onClose={() => setEditing(null)}
              onSaved={() => { setEditing(null); reload(); }}
            />
          )}
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {tt("Werbemittel-Sortiment", "Promo catalog")} ({products.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {tt("Was die Bars im Werbemittel-Shop bestellen können.", "What bars can order in the promo shop.")}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{tt("Lädt…", "Loading…")}</div>
          ) : (
            <div className="divide-y">
              {products.map((p) => (
                <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${!p.active ? "opacity-50" : ""}`}>
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xl">{p.icon ?? "📦"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{p.name_de}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {tt(PROMO_CATEGORY_LABEL[p.category].de, PROMO_CATEGORY_LABEL[p.category].en)} · Min {p.min_order_qty} {p.unit}
                    </div>
                  </div>
                  {!p.active && <Badge variant="outline">{tt("inaktiv", "inactive")}</Badge>}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={async () => {
                    if (!confirm(tt("Wirklich löschen?", "Really delete?"))) return;
                    try { await deleteProduct(p.id); toast.success(tt("Gelöscht", "Deleted")); reload(); }
                    catch (e) { console.error(e); toast.error(tt("Löschen fehlgeschlagen", "Delete failed")); }
                  }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductDialog({ initial, onClose, onSaved }: {
  initial: Partial<PromoProduct>; onClose: () => void; onSaved: () => void;
}) {
  const tt = useT();
  const [draft, setDraft] = useState<Partial<PromoProduct>>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PromoProduct>(k: K, v: PromoProduct[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (!draft.name_de) { toast.error(tt("Name fehlt", "Name missing")); return; }
    setBusy(true);
    try { await upsertProduct(draft); toast.success(tt("Gespeichert", "Saved")); onSaved(); }
    catch (e) { console.error(e); toast.error(tt("Speichern fehlgeschlagen", "Save failed")); }
    finally { setBusy(false); }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{draft.id ? tt("Produkt bearbeiten", "Edit product") : tt("Neues Produkt", "New product")}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">{tt("Name (DE)", "Name (DE)")}</label>
            <Input value={draft.name_de ?? ""} onChange={(e) => set("name_de", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{tt("Name (EN)", "Name (EN)")}</label>
            <Input value={draft.name_en ?? ""} onChange={(e) => set("name_en", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{tt("Beschreibung", "Description")}</label>
          <Textarea value={draft.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">{tt("Kategorie", "Category")}</label>
            <Select value={draft.category ?? "other"} onValueChange={(v) => set("category", v as PromoCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PROMO_CATEGORY_LABEL) as PromoCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>{PROMO_CATEGORY_LABEL[c].icon} {tt(PROMO_CATEGORY_LABEL[c].de, PROMO_CATEGORY_LABEL[c].en)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{tt("Icon (Emoji)", "Icon (emoji)")}</label>
            <Input value={draft.icon ?? ""} onChange={(e) => set("icon", e.target.value)} maxLength={4} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">{tt("Einheit", "Unit")}</label>
            <Input value={draft.unit ?? "Stück"} onChange={(e) => set("unit", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{tt("Min. Menge", "Min qty")}</label>
            <Input type="number" value={draft.min_order_qty ?? 1} onChange={(e) => set("min_order_qty", parseInt(e.target.value || "1", 10))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{tt("Pack-Schritt", "Pack step")}</label>
            <Input type="number" value={draft.pack_size ?? 1} onChange={(e) => set("pack_size", parseInt(e.target.value || "1", 10))} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={draft.active ?? true} onCheckedChange={(v) => set("active", v)} />
          <label className="text-sm">{tt("Aktiv (im Shop sichtbar)", "Active (visible in shop)")}</label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>{tt("Abbrechen", "Cancel")}</Button>
        <Button disabled={busy} onClick={save}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{tt("Speichern", "Save")}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
