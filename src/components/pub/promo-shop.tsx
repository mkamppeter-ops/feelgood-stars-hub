import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Minus, ShoppingCart, Trash2, PackageCheck, Truck, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/use-t";
import { useSession, ROLE_PERSON } from "@/lib/auth-mock";
import {
  listProducts, listOrders, createOrder,
  PROMO_CATEGORY_LABEL, PROMO_STATUS_LABEL,
  type PromoProduct, type PromoOrder, type PromoCategory,
} from "@/lib/promo-shop";

type CartLine = { product: PromoProduct; quantity: number };

export function PromoShop({ pubId, pubName }: { pubId: string; pubName: string }) {
  const tt = useT();
  const session = useSession();
  const person = session?.role ? ROLE_PERSON[session.role] : null;

  const [products, setProducts] = useState<PromoProduct[]>([]);
  const [orders, setOrders] = useState<PromoOrder[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [note, setNote] = useState("");
  const [requestedFor, setRequestedFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<PromoCategory | "all">("all");

  const reload = async () => {
    try {
      const [p, o] = await Promise.all([listProducts(), listOrders({ pubId })]);
      setProducts(p);
      setOrders(o);
    } catch (e) {
      toast.error(tt("Konnte Werbemittel nicht laden", "Could not load promo materials"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubId]);

  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);

  const setQty = (product: PromoProduct, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[product.id];
      else next[product.id] = { product, quantity: qty };
      return next;
    });
  };

  const addToCart = (product: PromoProduct) => {
    const current = cart[product.id]?.quantity ?? 0;
    const next = current === 0 ? product.min_order_qty : current + product.pack_size;
    setQty(product, next);
  };

  const handleSubmit = async () => {
    if (cartLines.length === 0) return;
    if (!person) {
      toast.error(tt("Bitte einloggen", "Please log in"));
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        pub_id: pubId,
        ordered_by_name: person.name,
        ordered_by_role: session!.role,
        requested_for: requestedFor || null,
        note: note || null,
        items: cartLines,
      });
      toast.success(tt("Bestellung an Tomasz gesendet", "Order sent to Tomasz"));
      setCart({});
      setNote("");
      setRequestedFor("");
      await reload();
    } catch (e) {
      console.error(e);
      toast.error(tt("Bestellung fehlgeschlagen", "Order failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(
    () => products.filter((p) => activeCat === "all" || p.category === activeCat),
    [products, activeCat],
  );

  const categories: Array<PromoCategory | "all"> = ["all", "print", "standee", "glassware", "tableware", "other"];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden relative border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <CardContent className="p-5 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl">📦</div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{tt("Werbemittel-Shop", "Promo materials shop")}</div>
              <div className="text-2xl font-bold tracking-tight leading-tight">{pubName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {tt("Bearbeitung & Versand durch Tomasz (Facility)", "Fulfilled & shipped by Tomasz (Facility)")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="shop" className="space-y-5">
        <TabsList>
          <TabsTrigger value="shop">{tt("Sortiment", "Catalog")}</TabsTrigger>
          <TabsTrigger value="orders">
            {tt("Meine Bestellungen", "My orders")}
            {orders.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-medium">
                {orders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="mt-0 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeCat === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted border-border text-muted-foreground"
                }`}
              >
                {c === "all" ? tt("Alle", "All") : `${PROMO_CATEGORY_LABEL[c].icon} ${tt(PROMO_CATEGORY_LABEL[c].de, PROMO_CATEGORY_LABEL[c].en)}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{tt("Lädt…", "Loading…")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const qty = cart[p.id]?.quantity ?? 0;
                return (
                  <Card key={p.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center text-3xl shrink-0">
                          {p.icon ?? "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold leading-snug">{tt(p.name_de, p.name_en)}</div>
                          {p.description && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                            <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
                              {tt(PROMO_CATEGORY_LABEL[p.category].de, PROMO_CATEGORY_LABEL[p.category].en)}
                            </Badge>
                            <span>·</span>
                            <span>{tt("Min.", "Min")} {p.min_order_qty} {p.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(p, Math.max(0, qty - p.pack_size))}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={qty}
                              onChange={(e) => setQty(p, Math.max(0, parseInt(e.target.value || "0", 10)))}
                              className="h-7 w-16 text-center text-sm tabular-nums"
                            />
                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(p, qty + p.pack_size)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{p.unit}</span>
                        )}
                        <Button size="sm" variant={qty > 0 ? "outline" : "default"} onClick={() => addToCart(p)}>
                          {qty > 0 ? tt("Im Warenkorb", "In cart") : (<><Plus className="h-3.5 w-3.5 mr-1" />{tt("Hinzufügen", "Add")}</>)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {cartCount > 0 && (
            <Card className="sticky bottom-4 border-primary/40 shadow-lg">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {tt("Warenkorb", "Cart")} <Badge variant="secondary">{cartLines.length} {tt("Pos.", "items")}</Badge>
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setCart({})}><Trash2 className="h-3.5 w-3.5 mr-1" />{tt("Leeren", "Clear")}</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5 max-h-40 overflow-auto">
                  {cartLines.map((l) => (
                    <div key={l.product.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{l.product.icon} {tt(l.product.name_de, l.product.name_en)}</span>
                      <span className="tabular-nums font-medium ml-2">{l.quantity} {l.product.unit}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">{tt("Benötigt bis", "Needed by")}</label>
                    <Input type="date" value={requestedFor} onChange={(e) => setRequestedFor(e.target.value)} className="h-8 mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">{tt("Notiz an Tomasz (optional)", "Note to Tomasz (optional)")}</label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={1} className="mt-1 min-h-8" />
                  </div>
                </div>
                <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  {tt("Bestellung an Tomasz senden", "Send order to Tomasz")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-0 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{tt("Lädt…", "Loading…")}</div>
          ) : orders.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
              {tt("Noch keine Bestellungen.", "No orders yet.")}
            </CardContent></Card>
          ) : (
            orders.map((o) => <OrderCard key={o.id} order={o} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ order }: { order: PromoOrder }) {
  const tt = useT();
  const status = PROMO_STATUS_LABEL[order.status];
  const StatusIcon = order.status === "delivered" ? PackageCheck : order.status === "shipped" ? Truck : Clock;
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <StatusIcon className="h-4 w-4" />
              {tt("Bestellung", "Order")} #{order.id.slice(0, 6).toUpperCase()}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleString()} · {order.ordered_by_name}
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
        {(order.note || order.tracking_number) && (
          <div className="text-[11px] text-muted-foreground border-t pt-2 space-y-0.5">
            {order.note && <div>📝 {order.note}</div>}
            {order.tracking_number && <div>🚚 {order.tracking_carrier} · {order.tracking_number}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
