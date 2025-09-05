-- Create enum types for better data integrity
CREATE TYPE public.interaction_channel AS ENUM ('public_form', 'phone', 'email', 'in_person', 'text');
CREATE TYPE public.interaction_status AS ENUM ('new', 'in_progress', 'completed', 'closed');
CREATE TYPE public.assistance_type AS ENUM ('rent', 'utilities', 'food', 'medical', 'transportation', 'other');

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'GA',
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create interactions table
CREATE TABLE public.interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  channel interaction_channel NOT NULL,
  summary TEXT NOT NULL,
  details TEXT,
  status interaction_status NOT NULL DEFAULT 'new',
  assistance_type assistance_type,
  requested_amount DECIMAL(10,2),
  approved_amount DECIMAL(10,2),
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id)
);

-- Create donations table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  source TEXT NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create disbursements table
CREATE TABLE public.disbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  assistance_type assistance_type NOT NULL,
  recipient_name TEXT NOT NULL,
  disbursement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'check',
  check_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff access (authenticated users with @lithiaspringsmethodist.org email)
CREATE POLICY "Staff can view all clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Staff can view all interactions" ON public.interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert interactions" ON public.interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update interactions" ON public.interactions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Staff can view all donations" ON public.donations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update donations" ON public.donations FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Staff can view all disbursements" ON public.disbursements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert disbursements" ON public.disbursements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update disbursements" ON public.disbursements FOR UPDATE TO authenticated USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_clients_name ON public.clients(first_name, last_name);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_phone ON public.clients(phone);
CREATE INDEX idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX idx_interactions_status ON public.interactions(status);
CREATE INDEX idx_interactions_occurred_at ON public.interactions(occurred_at DESC);
CREATE INDEX idx_donations_date ON public.donations(donation_date DESC);
CREATE INDEX idx_disbursements_date ON public.disbursements(disbursement_date DESC);