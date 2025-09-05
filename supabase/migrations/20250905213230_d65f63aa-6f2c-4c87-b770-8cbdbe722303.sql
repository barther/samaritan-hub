-- Security hardening migration: scope sensitive policies TO authenticated and keep public_intake limited public insert

-- Helper block to drop a policy if it exists
DO $$ BEGIN END $$; -- no-op to ensure DO $$ $$; blocks are allowed

-- Ensure RLS is enabled on all relevant tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grant_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- clients
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='Admins and staff can view clients') THEN
    DROP POLICY "Admins and staff can view clients" ON public.clients;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='Admins and staff can update clients') THEN
    DROP POLICY "Admins and staff can update clients" ON public.clients;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clients' AND policyname='Admins and staff can insert clients') THEN
    DROP POLICY "Admins and staff can insert clients" ON public.clients;
  END IF;
END $$;

CREATE POLICY "Admins and staff can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- assistance_requests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assistance_requests' AND policyname='Admins and staff can view assistance requests') THEN
    DROP POLICY "Admins and staff can view assistance requests" ON public.assistance_requests;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assistance_requests' AND policyname='Admins and staff can update assistance requests') THEN
    DROP POLICY "Admins and staff can update assistance requests" ON public.assistance_requests;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assistance_requests' AND policyname='Admins and staff can insert assistance requests') THEN
    DROP POLICY "Admins and staff can insert assistance requests" ON public.assistance_requests;
  END IF;
END $$;

CREATE POLICY "Admins and staff can view assistance requests"
ON public.assistance_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update assistance requests"
ON public.assistance_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can insert assistance requests"
ON public.assistance_requests
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- interactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Admins and staff can view interactions') THEN
    DROP POLICY "Admins and staff can view interactions" ON public.interactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Admins and staff can update interactions') THEN
    DROP POLICY "Admins and staff can update interactions" ON public.interactions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Admins and staff can insert interactions') THEN
    DROP POLICY "Admins and staff can insert interactions" ON public.interactions;
  END IF;
END $$;

CREATE POLICY "Admins and staff can view interactions"
ON public.interactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update interactions"
ON public.interactions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can insert interactions"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- disbursements (admin only as currently designed)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='disbursements' AND policyname='Admins can view disbursements') THEN
    DROP POLICY "Admins can view disbursements" ON public.disbursements;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='disbursements' AND policyname='Admins can insert disbursements') THEN
    DROP POLICY "Admins can insert disbursements" ON public.disbursements;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='disbursements' AND policyname='Admins can update disbursements') THEN
    DROP POLICY "Admins can update disbursements" ON public.disbursements;
  END IF;
END $$;

CREATE POLICY "Admins can view disbursements"
ON public.disbursements
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert disbursements"
ON public.disbursements
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update disbursements"
ON public.disbursements
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- donations (admin only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donations' AND policyname='Admins can view donations') THEN
    DROP POLICY "Admins can view donations" ON public.donations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donations' AND policyname='Admins can insert donations') THEN
    DROP POLICY "Admins can insert donations" ON public.donations;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='donations' AND policyname='Admins can update donations') THEN
    DROP POLICY "Admins can update donations" ON public.donations;
  END IF;
END $$;

CREATE POLICY "Admins can view donations"
ON public.donations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update donations"
ON public.donations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- client_alerts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_alerts' AND policyname='Admins and staff can view client alerts') THEN
    DROP POLICY "Admins and staff can view client alerts" ON public.client_alerts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_alerts' AND policyname='Admins and staff can insert client alerts') THEN
    DROP POLICY "Admins and staff can insert client alerts" ON public.client_alerts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_alerts' AND policyname='Admins and staff can update client alerts') THEN
    DROP POLICY "Admins and staff can update client alerts" ON public.client_alerts;
  END IF;
END $$;

