CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rating_drinks INTEGER,
  rating_atmosphere INTEGER,
  rating_service INTEGER,
  rating_cleanliness INTEGER,
  problem_tags TEXT[] NOT NULL DEFAULT '{}',
  free_text TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON public.feedbacks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);