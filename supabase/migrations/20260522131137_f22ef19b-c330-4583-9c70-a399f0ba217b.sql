
-- Vertragsart als Enum
DO $$ BEGIN
  CREATE TYPE public.contract_type AS ENUM ('vollzeit', 'teilzeit', 'minijob', 'werkstudent', 'aushilfe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- staff_members: Personalakte-Felder
ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS personnel_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'DE',
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_zip text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_country text DEFAULT 'DE',
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS bic text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS social_security_number text,
  ADD COLUMN IF NOT EXISTS health_insurance text,
  ADD COLUMN IF NOT EXISTS tax_class smallint,
  ADD COLUMN IF NOT EXISTS children_allowance numeric(3,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS contract_type public.contract_type,
  ADD COLUMN IF NOT EXISTS weekly_hours numeric(4,1),
  ADD COLUMN IF NOT EXISTS hourly_wage numeric(6,2),
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE UNIQUE INDEX IF NOT EXISTS staff_members_personnel_number_uidx
  ON public.staff_members(personnel_number)
  WHERE personnel_number IS NOT NULL;

-- Kostenstelle pro Pub (für Egecko-Buchung)
ALTER TABLE public.pub_settings
  ADD COLUMN IF NOT EXISTS cost_center_code text;

-- updated_at trigger
DROP TRIGGER IF EXISTS staff_members_updated_at ON public.staff_members;
CREATE TRIGGER staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
