-- Tighten RLS for user_sessions INSERT to prevent unrestricted session creation
-- 1) Drop overly-permissive policy
DROP POLICY IF EXISTS "System can insert sessions" ON public.user_sessions;

-- 2) Create strict INSERT policy: only authenticated org users may insert their OWN session rows
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND org_user(auth.uid())
);
