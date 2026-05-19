ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Allow anon and authenticated users to insert feedback" ON public.feedbacks;

CREATE POLICY "Allow anon and authenticated users to insert feedback"
ON public.feedbacks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);