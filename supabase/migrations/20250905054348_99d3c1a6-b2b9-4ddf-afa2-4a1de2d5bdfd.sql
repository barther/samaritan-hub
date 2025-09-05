-- Retry migration: make idempotent and adjust audit_logs policy

-- 1) Profiles: adjust policies already applied previously (ensure idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2) Recreate triggers safely by dropping first
-- set_created_by triggers
DROP TRIGGER IF EXISTS set_created_by_assistance_requests ON public.assistance_requests;
DROP TRIGGER IF EXISTS set_created_by_interactions ON public.interactions;
DROP TRIGGER IF EXISTS set_created_by_donations ON public.donations;
DROP TRIGGER IF EXISTS set_created_by_disbursements ON public.disbursements;

CREATE TRIGGER set_created_by_assistance_requests
  BEFORE INSERT ON public.assistance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_interactions
  BEFORE INSERT ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_donations
  BEFORE INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_created_by_disbursements
  BEFORE INSERT ON public.disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();

-- update_updated_at triggers
DROP TRIGGER IF EXISTS update_assistance_requests_updated_at ON public.assistance_requests;
DROP TRIGGER IF EXISTS update_interactions_updated_at ON public.interactions;
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_assistance_requests_updated_at
  BEFORE UPDATE ON public.assistance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Tighten audit_logs insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins and staff can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);