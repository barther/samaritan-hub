-- Harden RLS: enforce role-based access controls across sensitive tables

-- Assistance Requests
DROP POLICY IF EXISTS "Staff can view all assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Staff can insert assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Staff can update assistance requests" ON public.assistance_requests;

CREATE POLICY "Admins and staff can view assistance requests"
ON public.assistance_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Admins and staff can insert assistance requests"
ON public.assistance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Admins and staff can update assistance requests"
ON public.assistance_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Clients
DROP POLICY IF EXISTS "Staff can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;

CREATE POLICY "Admins, staff, and viewers can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admins and staff can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Admins and staff can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Interactions
DROP POLICY IF EXISTS "Staff can view all interactions" ON public.interactions;
DROP POLICY IF EXISTS "Staff can insert interactions" ON public.interactions;
DROP POLICY IF EXISTS "Staff can update interactions" ON public.interactions;

CREATE POLICY "Admins, staff, and viewers can view interactions"
ON public.interactions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admins and staff can insert interactions"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Admins and staff can update interactions"
ON public.interactions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Donations
DROP POLICY IF EXISTS "Staff can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Staff can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Staff can update donations" ON public.donations;

CREATE POLICY "Admins and finance can view donations"
ON public.donations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
);

CREATE POLICY "Admins and finance can insert donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
);

CREATE POLICY "Admins and finance can update donations"
ON public.donations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
);

-- Disbursements
DROP POLICY IF EXISTS "Staff can view all disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Staff can insert disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Staff can update disbursements" ON public.disbursements;

CREATE POLICY "Admins and finance can view disbursements"
ON public.disbursements
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
);

CREATE POLICY "Admins and finance can insert disbursements"
ON public.disbursements
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
);

CREATE POLICY "Admins and finance can update disbursements"
ON public.disbursements
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
);
