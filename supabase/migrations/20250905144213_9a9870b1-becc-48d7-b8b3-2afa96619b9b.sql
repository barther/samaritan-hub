DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'assistance_requests' 
      AND policyname = 'Admins and staff can insert assistance requests'
  ) THEN
    CREATE POLICY "Admins and staff can insert assistance requests"
    ON public.assistance_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'staff'::app_role)
    );
  END IF;
END $$;