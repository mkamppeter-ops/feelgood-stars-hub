import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/auth-mock";

export type PromoCategory = "print" | "standee" | "glassware" | "tableware" | "other";
export type PromoOrderStatus = "new" | "accepted" | "shipped" | "delivered" | "cancelled";

export const PROMO_CATEGORY_LABEL: Record<PromoCategory, { de: string; en: string; icon: string }> = {
  print:     { de: "Print",            en: "Print",          icon: "🖨️" },
  standee:   { de: "Aufsteller",       en: "Standees",       icon: "🪧" },
  glassware: { de: "Gläser & Becher",  en: "Glassware",      icon: "🍻" },
  tableware: { de: "Geschirr",         en: "Tableware",      icon: "🍽️" },
  other:     { de: "Sonstiges",        en: "Other",          icon: "📦" },
};

export const PROMO_STATUS_LABEL: Record<PromoOrderStatus, { de: string; en: string; tone: string }> = {
  new:       { de: "Neu",         en: "New",        tone: "bg-amber-500/15 text-amber-700 border-amber-300" },
  accepted:  { de: "Angenommen",  en: "Accepted",   tone: "bg-sky-500/15 text-sky-700 border-sky-300" },
  shipped:   { de: "Versendet",   en: "Shipped",    tone: "bg-violet-500/15 text-violet-700 border-violet-300" },
  delivered: { de: "Geliefert",   en: "Delivered",  tone: "bg-emerald-500/15 text-emerald-700 border-emerald-300" },
  cancelled: { de: "Storniert",   en: "Cancelled",  tone: "bg-muted text-muted-foreground border-border" },
};

export type PromoProduct = {
  id: string;
  name_de: string;
  name_en: string;
  category: PromoCategory;
  unit: string;
  icon: string | null;
  image_url: string | null;
  min_order_qty: number;
  pack_size: number;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PromoOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_snapshot: string;
  quantity: number;
};

export type PromoOrder = {
  id: string;
  pub_id: string;
  ordered_by_name: string | null;
  ordered_by_role: string | null;
  status: PromoOrderStatus;
  requested_for: string | null;
  note: string | null;
  internal_note: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  handled_by: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  items?: PromoOrderItem[];
};

// ---------- Catalog ----------
export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<PromoProduct[]> {
  let q = supabase.from("promo_products").select("*").order("sort_order").order("name_de");
  if (!opts.includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PromoProduct[];
}

export async function upsertProduct(p: Partial<PromoProduct> & { id?: string }): Promise<PromoProduct> {
  const payload = {
    name_de: p.name_de ?? "",
    name_en: p.name_en ?? p.name_de ?? "",
    category: p.category ?? "other",
    unit: p.unit ?? "Stück",
    icon: p.icon ?? "📦",
    image_url: p.image_url ?? null,
    min_order_qty: p.min_order_qty ?? 1,
    pack_size: p.pack_size ?? 1,
    description: p.description ?? null,
    active: p.active ?? true,
    sort_order: p.sort_order ?? 100,
  };
  if (p.id) {
    const { data, error } = await supabase.from("promo_products").update(payload).eq("id", p.id).select().single();
    if (error) throw error;
    return data as PromoProduct;
  }
  const { data, error } = await supabase.from("promo_products").insert(payload).select().single();
  if (error) throw error;
  return data as PromoProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("promo_products").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Orders ----------
export type NewOrderInput = {
  pub_id: string;
  ordered_by_name: string;
  ordered_by_role: Role;
  requested_for?: string | null;
  note?: string | null;
  items: Array<{ product: PromoProduct; quantity: number }>;
};

export async function createOrder(input: NewOrderInput): Promise<PromoOrder> {
  const { data: order, error } = await supabase
    .from("promo_orders")
    .insert({
      pub_id: input.pub_id,
      ordered_by_name: input.ordered_by_name,
      ordered_by_role: input.ordered_by_role,
      status: "new",
      requested_for: input.requested_for ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  const items = input.items.map((it) => ({
    order_id: order.id,
    product_id: it.product.id,
    product_name_snapshot: it.product.name_de,
    unit_snapshot: it.product.unit,
    quantity: it.quantity,
  }));
  const { error: itemsErr } = await supabase.from("promo_order_items").insert(items);
  if (itemsErr) throw itemsErr;

  return order as PromoOrder;
}

export async function listOrders(opts: { pubId?: string } = {}): Promise<PromoOrder[]> {
  let q = supabase
    .from("promo_orders")
    .select("*, items:promo_order_items(*)")
    .order("created_at", { ascending: false });
  if (opts.pubId) q = q.eq("pub_id", opts.pubId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PromoOrder[];
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<PromoOrder, "status" | "internal_note" | "tracking_carrier" | "tracking_number" | "handled_by" | "shipped_at" | "delivered_at">>,
): Promise<void> {
  const finalPatch = { ...patch };
  if (patch.status === "shipped" && !patch.shipped_at) finalPatch.shipped_at = new Date().toISOString();
  if (patch.status === "delivered" && !patch.delivered_at) finalPatch.delivered_at = new Date().toISOString();
  const { error } = await supabase.from("promo_orders").update(finalPatch).eq("id", id);
  if (error) throw error;
}
