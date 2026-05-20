
CREATE TABLE public.pub_settings (
  pub_id TEXT PRIMARY KEY,
  staff_costs_monthly NUMERIC NOT NULL DEFAULT 0 CHECK (staff_costs_monthly >= 0),
  rent_monthly NUMERIC NOT NULL DEFAULT 0 CHECK (rent_monthly >= 0),
  seats INTEGER NOT NULL DEFAULT 50 CHECK (seats >= 0),
  opening_hour INTEGER NOT NULL DEFAULT 17 CHECK (opening_hour BETWEEN 0 AND 23),
  closing_hour INTEGER NOT NULL DEFAULT 24 CHECK (closing_hour BETWEEN 1 AND 24),
  occupancy_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pub_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pub_settings"
  ON public.pub_settings FOR SELECT
  USING (true);

CREATE POLICY "Public insert pub_settings"
  ON public.pub_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update pub_settings"
  ON public.pub_settings FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pub_settings_updated_at
  BEFORE UPDATE ON public.pub_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
