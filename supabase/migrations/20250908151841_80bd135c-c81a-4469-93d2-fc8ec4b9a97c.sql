-- Create client relationships table for linking family/household members
CREATE TABLE public.client_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  related_client_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'family', -- family, spouse, parent, child, sibling, etc.
  relationship_notes TEXT, -- memory aid notes about the relationship
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure we don't create duplicate relationships
  UNIQUE(client_id, related_client_id),
  -- Prevent self-relationships
  CHECK (client_id != related_client_id)
);

-- Enable RLS
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for client relationships
CREATE POLICY "Org admins and staff can view client relationships" 
ON public.client_relationships 
FOR SELECT 
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) AND org_user(auth.uid()));

CREATE POLICY "Org admins and staff can insert client relationships" 
ON public.client_relationships 
FOR INSERT 
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) AND org_user(auth.uid()));

CREATE POLICY "Org admins and staff can update client relationships" 
ON public.client_relationships 
FOR UPDATE 
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) AND org_user(auth.uid()));

CREATE POLICY "Org admins and staff can delete client relationships" 
ON public.client_relationships 
FOR DELETE 
USING ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role)) AND org_user(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_client_relationships_updated_at
BEFORE UPDATE ON public.client_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for created_by
CREATE TRIGGER set_client_relationships_created_by
BEFORE INSERT ON public.client_relationships
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by_public();

-- Create function to get all related clients (bidirectional)
CREATE OR REPLACE FUNCTION public.get_related_clients(p_client_id UUID)
RETURNS TABLE (
  client_id UUID,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  relationship_type TEXT,
  relationship_notes TEXT,
  last_interaction_date TIMESTAMP WITH TIME ZONE,
  last_interaction_summary TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH related_clients AS (
    -- Get clients where p_client_id is the main client
    SELECT 
      cr.related_client_id as client_id,
      cr.relationship_type,
      cr.relationship_notes
    FROM client_relationships cr
    WHERE cr.client_id = p_client_id
    
    UNION
    
    -- Get clients where p_client_id is the related client (bidirectional)
    SELECT 
      cr.client_id as client_id,
      cr.relationship_type,
      cr.relationship_notes
    FROM client_relationships cr
    WHERE cr.related_client_id = p_client_id
  ),
  latest_interactions AS (
    SELECT 
      i.client_id,
      i.occurred_at,
      i.summary,
      ROW_NUMBER() OVER (PARTITION BY i.client_id ORDER BY i.occurred_at DESC) as rn
    FROM interactions i
  )
  SELECT 
    c.id as client_id,
    c.first_name,
    c.last_name,
    c.phone,
    c.email,
    rc.relationship_type,
    rc.relationship_notes,
    li.occurred_at as last_interaction_date,
    li.summary as last_interaction_summary
  FROM related_clients rc
  JOIN clients c ON c.id = rc.client_id
  LEFT JOIN latest_interactions li ON li.client_id = c.id AND li.rn = 1
  ORDER BY c.first_name, c.last_name;
END;
$$;