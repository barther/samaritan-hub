-- Create stripe_payments table for tracking payment information with fraud protection
CREATE TABLE public.stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  amount_dollars NUMERIC(10,2) GENERATED ALWAYS AS (amount_cents::numeric / 100) STORED,
  fees_cents INTEGER DEFAULT 0,
  fees_dollars NUMERIC(10,2) GENERATED ALWAYS AS (fees_cents::numeric / 100) STORED,
  total_cents INTEGER GENERATED ALWAYS AS (amount_cents + fees_cents) STORED,
  total_dollars NUMERIC(10,2) GENERATED ALWAYS AS (total_cents::numeric / 100) STORED,
  currency TEXT DEFAULT 'usd',
  donor_email TEXT,
  donor_name TEXT,
  fees_covered BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Fraud prevention fields
  ip_address TEXT,
  user_agent TEXT,
  billing_country TEXT,
  card_country TEXT,
  risk_score INTEGER,
  cvc_check TEXT,
  avs_check TEXT,
  fraud_score INTEGER,
  fraud_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Anyone can insert payment records" 
ON public.stripe_payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Org admins can view all payments" 
ON public.stripe_payments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND org_user(auth.uid()));

CREATE POLICY "Org admins can update payments" 
ON public.stripe_payments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND org_user(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_stripe_payments_session_id ON public.stripe_payments(stripe_session_id);
CREATE INDEX idx_stripe_payments_status ON public.stripe_payments(status);
CREATE INDEX idx_stripe_payments_created_at ON public.stripe_payments(created_at);

-- Create trigger for updating timestamps
CREATE TRIGGER update_stripe_payments_updated_at
BEFORE UPDATE ON public.stripe_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();