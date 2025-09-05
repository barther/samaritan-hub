-- Create settings table
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can manage settings
CREATE POLICY "Admins can view all settings" 
ON public.settings 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings" 
ON public.settings 
FOR INSERT 
TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings" 
ON public.settings 
FOR UPDATE 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
('financial', '{"lowFundThreshold": 100, "defaultAssistanceAmount": 200}'),
('system', '{"autoArchiveInteractions": true, "requireClientLink": false, "dataRetentionMonths": 36, "enableAuditLog": true}'),
('notifications', '{"emailNotifications": true, "lowFundAlerts": true, "newRequestAlerts": true}'),
('email_templates', '{"approvalEmailTemplate": "Dear {client_name},\n\nYour request for {assistance_type} assistance has been approved for ${amount}.\n\nPlease contact us at your earliest convenience to arrange disbursement.\n\nBest regards,\nGood Samaritan Assistance Team", "denialEmailTemplate": "Dear {client_name},\n\nThank you for your assistance request. Unfortunately, we are unable to approve your request at this time due to {reason}.\n\nPlease feel free to contact us if your circumstances change.\n\nBest regards,\nGood Samaritan Assistance Team"}');