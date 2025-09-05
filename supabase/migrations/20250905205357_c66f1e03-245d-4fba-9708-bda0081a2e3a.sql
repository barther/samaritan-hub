-- Reset demo data and fix client risk calculations
-- First, reset all clients to clean state based on real disbursements
UPDATE public.clients 
SET 
  total_assistance_received = COALESCE(disbursement_totals.total, 0),
  assistance_count = COALESCE(disbursement_totals.count, 0),
  last_assistance_date = disbursement_totals.last_date,
  risk_level = CASE
    WHEN COALESCE(disbursement_totals.total, 0) > 1000 OR COALESCE(disbursement_totals.count, 0) >= 3 THEN 'high'
    WHEN COALESCE(disbursement_totals.total, 0) > 500 OR COALESCE(disbursement_totals.count, 0) >= 2 THEN 'medium'
    ELSE 'low'
  END,
  flagged_for_review = CASE
    WHEN COALESCE(disbursement_totals.total, 0) > 1000 OR COALESCE(disbursement_totals.count, 0) >= 3 THEN true
    ELSE false
  END,
  review_reason = CASE
    WHEN COALESCE(disbursement_totals.total, 0) > 1000 THEN 'Total assistance exceeds $1000'
    WHEN COALESCE(disbursement_totals.count, 0) >= 3 THEN 'Three or more assistance requests'
    ELSE NULL
  END
FROM (
  SELECT 
    client_id,
    SUM(amount) as total,
    COUNT(*) as count,
    MAX(disbursement_date) as last_date
  FROM public.disbursements
  GROUP BY client_id
) as disbursement_totals
WHERE clients.id = disbursement_totals.client_id;

-- Reset clients with no disbursements to clean state
UPDATE public.clients 
SET 
  total_assistance_received = 0,
  assistance_count = 0,
  last_assistance_date = NULL,
  risk_level = 'low',
  flagged_for_review = false,
  review_reason = NULL
WHERE id NOT IN (
  SELECT DISTINCT client_id 
  FROM public.disbursements 
  WHERE client_id IS NOT NULL
);

-- Clean up any demo client alerts that don't match real data
DELETE FROM public.client_alerts 
WHERE alert_type = 'repeat_client' 
  AND client_id NOT IN (
    SELECT client_id 
    FROM public.disbursements 
    GROUP BY client_id 
    HAVING COUNT(*) >= 2
  );

-- Add interaction_channel enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE interaction_channel AS ENUM ('phone', 'email', 'in_person', 'web_form', 'walk_in', 'text');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update interactions table to use the enum if not already
DO $$ BEGIN
    ALTER TABLE public.interactions 
    ALTER COLUMN channel TYPE interaction_channel USING channel::interaction_channel;
EXCEPTION
    WHEN others THEN null;
END $$;