-- Add enhanced security for clients table access
-- This creates audit logging and access controls without breaking existing functionality

-- 1. Create a function to log client data access
CREATE OR REPLACE FUNCTION public.log_client_access(p_client_id uuid, p_access_type text DEFAULT 'view')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource,
    details
  ) VALUES (
    auth.uid(),
    'client_' || p_access_type,
    'clients',
    jsonb_build_object(
      'client_id', p_client_id,
      'access_type', p_access_type,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    )
  );
END;
$$;

-- 2. Create a secure client view function that logs access
CREATE OR REPLACE FUNCTION public.get_client_secure(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  county text,
  preferred_name text,
  notes text,
  total_assistance_received numeric,
  assistance_count integer,
  last_assistance_date date,
  risk_level text,
  flagged_for_review boolean,
  review_reason text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has appropriate role
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
  
  IF NOT org_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: organization users only';
  END IF;
  
  -- Log the access
  PERFORM public.log_client_access(p_client_id, 'secure_view');
  
  -- Return client data
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.address,
    c.city,
    c.state,
    c.zip_code,
    c.county,
    c.preferred_name,
    c.notes,
    c.total_assistance_received,
    c.assistance_count,
    c.last_assistance_date,
    c.risk_level,
    c.flagged_for_review,
    c.review_reason,
    c.created_at,
    c.updated_at
  FROM public.clients c
  WHERE c.id = p_client_id;
END;
$$;

-- 3. Create a function for staff to get limited client info (data minimization)
CREATE OR REPLACE FUNCTION public.get_client_summary(p_client_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  preferred_name text,
  phone text,
  email text,
  city text,
  assistance_count integer,
  last_assistance_date date,
  risk_level text,
  flagged_for_review boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has appropriate role
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
  
  IF NOT org_user(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: organization users only';
  END IF;
  
  -- Log the access
  PERFORM public.log_client_access(p_client_id, 'summary_view');
  
  -- Return limited client data for staff
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.preferred_name,
    c.phone,
    c.email,
    c.city,
    c.assistance_count,
    c.last_assistance_date,
    c.risk_level,
    c.flagged_for_review
  FROM public.clients c
  WHERE c.id = p_client_id;
END;
$$;

-- 4. Add trigger to automatically log client table access
CREATE OR REPLACE FUNCTION public.audit_client_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive client data
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_client_access(OLD.id, 'direct_select');
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_client_access(NEW.id, 'update');
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_client_access(NEW.id, 'insert');
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the audit trigger (Note: SELECT triggers are not supported in PostgreSQL,
-- so we'll rely on the application to use the secure functions above)
CREATE TRIGGER audit_client_changes
  AFTER INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_client_access();

-- 5. Add a function for admins to review client access logs
CREATE OR REPLACE FUNCTION public.get_client_access_logs(p_client_id uuid DEFAULT NULL, p_days integer DEFAULT 30)
RETURNS TABLE(
  access_time timestamp with time zone,
  user_email text,
  access_type text,
  client_id uuid,
  user_agent text,
  ip_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view access logs
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    al.created_at as access_time,
    p.email as user_email,
    al.action as access_type,
    (al.details->>'client_id')::uuid as client_id,
    al.details->>'user_agent' as user_agent,
    al.details->>'ip_address' as ip_address
  FROM public.audit_logs al
  JOIN public.profiles p ON p.user_id = al.user_id
  WHERE al.resource = 'clients'
    AND al.created_at >= (now() - (p_days || ' days')::interval)
    AND (p_client_id IS NULL OR (al.details->>'client_id')::uuid = p_client_id)
  ORDER BY al.created_at DESC;
END;
$$;