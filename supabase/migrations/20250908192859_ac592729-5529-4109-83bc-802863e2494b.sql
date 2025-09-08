-- Add assistance_request_id to disbursements table to link disbursements to specific triage requests
ALTER TABLE public.disbursements 
ADD COLUMN assistance_request_id UUID REFERENCES public.assistance_requests(id);

-- Create index for better performance
CREATE INDEX idx_disbursements_assistance_request_id ON public.disbursements(assistance_request_id);

-- Add trigger to update client statistics more accurately
CREATE OR REPLACE FUNCTION update_client_assistance_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client stats based on actual disbursements, not requests
  UPDATE public.clients 
  SET 
    assistance_count = (
      SELECT COUNT(DISTINCT d.id) 
      FROM public.disbursements d 
      WHERE d.client_id = COALESCE(NEW.client_id, OLD.client_id)
    ),
    total_assistance_received = (
      SELECT COALESCE(SUM(d.amount), 0) 
      FROM public.disbursements d 
      WHERE d.client_id = COALESCE(NEW.client_id, OLD.client_id)
    ),
    last_assistance_date = (
      SELECT MAX(d.disbursement_date) 
      FROM public.disbursements d 
      WHERE d.client_id = COALESCE(NEW.client_id, OLD.client_id)
    )
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for disbursement inserts, updates, and deletes
DROP TRIGGER IF EXISTS update_client_stats_on_disbursement ON public.disbursements;
CREATE TRIGGER update_client_stats_on_disbursement
  AFTER INSERT OR UPDATE OR DELETE ON public.disbursements
  FOR EACH ROW
  EXECUTE FUNCTION update_client_assistance_stats();