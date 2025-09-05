-- Update existing clients with sample risk data for demonstration
UPDATE public.clients 
SET 
  risk_level = 'medium',
  assistance_count = 2,
  total_assistance_received = 850.00,
  last_assistance_date = CURRENT_DATE - INTERVAL '30 days'
WHERE id IN (
  SELECT id FROM public.clients LIMIT 2
);

-- Create a sample high-risk client alert
INSERT INTO public.client_alerts (client_id, alert_type, severity, message, metadata)
SELECT 
  c.id,
  'repeat_client',
  'high',
  'Client has received multiple assistance payments. Review recommended.',
  jsonb_build_object(
    'total_amount', 850.00,
    'assistance_count', 2,
    'last_assistance', CURRENT_DATE - INTERVAL '30 days'
  )
FROM public.clients c
WHERE c.assistance_count >= 2
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update settings to include accountability thresholds
INSERT INTO public.settings (key, value) VALUES
('accountability', jsonb_build_object(
  'max_assistance_per_client', 1000,
  'max_requests_per_year', 3,
  'review_threshold_amount', 500,
  'cooling_off_period_days', 90,
  'require_supervisor_approval', true
))
ON CONFLICT (key) DO UPDATE SET 
value = EXCLUDED.value;