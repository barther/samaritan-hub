-- Org email enforcement and helper function (retry with fixed COMMENT quoting)
BEGIN;

-- 1) Helper: check if a user (default to current) belongs to the org domain
CREATE OR REPLACE FUNCTION public.org_user(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = COALESCE(_user_id, auth.uid())
      AND split_part(lower(p.email), '@', 2) = 'lithiaspringsmethodist.org'
  );
$$;

COMMENT ON FUNCTION public.org_user(uuid) IS 'Returns true if the given (or current) user''s email domain is lithiaspringsmethodist.org';

-- 2) Trigger function to prevent role assignment to non-org emails
CREATE OR REPLACE FUNCTION public.validate_org_email_for_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Cannot assign role: user profile not found for %', NEW.user_id;
  END IF;

  IF split_part(lower(v_email), '@', 2) <> 'lithiaspringsmethodist.org' THEN
    RAISE EXCEPTION 'Cannot assign role to external email domain (%)', v_email;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Attach triggers on INSERT and UPDATE of user_roles
DROP TRIGGER IF EXISTS trg_validate_org_email_for_role_ins ON public.user_roles;
DROP TRIGGER IF EXISTS trg_validate_org_email_for_role_upd ON public.user_roles;

CREATE TRIGGER trg_validate_org_email_for_role_ins
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_org_email_for_role();

CREATE TRIGGER trg_validate_org_email_for_role_upd
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_org_email_for_role();

COMMIT;