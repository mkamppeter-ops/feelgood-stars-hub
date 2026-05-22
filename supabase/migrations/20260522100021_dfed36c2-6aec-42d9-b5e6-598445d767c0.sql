
CREATE TABLE public.staff_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pub_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Bar',
  active BOOLEAN NOT NULL DEFAULT true,
  pi_external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read staff_members" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "Public insert staff_members" ON public.staff_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update staff_members" ON public.staff_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete staff_members" ON public.staff_members FOR DELETE USING (true);

CREATE TRIGGER update_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_staff_members_pub ON public.staff_members(pub_id);

CREATE TABLE public.shift_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pub_id TEXT NOT NULL,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  slot TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, date, slot)
);

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shift_assignments" ON public.shift_assignments FOR SELECT USING (true);
CREATE POLICY "Public insert shift_assignments" ON public.shift_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update shift_assignments" ON public.shift_assignments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete shift_assignments" ON public.shift_assignments FOR DELETE USING (true);

CREATE TRIGGER update_shift_assignments_updated_at
BEFORE UPDATE ON public.shift_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_shift_assignments_pub_date ON public.shift_assignments(pub_id, date);
CREATE INDEX idx_shift_assignments_staff_date ON public.shift_assignments(staff_id, date);
