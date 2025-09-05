-- Ensure RLS is enabled on public_intake
ALTER TABLE public.public_intake ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive public insert policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_intake' 
      AND policyname = 'Anyone can submit intake requests'
  ) THEN
    DROP POLICY "Anyone can submit intake requests" ON public.public_intake;
  END IF;
END $$;

-- Public can submit intake requests but only with safe defaults
CREATE POLICY "Public can submit intake requests (limited)"
ON public.public_intake
FOR INSERT
TO public
WITH CHECK (
  -- Allow admins/staff to bypass limitations
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'))
  OR
  -- For anonymous/public submissions, enforce safe initial state
  (
    status = 'pending'
    AND processed_by IS NULL
    AND processed_at IS NULL
    AND client_id IS NULL
    AND interaction_id IS NULL
    AND assistance_request_id IS NULL
  )
);

-- Explicit policy: Admins and staff can insert intake requests without restrictions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_intake' 
      AND policyname = 'Admins and staff can insert intake requests'
  ) THEN
    CREATE POLICY "Admins and staff can insert intake requests"
    ON public.public_intake
    FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
  END IF;
END $$;