-- Critical Security Hardening - Phase 1: Database Security Reinforcement
BEGIN;

-- 1. Enhanced RLS policies that verify both role AND org membership
-- Update all existing policies to also check org membership

-- Clients table - enhanced policies
DROP POLICY IF EXISTS "Admins and staff can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and staff can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and staff can update clients" ON public.clients;

CREATE POLICY "Org admins and staff can view clients" 
ON public.clients FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can insert clients" 
ON public.clients FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can update clients" 
ON public.clients FOR UPDATE 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

-- Interactions table - enhanced policies
DROP POLICY IF EXISTS "Admins and staff can view interactions" ON public.interactions;
DROP POLICY IF EXISTS "Admins and staff can insert interactions" ON public.interactions;
DROP POLICY IF EXISTS "Admins and staff can update interactions" ON public.interactions;

CREATE POLICY "Org admins and staff can view interactions" 
ON public.interactions FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can insert interactions" 
ON public.interactions FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can update interactions" 
ON public.interactions FOR UPDATE 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

-- Disbursements table - enhanced policies (admin only)
DROP POLICY IF EXISTS "Admins can view disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Admins can insert disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Admins can update disbursements" ON public.disbursements;

CREATE POLICY "Org admins can view disbursements" 
ON public.disbursements FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can insert disbursements" 
ON public.disbursements FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can update disbursements" 
ON public.disbursements FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

-- Donations table - enhanced policies (admin only)
DROP POLICY IF EXISTS "Admins can view donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can update donations" ON public.donations;

CREATE POLICY "Org admins can view donations" 
ON public.donations FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can insert donations" 
ON public.donations FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can update donations" 
ON public.donations FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

-- User roles table - enhanced policies (admin only)
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

CREATE POLICY "Org admins can view all user roles" 
ON public.user_roles FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can insert user roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can update user roles" 
ON public.user_roles FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can delete user roles" 
ON public.user_roles FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

-- 2. Add user session tracking table for enhanced authentication controls
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '8 hours'),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can view all sessions" 
ON public.user_sessions FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "System can insert sessions" 
ON public.user_sessions FOR INSERT 
WITH CHECK (true); -- Allow system to create sessions

CREATE POLICY "Users can update own sessions" 
ON public.user_sessions FOR UPDATE 
USING (auth.uid() = user_id AND public.org_user(auth.uid()));

-- 3. Create audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.audit_logs (
    user_id, 
    action, 
    resource, 
    details
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    jsonb_build_object(
      'record_id', COALESCE(NEW.id, OLD.id),
      'timestamp', now(),
      'table', TG_TABLE_NAME
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_clients_access
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER audit_disbursements_access
AFTER INSERT OR UPDATE OR DELETE ON public.disbursements
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER audit_donations_access
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

-- 4. Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$;

COMMIT;