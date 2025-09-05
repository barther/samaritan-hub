-- Critical Security Fixes - Core Database Changes
-- Fix profile visibility vulnerability and add audit infrastructure

-- 1. Fix profiles table policy (CRITICAL)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

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

-- 2. Create audit log table for edge function usage
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
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins and staff can insert audit logs (for edge functions)
DROP POLICY IF EXISTS "Admins and staff can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins and staff can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- 3. Create helper function for edge function authorization
CREATE OR REPLACE FUNCTION public.verify_user_role(required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has the required role
  RETURN public.has_role(auth.uid(), required_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Create function to log edge function usage
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