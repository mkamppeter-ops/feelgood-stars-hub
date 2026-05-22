
CREATE TABLE public.staff_biometrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  finger_index SMALLINT NOT NULL DEFAULT 1,
  template_encrypted TEXT NOT NULL,
  template_format TEXT NOT NULL DEFAULT 'secugen-iso',
  pin_hash TEXT,
  consent_signed_at TIMESTAMP WITH TIME ZONE,
  consent_signed_by TEXT,
  enrolled_by TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, finger_index)
);

ALTER TABLE public.staff_biometrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read staff_biometrics" ON public.staff_biometrics FOR SELECT USING (true);
CREATE POLICY "Public insert staff_biometrics" ON public.staff_biometrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update staff_biometrics" ON public.staff_biometrics FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete staff_biometrics" ON public.staff_biometrics FOR DELETE USING (true);

CREATE TRIGGER update_staff_biometrics_updated_at
BEFORE UPDATE ON public.staff_biometrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_staff_biometrics_staff ON public.staff_biometrics(staff_id);


CREATE TABLE public.stamp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pub_id TEXT NOT NULL,
  staff_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('in','out')),
  method TEXT NOT NULL DEFAULT 'fingerprint' CHECK (method IN ('fingerprint','pin','manual')),
  confidence INTEGER,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stamp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stamp_events" ON public.stamp_events FOR SELECT USING (true);
CREATE POLICY "Public insert stamp_events" ON public.stamp_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update stamp_events" ON public.stamp_events FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX idx_stamp_events_pub_date ON public.stamp_events(pub_id, occurred_at DESC);
CREATE INDEX idx_stamp_events_staff_date ON public.stamp_events(staff_id, occurred_at DESC);
