
CREATE POLICY "Public read access to feedbacks"
ON public.feedbacks
FOR SELECT
USING (true);

CREATE POLICY "Public update access to feedback status"
ON public.feedbacks
FOR UPDATE
USING (true)
WITH CHECK (true);
