-- Add client risk assessment fields
ALTER TABLE public.clients 
ADD COLUMN risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
ADD COLUMN total_assistance_received numeric DEFAULT 0,
ADD COLUMN assistance_count integer DEFAULT 0,
ADD COLUMN last_assistance_date date,
ADD COLUMN flagged_for_review boolean DEFAULT false,
ADD COLUMN review_reason text,
ADD COLUMN notes text;

-- Add outcome tracking to interactions
ALTER TABLE public.interactions
ADD COLUMN outcome text,
ADD COLUMN follow_up_required boolean DEFAULT false,
ADD COLUMN follow_up_date date,
ADD COLUMN success_rating integer CHECK (success_rating >= 1 AND success_rating <= 5),
ADD COLUMN impact_notes text;

-- Add demographic and grant tracking fields to assistance_requests
ALTER TABLE public.assistance_requests
ADD COLUMN household_size integer,
ADD COLUMN income_range text,
ADD COLUMN employment_status text,
ADD COLUMN housing_status text,
ADD COLUMN transportation_access boolean,
ADD COLUMN previous_assistance_count integer DEFAULT 0,
ADD COLUMN referral_source text,
ADD COLUMN outcome_category text,
ADD COLUMN success_achieved boolean;

-- Create client alerts table for notifications
CREATE TABLE public.client_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id),
  alert_type text NOT NULL CHECK (alert_type IN ('repeat_client', 'spending_limit', 'review_required', 'follow_up_due')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  metadata jsonb
);

-- Enable RLS on client_alerts
ALTER TABLE public.client_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for client_alerts
CREATE POLICY "Admins and staff can view client alerts" 
ON public.client_alerts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can insert client alerts" 
ON public.client_alerts 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins and staff can update client alerts" 
ON public.client_alerts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Create grant reporting table
CREATE TABLE public.grant_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_period_start date NOT NULL,
  report_period_end date NOT NULL,
  total_clients_served integer NOT NULL DEFAULT 0,
  total_assistance_amount numeric NOT NULL DEFAULT 0,
  unique_families_helped integer NOT NULL DEFAULT 0,
  repeat_client_percentage numeric,
  avg_assistance_per_client numeric,
  demographics jsonb,
  outcomes jsonb,
  narrative_summary text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on grant_reports
ALTER TABLE public.grant_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for grant_reports
CREATE POLICY "Admins can manage grant reports" 
ON public.grant_reports 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update client risk assessment
CREATE OR REPLACE FUNCTION public.update_client_risk_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client assistance totals when disbursement is added
  IF TG_TABLE_NAME = 'disbursements' AND TG_OP = 'INSERT' THEN
    UPDATE public.clients
    SET 
      total_assistance_received = COALESCE(total_assistance_received, 0) + NEW.amount,
      assistance_count = COALESCE(assistance_count, 0) + 1,
      last_assistance_date = NEW.disbursement_date
    WHERE id = NEW.client_id;
    
    -- Check if client should be flagged for review (more than $1000 total or 3+ requests)
    UPDATE public.clients
    SET 
      risk_level = CASE
        WHEN total_assistance_received > 1000 OR assistance_count >= 3 THEN 'high'
        WHEN total_assistance_received > 500 OR assistance_count >= 2 THEN 'medium'
        ELSE 'low'
      END,
      flagged_for_review = CASE
        WHEN total_assistance_received > 1000 OR assistance_count >= 3 THEN true
        ELSE flagged_for_review
      END,
      review_reason = CASE
        WHEN total_assistance_received > 1000 THEN 'Total assistance exceeds $1000'
        WHEN assistance_count >= 3 THEN 'Three or more assistance requests'
        ELSE review_reason
      END
    WHERE id = NEW.client_id;
    
    -- Create alert for high-risk clients
    INSERT INTO public.client_alerts (client_id, alert_type, severity, message, metadata)
    SELECT 
      c.id,
      'repeat_client',
      CASE 
        WHEN c.assistance_count >= 3 THEN 'high'
        WHEN c.assistance_count = 2 THEN 'medium'
        ELSE 'low'
      END,
      'Client has received ' || c.assistance_count || ' assistance payments totaling $' || c.total_assistance_received,
      jsonb_build_object(
        'total_amount', c.total_assistance_received,
        'assistance_count', c.assistance_count,
        'last_assistance', c.last_assistance_date
      )
    FROM public.clients c
    WHERE c.id = NEW.client_id 
      AND c.assistance_count >= 2
      AND NOT EXISTS (
        SELECT 1 FROM public.client_alerts ca 
        WHERE ca.client_id = c.id 
          AND ca.alert_type = 'repeat_client' 
          AND ca.is_active = true
      );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for disbursements
CREATE TRIGGER update_client_risk_on_disbursement
  AFTER INSERT ON public.disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_risk_assessment();