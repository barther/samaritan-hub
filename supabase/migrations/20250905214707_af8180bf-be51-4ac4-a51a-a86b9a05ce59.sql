-- Additional security policies for remaining tables
BEGIN;

-- Enhance assistance_requests policies
DROP POLICY IF EXISTS "Admins and staff can view assistance requests" ON public.assistance_requests;
DROP POLICY IF EXISTS "Admins and staff can insert assistance requests" ON public.assistance_requests;  
DROP POLICY IF EXISTS "Admins and staff can update assistance requests" ON public.assistance_requests;

CREATE POLICY "Org admins and staff can view assistance requests" 
ON public.assistance_requests FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can insert assistance requests" 
ON public.assistance_requests FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can update assistance requests" 
ON public.assistance_requests FOR UPDATE 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

-- Enhance public_intake policies
DROP POLICY IF EXISTS "Admins and staff can view intake requests" ON public.public_intake;
DROP POLICY IF EXISTS "Admins and staff can insert intake requests" ON public.public_intake;
DROP POLICY IF EXISTS "Admins and staff can update intake requests" ON public.public_intake;

CREATE POLICY "Org admins and staff can view intake requests" 
ON public.public_intake FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can insert intake requests" 
ON public.public_intake FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can update intake requests" 
ON public.public_intake FOR UPDATE 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

-- Enhance settings policies
DROP POLICY IF EXISTS "Admins can view all settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;

CREATE POLICY "Org admins can view all settings" 
ON public.settings FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can insert settings" 
ON public.settings FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can update settings" 
ON public.settings FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

-- Enhance audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins and staff can insert audit logs" ON public.audit_logs;

CREATE POLICY "Org admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins and staff can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

-- Enhance client_alerts policies
DROP POLICY IF EXISTS "Admins and staff can view client alerts" ON public.client_alerts;
DROP POLICY IF EXISTS "Admins and staff can insert client alerts" ON public.client_alerts;
DROP POLICY IF EXISTS "Admins and staff can update client alerts" ON public.client_alerts;

CREATE POLICY "Org admins and staff can view client alerts" 
ON public.client_alerts FOR SELECT 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can insert client alerts" 
ON public.client_alerts FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

CREATE POLICY "Org admins and staff can update client alerts" 
ON public.client_alerts FOR UPDATE 
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) 
  AND public.org_user(auth.uid())
);

-- Enhance grant_reports policies  
DROP POLICY IF EXISTS "Admins can manage grant reports" ON public.grant_reports;

CREATE POLICY "Org admins can manage grant reports" 
ON public.grant_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

-- Enhance client_merges policies
DROP POLICY IF EXISTS "Admins can insert client merges" ON public.client_merges;
DROP POLICY IF EXISTS "Admins can view client merges" ON public.client_merges;

CREATE POLICY "Org admins can insert client merges" 
ON public.client_merges FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

CREATE POLICY "Org admins can view client merges" 
ON public.client_merges FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND public.org_user(auth.uid()));

COMMIT;