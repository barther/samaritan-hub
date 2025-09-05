-- Add financial amount fields to assistance_requests table
ALTER TABLE public.assistance_requests 
ADD COLUMN IF NOT EXISTS requested_amount numeric,
ADD COLUMN IF NOT EXISTS approved_amount numeric;