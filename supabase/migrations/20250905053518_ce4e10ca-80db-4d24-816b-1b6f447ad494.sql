-- Fix INSERT policies WITH CHECK clause for assistance_requests, clients, and interactions

-- First, drop and recreate the INSERT policies for assistance_requests
DROP POLICY "Admins and staff can insert assistance requests" ON public.assistance_requests;
CREATE POLICY "Admins and staff can insert assistance requests"
ON public.assistance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Fix INSERT policies for clients
DROP POLICY "Admins and staff can insert clients" ON public.clients;
CREATE POLICY "Admins and staff can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Fix INSERT policies for interactions
DROP POLICY "Admins and staff can insert interactions" ON public.interactions;
CREATE POLICY "Admins and staff can insert interactions"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Fix INSERT policies for donations
DROP POLICY "Admins can insert donations" ON public.donations;
CREATE POLICY "Admins can insert donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Fix INSERT policies for disbursements
DROP POLICY "Admins can insert disbursements" ON public.disbursements;
CREATE POLICY "Admins can insert disbursements"
ON public.disbursements
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);