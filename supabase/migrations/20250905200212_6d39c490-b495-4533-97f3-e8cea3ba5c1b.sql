
-- 1) Audit table for client merges
CREATE TABLE IF NOT EXISTS public.client_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merged_into_client_id uuid NOT NULL,
  merged_from_client_ids uuid[] NOT NULL DEFAULT '{}',
  merged_by uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and restrict to admins
ALTER TABLE public.client_merges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_merges' AND policyname = 'Admins can view client merges'
  ) THEN
    CREATE POLICY "Admins can view client merges"
      ON public.client_merges
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'client_merges' AND policyname = 'Admins can insert client merges'
  ) THEN
    CREATE POLICY "Admins can insert client merges"
      ON public.client_merges
      FOR INSERT
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Helpful index for lookups by primary client
CREATE INDEX IF NOT EXISTS idx_client_merges_into ON public.client_merges (merged_into_client_id);

-- 2) Transaction-safe merge function (admin-only)
CREATE OR REPLACE FUNCTION public.merge_clients(
  p_primary uuid,
  p_duplicate_ids uuid[],
  p_merged_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_all_ids uuid[];
  v_min_created_at timestamptz;
  v_oldest_client public.clients%ROWTYPE;
BEGIN
  -- Only admins can run
  IF NOT public.verify_user_role('admin') THEN
    RAISE EXCEPTION 'Insufficient privileges: admin role required';
  END IF;

  IF p_primary IS NULL THEN
    RAISE EXCEPTION 'Primary client id cannot be null';
  END IF;

  -- Collect all ids (primary + duplicates), deduplicated
  v_all_ids := ARRAY(SELECT DISTINCT unnest(COALESCE(ARRAY[p_primary] || COALESCE(p_duplicate_ids, '{}'), ARRAY[p_primary])));

  -- Fetch oldest client (by created_at) and the minimum created_at across all ids
  SELECT c.*
  INTO v_oldest_client
  FROM public.clients c
  WHERE c.id = ANY (v_all_ids)
  ORDER BY c.created_at ASC
  LIMIT 1;

  IF v_oldest_client.id IS NULL THEN
    RAISE EXCEPTION 'No matching clients found to merge';
  END IF;

  SELECT MIN(created_at)
  INTO v_min_created_at
  FROM public.clients
  WHERE id = ANY (v_all_ids);

  -- Update the primary client with provided merged data and preserve oldest metadata
  UPDATE public.clients
  SET
    first_name = COALESCE(NULLIF(p_merged_data->>'first_name',''), first_name),
    last_name  = COALESCE(NULLIF(p_merged_data->>'last_name',''), last_name),
    email      = COALESCE(NULLIF(p_merged_data->>'email',''), email),
    phone      = COALESCE(NULLIF(p_merged_data->>'phone',''), phone),
    address    = COALESCE(NULLIF(p_merged_data->>'address',''), address),
    city       = COALESCE(NULLIF(p_merged_data->>'city',''), city),
    state      = COALESCE(NULLIF(p_merged_data->>'state',''), state),
    zip_code   = COALESCE(NULLIF(p_merged_data->>'zip_code',''), zip_code),
    county     = COALESCE(NULLIF(p_merged_data->>'county',''), county),
    created_at = COALESCE(v_min_created_at, created_at),
    created_by = COALESCE(v_oldest_client.created_by, created_by),
    updated_at = now()
  WHERE id = p_primary;

  -- Repoint related records to the primary client
  UPDATE public.interactions
  SET client_id = p_primary
  WHERE client_id = ANY (v_all_ids) AND client_id <> p_primary;

  UPDATE public.assistance_requests
  SET client_id = p_primary
  WHERE client_id = ANY (v_all_ids) AND client_id <> p_primary;

  UPDATE public.disbursements
  SET client_id = p_primary
  WHERE client_id = ANY (v_all_ids) AND client_id <> p_primary;

  UPDATE public.public_intake
  SET client_id = p_primary
  WHERE client_id = ANY (v_all_ids) AND client_id <> p_primary;

  -- Delete the duplicate client records (if any)
  IF p_duplicate_ids IS NOT NULL AND array_length(p_duplicate_ids, 1) > 0 THEN
    DELETE FROM public.clients
    WHERE id = ANY (p_duplicate_ids) AND id <> p_primary;
  END IF;

  -- Log the merge
  INSERT INTO public.client_merges (merged_into_client_id, merged_from_client_ids, merged_by, details)
  VALUES (p_primary, COALESCE(p_duplicate_ids, '{}'), auth.uid(), p_merged_data);

  RETURN p_primary;
END;
$function$;
