-- Allow public to create client records for assistance intake
-- Keep SELECT/UPDATE restricted to staff/admin

DROP POLICY IF EXISTS "Admins and staff can insert clients" ON public.clients;
CREATE POLICY "Admins and staff can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- New policy: public (anon + authenticated) can insert clients
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
CREATE POLICY "Anyone can insert clients"
ON public.clients
FOR INSERT
TO anon, authenticated
WITH CHECK (true);