-- Create assistance_requests table for the two-tier intake system
CREATE TABLE public.assistance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id),
  interaction_id uuid REFERENCES public.interactions(id),
  
  -- Tier 1 fields (public form)
  help_requested text,
  circumstances text,
  
  -- Tier 2 fields (staff triage form)
  rent_paid_3mo boolean,
  lease_in_name boolean,
  utility_in_name boolean,
  
  marital_status text,
  spouse_name text,
  spouse_phone text,
  spouse_email text,
  
  veteran_self boolean,
  veteran_spouse boolean,
  
  employer_self text,
  employer_self_phone text,
  employer_self_contact text,
  
  employer_spouse text,
  employer_spouse_phone text,
  employer_spouse_contact text,
  
  unemployed_self boolean,
  unemployed_spouse boolean,
  
  children_names_ages text,
  
  other_assistance_sources text,
  
  govt_aid_unemployment boolean,
  govt_aid_ss boolean,
  govt_aid_workers_comp boolean,
  govt_aid_disability boolean,
  govt_aid_other text,
  
  consent_given boolean,
  triage_completed_at timestamp with time zone,
  triaged_by_user_id text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.assistance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view all assistance requests"
ON public.assistance_requests
FOR SELECT
USING (true);

CREATE POLICY "Staff can insert assistance requests"
ON public.assistance_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Staff can update assistance requests"
ON public.assistance_requests
FOR UPDATE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assistance_requests_updated_at
BEFORE UPDATE ON public.assistance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_assistance_requests_client_id ON public.assistance_requests(client_id);
CREATE INDEX idx_assistance_requests_interaction_id ON public.assistance_requests(interaction_id);
CREATE INDEX idx_assistance_requests_triage_completed ON public.assistance_requests(triage_completed_at);

-- Add county field to clients table for Tier 1 form
ALTER TABLE public.clients ADD COLUMN county text;