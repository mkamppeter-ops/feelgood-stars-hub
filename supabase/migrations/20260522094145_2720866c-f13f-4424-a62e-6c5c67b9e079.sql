
-- Catalog
CREATE TABLE public.promo_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_de text NOT NULL,
  name_en text NOT NULL,
  category text NOT NULL DEFAULT 'print',
  unit text NOT NULL DEFAULT 'Stück',
  icon text,
  image_url text,
  min_order_qty integer NOT NULL DEFAULT 1,
  pack_size integer NOT NULL DEFAULT 1,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.promo_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pub_id text NOT NULL,
  ordered_by_name text,
  ordered_by_role text,
  status text NOT NULL DEFAULT 'new',
  requested_for date,
  note text,
  internal_note text,
  tracking_carrier text,
  tracking_number text,
  handled_by text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.promo_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.promo_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.promo_products(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  unit_snapshot text NOT NULL DEFAULT 'Stück',
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX promo_order_items_order_id_idx ON public.promo_order_items(order_id);
CREATE INDEX promo_orders_pub_id_idx ON public.promo_orders(pub_id);
CREATE INDEX promo_orders_status_idx ON public.promo_orders(status);

-- Timestamps
CREATE TRIGGER promo_products_updated_at
  BEFORE UPDATE ON public.promo_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER promo_orders_updated_at
  BEFORE UPDATE ON public.promo_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS — match existing tables (mock auth → open access)
ALTER TABLE public.promo_products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read promo_products"   ON public.promo_products   FOR SELECT USING (true);
CREATE POLICY "Public insert promo_products" ON public.promo_products   FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update promo_products" ON public.promo_products   FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete promo_products" ON public.promo_products   FOR DELETE USING (true);

CREATE POLICY "Public read promo_orders"     ON public.promo_orders     FOR SELECT USING (true);
CREATE POLICY "Public insert promo_orders"   ON public.promo_orders     FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update promo_orders"   ON public.promo_orders     FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public read promo_order_items"   ON public.promo_order_items FOR SELECT USING (true);
CREATE POLICY "Public insert promo_order_items" ON public.promo_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update promo_order_items" ON public.promo_order_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete promo_order_items" ON public.promo_order_items FOR DELETE USING (true);

-- Seed catalog
INSERT INTO public.promo_products (name_de, name_en, category, unit, icon, min_order_qty, pack_size, description, sort_order) VALUES
  ('Bierdeckel Standard',     'Beer coasters standard',  'print',     'Stück',    '🍺', 100, 100, 'Bedruckte Bierdeckel, 100er-Pack',           10),
  ('Flyer DIN lang',          'Flyer DL',                'print',     'Stück',    '📰', 50,  50,  'DIN lang, beidseitig 4/4 farbig',            20),
  ('Plakat A3 – Aktion',      'Poster A3 – promo',       'print',     'Stück',    '🖼️', 5,   1,   'A3 Plakat für Schaufenster & Innen',         30),
  ('Banner 2×1 m',            'Banner 2×1 m',            'print',     'Stück',    '🎌', 1,   1,   'PVC Banner mit Ösen, individuell bedruckt',  40),
  ('Aufkleber rund 10 cm',    'Sticker round 10 cm',     'print',     'Stück',    '🏷️', 50,  50,  'Vinyl Aufkleber, wetterfest',                50),
  ('Tischaufsteller A6',      'Table standee A6',        'standee',   'Stück',    '📋', 5,   1,   'Acryl-Aufsteller für Tisch oder Theke',      60),
  ('Plakataufsteller A1',     'Poster standee A1',       'standee',   'Stück',    '🪧', 1,   1,   'Outdoor-Aufsteller, wetterfest',             70),
  ('Tafelaufsteller A2',      'Chalkboard standee A2',   'standee',   'Stück',    '🪑', 1,   1,   'Klassische Kreidetafel für draußen',         80),
  ('Bedruckter Becher 0,3l',  'Printed cup 0.3l',        'glassware', 'Stück',    '🥤', 50,  50,  'Mehrweg-Becher mit Logo',                    90),
  ('Bedrucktes Bierglas',     'Printed beer glass',      'glassware', 'Stück',    '🍻', 12,  12,  'Bierglas mit Logo-Druck',                    100),
  ('Einweggeschirr Set',      'Disposable tableware',    'tableware', 'Set',      '🍽️', 10,  10,  'Bio-Einweggeschirr mit Logo',                110),
  ('Servietten bedruckt',     'Printed napkins',         'tableware', 'Pack',     '🧻', 5,   1,   '50er Pack, 3-lagig',                         120);
