-- Update disbursements table to include client_id for better tracking
ALTER TABLE public.disbursements ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create an index for better performance when querying disbursements by client
CREATE INDEX idx_disbursements_client_id ON public.disbursements(client_id);

-- Update the disbursements table to make interaction_id nullable since disbursements can be independent
ALTER TABLE public.disbursements ALTER COLUMN interaction_id DROP NOT NULL;