ALTER TABLE public.pub_settings
  ADD COLUMN IF NOT EXISTS month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  ADD COLUMN IF NOT EXISTS active_users_target integer NOT NULL DEFAULT 0;

ALTER TABLE public.pub_settings DROP CONSTRAINT IF EXISTS pub_settings_pkey;
ALTER TABLE public.pub_settings ADD CONSTRAINT pub_settings_pkey PRIMARY KEY (pub_id, month);