
-- 1) Create admin-only staging tables for safe imports

create table if not exists public.staging_clients (
  id uuid primary key default gen_random_uuid(),
  source text not null,         -- e.g., "Word_Clients"
  row_no integer,               -- optional, row tracking from your sheet
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  state text default 'GA',
  zip_code text,
  county text,
  notes text,
  matched_client_id uuid,       -- filled during matching
  status text default 'new',    -- 'new' | 'matched' | 'inserted' | 'error'
  error text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists public.staging_interactions (
  id uuid primary key default gen_random_uuid(),
  source text not null, 
  row_no integer,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  summary text,
  details text,
  channel text,                 -- e.g., 'phone','in_person','email'
  assistance_type text,         -- will be mapped to enum if valid
  occurred_at timestamptz,
  requested_amount numeric,
  approved_amount numeric,
  matched_client_id uuid,
  status text default 'new',
  error text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists public.staging_disbursements (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  row_no integer,
  client_first_name text,
  client_last_name text,
  client_email text,
  client_phone text,
  assistance_type text,         -- will be mapped to enum
  amount numeric,
  disbursement_date date,
  recipient_name text,
  payment_method text,          -- 'check','card','cash'...
  check_number text,
  notes text,
  matched_client_id uuid,
  status text default 'new',
  error text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists public.staging_donations (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  row_no integer,
  donor_name text,
  donor_email text,
  amount numeric,
  donation_date date,
  notes text,
  status text default 'new',
  error text,
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Enable RLS and restrict staging tables to admins only
alter table public.staging_clients enable row level security;
alter table public.staging_interactions enable row level security;
alter table public.staging_disbursements enable row level security;
alter table public.staging_donations enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staging_clients' and policyname='Admins manage staging_clients') then
    create policy "Admins manage staging_clients"
      on public.staging_clients
      for all
      using (has_role(auth.uid(),'admin'))
      with check (has_role(auth.uid(),'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staging_interactions' and policyname='Admins manage staging_interactions') then
    create policy "Admins manage staging_interactions"
      on public.staging_interactions
      for all
      using (has_role(auth.uid(),'admin'))
      with check (has_role(auth.uid(),'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staging_disbursements' and policyname='Admins manage staging_disbursements') then
    create policy "Admins manage staging_disbursements"
      on public.staging_disbursements
      for all
      using (has_role(auth.uid(),'admin'))
      with check (has_role(auth.uid(),'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='staging_donations' and policyname='Admins manage staging_donations') then
    create policy "Admins manage staging_donations"
      on public.staging_donations
      for all
      using (has_role(auth.uid(),'admin'))
      with check (has_role(auth.uid(),'admin'));
  end if;
end $$;

-- 2) Attach useful automations that appear to be missing

-- Set created_by automatically where applicable
do $$
begin
  if not exists (select 1 from pg_trigger where tgname='set_created_by_on_clients' and tgrelid='public.clients'::regclass) then
    create trigger set_created_by_on_clients
    before insert on public.clients
    for each row execute function public.set_created_by_public();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_created_by_on_interactions' and tgrelid='public.interactions'::regclass) then
    create trigger set_created_by_on_interactions
    before insert on public.interactions
    for each row execute function public.set_created_by_public();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_created_by_on_disbursements' and tgrelid='public.disbursements'::regclass) then
    create trigger set_created_by_on_disbursements
    before insert on public.disbursements
    for each row execute function public.set_created_by_public();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_created_by_on_donations' and tgrelid='public.donations'::regclass) then
    create trigger set_created_by_on_donations
    before insert on public.donations
    for each row execute function public.set_created_by_public();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_created_by_on_assistance_requests' and tgrelid='public.assistance_requests'::regclass) then
    create trigger set_created_by_on_assistance_requests
    before insert on public.assistance_requests
    for each row execute function public.set_created_by_public();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_created_by_on_public_intake' and tgrelid='public.public_intake'::regclass) then
    create trigger set_created_by_on_public_intake
    before insert on public.public_intake
    for each row execute function public.set_created_by_public();
  end if;
end $$;

-- Keep updated_at fresh
do $$
begin
  if not exists (select 1 from pg_trigger where tgname='set_updated_at_on_clients' and tgrelid='public.clients'::regclass) then
    create trigger set_updated_at_on_clients
    before update on public.clients
    for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_updated_at_on_interactions' and tgrelid='public.interactions'::regclass) then
    create trigger set_updated_at_on_interactions
    before update on public.interactions
    for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_updated_at_on_assistance_requests' and tgrelid='public.assistance_requests'::regclass) then
    create trigger set_updated_at_on_assistance_requests
    before update on public.assistance_requests
    for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_updated_at_on_public_intake' and tgrelid='public.public_intake'::regclass) then
    create trigger set_updated_at_on_public_intake
    before update on public.public_intake
    for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_updated_at_on_profiles' and tgrelid='public.profiles'::regclass) then
    create trigger set_updated_at_on_profiles
    before update on public.profiles
    for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname='set_updated_at_on_settings' and tgrelid='public.settings'::regclass) then
    create trigger set_updated_at_on_settings
    before update on public.settings
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- Keep client totals/risk level accurate when disbursements are inserted
do $$
begin
  if not exists (select 1 from pg_trigger where tgname='after_disbursement_insert_risk' and tgrelid='public.disbursements'::regclass) then
    create trigger after_disbursement_insert_risk
    after insert on public.disbursements
    for each row execute function public.update_client_risk_assessment();
  end if;
end $$;
