-- Also allow public to create interactions for assistance requests
-- Keep SELECT/UPDATE restricted to staff/admin

DROP POLICY IF EXISTS "Admins and staff can insert interactions" ON public.interactions;
CREATE POLICY "Admins and staff can insert interactions"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- New policy: public (anon + authenticated) can insert interactions
DROP POLICY IF EXISTS "Anyone can insert interactions" ON public.interactions;
CREATE POLICY "Anyone can insert interactions"
ON public.interactions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);