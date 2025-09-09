-- Create a public monthly stats table accessible without auth, maintained by secure functions and triggers

-- 1) Table
CREATE TABLE IF NOT EXISTS public.monthly_public_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  month_label text NOT NULL,
  families_count int NOT NULL DEFAULT 0,
  people_count int NOT NULL DEFAULT 0,
  families_all_time int NOT NULL DEFAULT 0,
  people_all_time int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, month)
);

-- 2) Enable RLS and allow public read
ALTER TABLE public.monthly_public_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_public_stats' AND policyname = 'Public can view monthly stats'
  ) THEN
    CREATE POLICY "Public can view monthly stats"
    ON public.monthly_public_stats
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Do NOT add policies for insert/update/delete to keep writes restricted (only via SECURITY DEFINER functions below)

-- 3) Function to compute & upsert stats for a given month (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.compute_and_upsert_public_stats(p_year int, p_month int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date date := make_date(p_year, p_month, 1);
  v_end_date date := (make_date(p_year, p_month, 1) + INTERVAL '1 month')::date;
  v_start_ts timestamptz := (make_timestamptz(p_year, p_month, 1, 0, 0, 0));
  v_end_ts timestamptz := (make_timestamptz(p_year, p_month, 1, 0, 0, 0) + INTERVAL '1 month');
  v_month_label text := to_char(v_start_date, 'FMMonth');
  v_disb_count int := 0;
  v_interactions_count int := 0;
  v_referral_only_count int := 0;
  v_families int := 0;
  v_people int := 0;
  v_all_disb int := 0;
  v_all_interactions int := 0;
  v_all_referral_only int := 0;
  v_families_all int := 0;
  v_people_all int := 0;
BEGIN
  -- Current month counts
  SELECT COUNT(*) INTO v_disb_count
  FROM public.disbursements d
  WHERE d.disbursement_date >= v_start_date AND d.disbursement_date < v_end_date;

  SELECT COUNT(*) INTO v_interactions_count
  FROM public.interactions i
  WHERE i.occurred_at >= v_start_ts AND i.occurred_at < v_end_ts;

  -- Build set of interaction_ids that have disbursements this month
  WITH disb AS (
    SELECT DISTINCT interaction_id
    FROM public.disbursements
    WHERE disbursement_date >= v_start_date AND disbursement_date < v_end_date AND interaction_id IS NOT NULL
  )
  SELECT COUNT(*) INTO v_referral_only_count
  FROM public.interactions i
  WHERE i.occurred_at >= v_start_ts AND i.occurred_at < v_end_ts
    AND (
      (i.summary IS NOT NULL AND lower(i.summary) LIKE '%referral%') OR
      (i.details IS NOT NULL AND lower(i.details) LIKE '%refer%')
    )
    AND NOT EXISTS (
      SELECT 1 FROM disb d WHERE d.interaction_id = i.id
    );

  v_families := v_disb_count + v_referral_only_count;
  v_people := v_interactions_count;

  -- All-time totals (across all data)
  SELECT COUNT(*) INTO v_all_disb FROM public.disbursements;
  SELECT COUNT(*) INTO v_all_interactions FROM public.interactions;

  WITH all_disb AS (
    SELECT DISTINCT interaction_id FROM public.disbursements WHERE interaction_id IS NOT NULL
  )
  SELECT COUNT(*) INTO v_all_referral_only
  FROM public.interactions i
  WHERE (
    (i.summary IS NOT NULL AND lower(i.summary) LIKE '%referral%') OR
    (i.details IS NOT NULL AND lower(i.details) LIKE '%refer%')
  )
  AND NOT EXISTS (SELECT 1 FROM all_disb d WHERE d.interaction_id = i.id);

  v_families_all := v_all_disb + v_all_referral_only;
  v_people_all := v_all_interactions;

  INSERT INTO public.monthly_public_stats AS mps (
    year, month, month_label, families_count, people_count, families_all_time, people_all_time, updated_at
  ) VALUES (
    p_year, p_month, v_month_label, v_families, v_people, v_families_all, v_people_all, now()
  )
  ON CONFLICT (year, month) DO UPDATE
  SET families_count = EXCLUDED.families_count,
      people_count = EXCLUDED.people_count,
      families_all_time = EXCLUDED.families_all_time,
      people_all_time = EXCLUDED.people_all_time,
      month_label = EXCLUDED.month_label,
      updated_at = now();
END;
$$;

-- 4) Trigger helpers to refresh stats when data changes
CREATE OR REPLACE FUNCTION public.refresh_public_stats_from_disbursement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year int;
  v_month int;
  v_old_year int;
  v_old_month int;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    v_year := EXTRACT(YEAR FROM COALESCE(NEW.disbursement_date, now()))::int;
    v_month := EXTRACT(MONTH FROM COALESCE(NEW.disbursement_date, now()))::int;
    PERFORM public.compute_and_upsert_public_stats(v_year, v_month);
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF NEW.disbursement_date IS DISTINCT FROM OLD.disbursement_date THEN
      v_old_year := EXTRACT(YEAR FROM OLD.disbursement_date)::int;
      v_old_month := EXTRACT(MONTH FROM OLD.disbursement_date)::int;
      PERFORM public.compute_and_upsert_public_stats(v_old_year, v_old_month);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_public_stats_from_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year int;
  v_month int;
  v_old_year int;
  v_old_month int;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    v_year := EXTRACT(YEAR FROM COALESCE(NEW.occurred_at, now()))::int;
    v_month := EXTRACT(MONTH FROM COALESCE(NEW.occurred_at, now()))::int;
    PERFORM public.compute_and_upsert_public_stats(v_year, v_month);
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF NEW.occurred_at IS DISTINCT FROM OLD.occurred_at THEN
      v_old_year := EXTRACT(YEAR FROM OLD.occurred_at)::int;
      v_old_month := EXTRACT(MONTH FROM OLD.occurred_at)::int;
      PERFORM public.compute_and_upsert_public_stats(v_old_year, v_old_month);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers (drop if exist first)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_refresh_public_stats_on_disbursements') THEN
    DROP TRIGGER trg_refresh_public_stats_on_disbursements ON public.disbursements;
  END IF;
  CREATE TRIGGER trg_refresh_public_stats_on_disbursements
  AFTER INSERT OR UPDATE ON public.disbursements
  FOR EACH ROW EXECUTE FUNCTION public.refresh_public_stats_from_disbursement();
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_refresh_public_stats_on_interactions') THEN
    DROP TRIGGER trg_refresh_public_stats_on_interactions ON public.interactions;
  END IF;
  CREATE TRIGGER trg_refresh_public_stats_on_interactions
  AFTER INSERT OR UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.refresh_public_stats_from_interaction();
END $$;

-- 5) Backfill stats for existing data (iterate months between min and max)
DO $$
DECLARE
  v_min_date date;
  v_max_date date;
  v_cursor date;
BEGIN
  SELECT LEAST(
           COALESCE((SELECT MIN(disbursement_date) FROM public.disbursements), CURRENT_DATE),
           COALESCE((SELECT MIN(date_trunc('month', occurred_at))::date FROM public.interactions), CURRENT_DATE)
         ) INTO v_min_date;
  SELECT GREATEST(
           COALESCE((SELECT MAX(disbursement_date) FROM public.disbursements), CURRENT_DATE),
           COALESCE((SELECT MAX(date_trunc('month', occurred_at))::date FROM public.interactions), CURRENT_DATE)
         ) INTO v_max_date;

  IF v_min_date IS NULL THEN
    v_min_date := date_trunc('month', CURRENT_DATE)::date;
  END IF;
  IF v_max_date IS NULL THEN
    v_max_date := date_trunc('month', CURRENT_DATE)::date;
  END IF;

  v_cursor := date_trunc('month', v_min_date)::date;
  WHILE v_cursor <= v_max_date LOOP
    PERFORM public.compute_and_upsert_public_stats(EXTRACT(YEAR FROM v_cursor)::int, EXTRACT(MONTH FROM v_cursor)::int);
    v_cursor := (v_cursor + INTERVAL '1 month')::date;
  END LOOP;
END $$;