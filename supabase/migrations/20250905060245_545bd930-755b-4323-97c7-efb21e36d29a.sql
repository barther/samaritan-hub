-- Create secure public intake system
-- This allows public form submissions without exposing operational tables

-- 1. Create public_intake table for secure form submissions
CREATE TABLE IF NOT EXISTS public.public_intake (
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
-- Anyone can submit (INSERT)
CREATE POLICY "Anyone can submit intake requests"
ON public.public_intake
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admin/staff can view intake requests
CREATE POLICY "Admins and staff can view intake requests"
ON public.public_intake
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Only admin/staff can update intake requests (for processing)
CREATE POLICY "Admins and staff can update intake requests"
ON public.public_intake
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- 3. Remove broad public insert policies from operational tables
-- These were causing security issues
DROP POLICY IF EXISTS "Anyone can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can insert interactions" ON public.interactions;
DROP POLICY IF EXISTS "Anyone can submit assistance requests" ON public.assistance_requests;

-- 4. Restore proper restrictive policies for operational tables
-- Clients
CREATE POLICY "Admins and staff can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Interactions  
CREATE POLICY "Admins and staff can insert interactions"
ON public.interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- Assistance Requests
CREATE POLICY "Admins and staff can insert assistance requests"
ON public.assistance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
);

-- 5. Add updated_at trigger for public_intake
CREATE TRIGGER update_public_intake_updated_at
  BEFORE UPDATE ON public.public_intake
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create index for efficient staff queries
CREATE INDEX idx_public_intake_status_created ON public.public_intake(status, created_at DESC);
CREATE INDEX idx_public_intake_processed ON public.public_intake(processed_at) WHERE processed_at IS NOT NULL;