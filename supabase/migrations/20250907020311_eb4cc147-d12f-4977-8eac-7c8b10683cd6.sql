-- Create stripe_payments table for tracking donations and fee coverage
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,              -- Net donation amount intended for org (in cents)
  fees_cents INTEGER NOT NULL DEFAULT 0,      -- Estimated Stripe fees (in cents)
  total_cents INTEGER GENERATED ALWAYS AS (amount_cents + fees_cents) STORED, -- Amount charged to donor
  currency TEXT NOT NULL DEFAULT 'usd',
  donor_email TEXT,
  donor_name TEXT,
  fees_covered BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',     -- pending | paid | canceled | failed
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Policies: only admins can read/update; inserts allowed (edge functions use service role)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stripe_payments' AND policyname='payments_insert_allowed'
  ) THEN
    CREATE POLICY payments_insert_allowed ON public.stripe_payments FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stripe_payments' AND policyname='payments_admin_select'
  ) THEN
    CREATE POLICY payments_admin_select ON public.stripe_payments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) AND org_user(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='stripe_payments' AND policyname='payments_admin_update'
  ) THEN
    CREATE POLICY payments_admin_update ON public.stripe_payments FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) AND org_user(auth.uid()));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_payments_session_id ON public.stripe_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON public.stripe_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_created_at ON public.stripe_payments(created_at);

-- Update trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_stripe_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_stripe_payments_updated_at
    BEFORE UPDATE ON public.stripe_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;