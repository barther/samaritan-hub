-- Harden RLS on public.public_intake and ensure idempotent policy definitions

-- 1) Ensure RLS is enabled
ALTER TABLE public.public_intake ENABLE ROW LEVEL SECURITY;

-- 2) Drop obsolete/open policy if it exists
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

-- 3) Recreate the limited public insert policy to guarantee the correct definition
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_intake' 
      AND policyname = 'Public can submit intake requests (limited)'
  ) THEN
    DROP POLICY "Public can submit intake requests (limited)" ON public.public_intake;
  END IF;
END $$;

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

-- 4) Ensure the admin/staff unrestricted insert policy exists and matches expected definition
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'public_intake' 
      AND policyname = 'Admins and staff can insert intake requests'
  ) THEN
    DROP POLICY "Admins and staff can insert intake requests" ON public.public_intake;
  END IF;
END $$;

CREATE POLICY "Admins and staff can insert intake requests"
ON public.public_intake
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'staff'));
