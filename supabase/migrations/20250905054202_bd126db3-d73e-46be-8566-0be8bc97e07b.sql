-- Critical Security Fixes Phase 1
-- Fix profile visibility vulnerability and strengthen auth configuration

-- 1. Replace permissive profile policy with role-based access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Only admins can view all profiles, users can view their own
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

-- 2. Add audit fields and functions for better accountability
-- Function to automatically set created_by field
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for audit trails on key tables
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

-- Add updated_at triggers for tables that have the field
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

-- 3. Create audit log table for edge function usage
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert audit logs (will be done via SECURITY DEFINER function)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Create helper function for edge function authorization
CREATE OR REPLACE FUNCTION public.verify_user_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has the required role
  RETURN public.has_role(auth.uid(), required_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 5. Create function to log edge function usage
CREATE OR REPLACE FUNCTION public.log_edge_function_usage(
  p_action TEXT,
  p_resource TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource, details)
  VALUES (auth.uid(), p_action, p_resource, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;