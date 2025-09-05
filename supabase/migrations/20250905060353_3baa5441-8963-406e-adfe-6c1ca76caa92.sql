-- Create secure public intake system (fixed)
-- Handle existing policies properly

-- 1. Create public_intake table for secure form submissions
-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS public.public_intake CASCADE;

CREATE TABLE public.public_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Address information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'GA',
  zip_code TEXT NOT NULL,
  county TEXT,
  
  -- Request details
  help_needed TEXT NOT NULL,
  
  -- Metadata
  source TEXT NOT NULL DEFAULT 'web_form',
  user_agent TEXT,
  ip_address TEXT,
  
  -- Processing status
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  
  -- Link to created records (when processed)
  client_id UUID,
  interaction_id UUID,
  assistance_request_id UUID
);

-- Enable RLS on public_intake
ALTER TABLE public.public_intake ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for public_intake
CREATE POLICY "Anyone can submit intake requests"
ON public.public_intake
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins and staff can view intake requests"
ON public.public_intake
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

CREATE POLICY "Admins and staff can update intake requests"
ON public.public_intake
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- 3. Remove any broad public insert policies from operational tables
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can insert interactions" ON public.interactions;
DROP POLICY IF EXISTS "Anyone can submit assistance requests" ON public.assistance_requests;

-- 4. Create indexes for efficient staff queries
CREATE INDEX idx_public_intake_status_created ON public.public_intake(status, created_at DESC);
CREATE INDEX idx_public_intake_processed ON public.public_intake(processed_at) WHERE processed_at IS NOT NULL;