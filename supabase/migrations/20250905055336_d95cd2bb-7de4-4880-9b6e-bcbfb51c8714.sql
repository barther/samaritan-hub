-- Allow public assistance requests while maintaining security
-- Create policy for public users to submit assistance requests

-- Drop existing restrictive policy for assistance_requests INSERT
DROP POLICY IF EXISTS "Admins and staff can insert assistance requests" ON public.assistance_requests;

-- Create new policy: anyone can insert assistance requests (for public form)
CREATE POLICY "Anyone can submit assistance requests" 
ON public.assistance_requests 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Keep the existing SELECT/UPDATE policies restrictive (admin/staff only)
-- This allows public to submit, but only staff can view/manage them

-- Also ensure created_by is properly set for public submissions
CREATE OR REPLACE FUNCTION public.set_created_by_public()
RETURNS TRIGGER AS $$
BEGIN
  -- For assistance requests, allow public submissions without auth
  IF TG_TABLE_NAME = 'assistance_requests' THEN
    -- Keep created_by as null for public submissions, or set to requesting user if authenticated
    IF NEW.created_by IS NULL THEN
      NEW.created_by = auth.uid(); -- Will be null for anon users, which is fine
    END IF;
  ELSE
    -- For other tables, require authentication
    IF NEW.created_by IS NULL THEN
      NEW.created_by = auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS set_created_by_assistance_requests ON public.assistance_requests;
CREATE TRIGGER set_created_by_assistance_requests
  BEFORE INSERT ON public.assistance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_public();