CREATE POLICY "Admins and staff can view client alerts"
ON public.client_alerts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can insert client alerts"
ON public.client_alerts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update client alerts"
ON public.client_alerts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- client_merges (admin only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_merges' AND policyname='Admins can view client merges') THEN
    DROP POLICY "Admins can view client merges" ON public.client_merges;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='client_merges' AND policyname='Admins can insert client merges') THEN
    DROP POLICY "Admins can insert client merges" ON public.client_merges;
  END IF;
END $$;

CREATE POLICY "Admins can view client merges"
ON public.client_merges
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert client merges"
ON public.client_merges
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can insert profiles') THEN
    DROP POLICY "Admins can insert profiles" ON public.profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update own profile') THEN
    DROP POLICY "Users can update own profile" ON public.profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can update all profiles') THEN
    DROP POLICY "Admins can update all profiles" ON public.profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can view all profiles') THEN
    DROP POLICY "Admins can view all profiles" ON public.profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view own profile') THEN
    DROP POLICY "Users can view own profile" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- settings (admin only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='Admins can view all settings') THEN
    DROP POLICY "Admins can view all settings" ON public.settings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='Admins can insert settings') THEN
    DROP POLICY "Admins can insert settings" ON public.settings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='Admins can update settings') THEN
    DROP POLICY "Admins can update settings" ON public.settings;
  END IF;
END $$;

CREATE POLICY "Admins can view all settings"
ON public.settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings"
ON public.settings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings"
ON public.settings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- grant_reports (admin only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='grant_reports' AND policyname='Admins can manage grant reports') THEN
    DROP POLICY "Admins can manage grant reports" ON public.grant_reports;
  END IF;
END $$;

CREATE POLICY "Admins can manage grant reports"
ON public.grant_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- public_intake (keep limited public insert; harden select/update to authenticated)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='public_intake' AND policyname='Admins and staff can view intake requests') THEN
    DROP POLICY "Admins and staff can view intake requests" ON public.public_intake;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='public_intake' AND policyname='Admins and staff can update intake requests') THEN
    DROP POLICY "Admins and staff can update intake requests" ON public.public_intake;
  END IF;
END $$;

CREATE POLICY "Admins and staff can view intake requests"
ON public.public_intake
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update intake requests"
ON public.public_intake
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- audit_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Admins can view audit logs') THEN
    DROP POLICY "Admins can view audit logs" ON public.audit_logs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='Admins and staff can insert audit logs') THEN
    DROP POLICY "Admins and staff can insert audit logs" ON public.audit_logs;
  END IF;
END $$;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and staff can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- staging tables (admin only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staging_clients' AND policyname='Admins manage staging_clients') THEN
    DROP POLICY "Admins manage staging_clients" ON public.staging_clients;
  END IF;
END $$;
CREATE POLICY "Admins manage staging_clients"
ON public.staging_clients
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staging_disbursements' AND policyname='Admins manage staging_disbursements') THEN
    DROP POLICY "Admins manage staging_disbursements" ON public.staging_disbursements;
  END IF;
END $$;
CREATE POLICY "Admins manage staging_disbursements"
ON public.staging_disbursements
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staging_donations' AND policyname='Admins manage staging_donations') THEN
    DROP POLICY "Admins manage staging_donations" ON public.staging_donations;
  END IF;
END $$;
CREATE POLICY "Admins manage staging_donations"
ON public.staging_donations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='staging_interactions' AND policyname='Admins manage staging_interactions') THEN
    DROP POLICY "Admins manage staging_interactions" ON public.staging_interactions;
  END IF;
END $$;
CREATE POLICY "Admins manage staging_interactions"
ON public.staging_interactions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can view all user roles') THEN
    DROP POLICY "Admins can view all user roles" ON public.user_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can insert user roles') THEN
    DROP POLICY "Admins can insert user roles" ON public.user_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can update user roles') THEN
    DROP POLICY "Admins can update user roles" ON public.user_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can delete user roles') THEN
    DROP POLICY "Admins can delete user roles" ON public.user_roles;
  END IF;
END $$;

CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
