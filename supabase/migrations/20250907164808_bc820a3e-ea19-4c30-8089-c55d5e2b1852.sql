-- Restrict stripe_payments INSERT permissions
DROP POLICY IF EXISTS "payments_insert_allowed" ON public.stripe_payments;

CREATE POLICY "payments_admin_insert"
ON public.stripe_payments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND org_user(auth.uid())
);
