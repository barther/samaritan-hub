
-- 1) Roles and role-checking function

-- Create enum for application roles (includes finance to separate financial permissions)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'viewer', 'finance');
  END IF;
END$$;

-- Create user_roles table to store roles for each user
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS and lock down the user_roles table (no public access)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can view roles (others cannot)
DROP POLICY IF EXISTS "Admins can view user roles" ON public.user_roles;
CREATE POLICY "Admins can view user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Security definer function to check roles without RLS recursion issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;


-- 2) Ensure RLS is enabled on core tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;


-- 3) Drop existing permissive policies that used "true" conditions

-- clients
DROP POLICY IF EXISTS "Staff can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can view all clients" ON public.clients;

-- interactions
DROP POLICY IF EXISTS "Staff can insert interactions" ON public.interactions;
DROP POLICY IF EXISTS "Staff can update interactions" ON public.interactions;
DROP POLICY IF EXISTS "Staff can view all interactions" ON public.interactions;

-- assistance_requests
DROP POLICY IF EXISTS "Staff can insert assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Staff can update assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Staff can view all assistance requests" ON public.assistance_requests;

-- disbursements
DROP POLICY IF EXISTS "Staff can insert disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Staff can update disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Staff can view all disbursements" ON public.disbursements;

-- donations
DROP POLICY IF EXISTS "Staff can insert donations" ON public.donations;
DROP POLICY IF EXISTS "Staff can update donations" ON public.donations;
DROP POLICY IF EXISTS "Staff can view all donations" ON public.donations;


-- 4) Replace with secure, role-based RLS policies

-- CLIENTS
-- Public Tier 1 form can create clients (but can't read/update)
CREATE POLICY "Public Tier1 can insert clients"
  ON public.clients
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Staff/Admin can also create clients
CREATE POLICY "Staff/Admin can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

-- Only Admin/Staff/Viewer can view clients
CREATE POLICY "View clients (admin|staff|viewer)"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'viewer')
  );

-- Only Admin/Staff can update clients
CREATE POLICY "Update clients (admin|staff)"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

-- No DELETE policy -> delete not allowed by RLS


-- INTERACTIONS
-- Public Tier 1 form can create an interaction, restricted to public_form channel
CREATE POLICY "Public Tier1 can insert interactions (public_form only)"
  ON public.interactions
  FOR INSERT
  TO public
  WITH CHECK (
    channel = 'public_form'
  );

-- Staff/Admin can insert interactions of any channel
CREATE POLICY "Staff/Admin can insert interactions"
  ON public.interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

-- Admin/Staff/Viewer can view interactions
CREATE POLICY "View interactions (admin|staff|viewer)"
  ON public.interactions
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'viewer')
  );

-- Admin/Staff can update interactions
CREATE POLICY "Update interactions (admin|staff)"
  ON public.interactions
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );


-- ASSISTANCE REQUESTS
-- Public Tier 1 form can create a basic assistance request (no read access)
CREATE POLICY "Public Tier1 can insert assistance requests"
  ON public.assistance_requests
  FOR INSERT
  TO public
  WITH CHECK (
    client_id IS NOT NULL
    AND help_requested IS NOT NULL
  );

-- Staff/Admin can insert (internal intakes)
CREATE POLICY "Staff/Admin can insert assistance requests"
  ON public.assistance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

-- Only Admin/Staff can view assistance requests (confidential)
CREATE POLICY "View assistance requests (admin|staff)"
  ON public.assistance_requests
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );

-- Only Admin/Staff can update assistance requests
CREATE POLICY "Update assistance requests (admin|staff)"
  ON public.assistance_requests
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  );


-- DISBURSEMENTS (financial)
-- Only Admin or Finance can insert, and only after triage is complete for the client
CREATE POLICY "Insert disbursements (admin|finance) after triage"
  ON public.disbursements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'))
    AND client_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.assistance_requests ar
      WHERE ar.client_id = disbursements.client_id
        AND ar.triage_completed_at IS NOT NULL
    )
  );

-- Only Admin/Finance can view disbursements
CREATE POLICY "View disbursements (admin|finance)"
  ON public.disbursements
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
  );

-- Only Admin/Finance can update disbursements
CREATE POLICY "Update disbursements (admin|finance)"
  ON public.disbursements
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
  );


-- DONATIONS (financial)
-- Only Admin/Finance can insert, view, update
CREATE POLICY "Insert donations (admin|finance)"
  ON public.donations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "View donations (admin|finance)"
  ON public.donations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "Update donations (admin|finance)"
  ON public.donations
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance')
  );


-- 5) Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_assistance_requests_client_id ON public.assistance_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_client_id ON public.disbursements(client_id);


-- 6) Update timestamp triggers (function already exists as public.update_updated_at_column)
-- Create triggers only if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
    CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interactions_updated_at') THEN
    CREATE TRIGGER update_interactions_updated_at
    BEFORE UPDATE ON public.interactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assistance_requests_updated_at') THEN
    CREATE TRIGGER update_assistance_requests_updated_at
    BEFORE UPDATE ON public.assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;


-- 7) Basic audit logging for INSERT/UPDATE/DELETE on sensitive tables
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE'
  row_id uuid,
  changed_data jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admin can view audit logs
DROP POLICY IF EXISTS "View audit logs (admin only)" ON public.audit_logs;
CREATE POLICY "View audit logs (admin only)"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct INSERT/UPDATE/DELETE by users; only via trigger function

CREATE OR REPLACE FUNCTION public.audit_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(table_name, action, row_id, changed_data, actor_id)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs(table_name, action, row_id, changed_data, actor_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
END;
$$;

-- Attach audit triggers to key tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_clients_changes') THEN
    CREATE TRIGGER audit_clients_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.audit_record();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_interactions_changes') THEN
    CREATE TRIGGER audit_interactions_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.interactions
    FOR EACH ROW EXECUTE FUNCTION public.audit_record();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_assistance_requests_changes') THEN
    CREATE TRIGGER audit_assistance_requests_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.assistance_requests
    FOR EACH ROW EXECUTE FUNCTION public.audit_record();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_disbursements_changes') THEN
    CREATE TRIGGER audit_disbursements_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.disbursements
    FOR EACH ROW EXECUTE FUNCTION public.audit_record();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_donations_changes') THEN
    CREATE TRIGGER audit_donations_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.audit_record();
  END IF;
END$$;
