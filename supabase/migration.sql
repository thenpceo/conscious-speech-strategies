-- Conscious Speech Strategies - Admin Dashboard Schema
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  phone text,
  rate_per_hour numeric(10,2),
  internal_rate numeric(10,2),
  external_rate numeric(10,2),
  created_at timestamptz default now()
);

-- Schools
create table public.schools (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text,
  contact_name text,
  contact_email text,
  created_at timestamptz default now()
);

-- Students
create table public.students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  school_id uuid references public.schools on delete cascade not null,
  iep_date date,
  notes text,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz default now(),
  archived boolean default false
);

-- Goals
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students on delete cascade not null,
  goal_number integer not null,
  description text not null,
  iep_year text,
  created_at timestamptz default now(),
  archived boolean default false
);

-- Sessions
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students on delete cascade not null,
  date date not null default current_date,
  entered_by uuid references public.profiles on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- Session Goals (per-goal data within a session)
create table public.session_goals (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions on delete cascade not null,
  goal_id uuid references public.goals on delete cascade not null,
  correct_count integer not null default 0,
  total_count integer not null default 0,
  percentage numeric(5,2) generated always as (
    case when total_count > 0 then (correct_count::numeric / total_count * 100) else 0 end
  ) stored,
  notes text
);

-- Hours tracking
create table public.hours (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  school_id uuid references public.schools on delete cascade not null,
  date date not null default current_date,
  hours numeric(5,2) not null,
  description text,
  created_at timestamptz default now()
);

-- Invoices
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  school_id uuid references public.schools on delete cascade not null,
  period_start date not null,
  period_end date not null,
  total_amount numeric(10,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  created_at timestamptz default now()
);

-- Invoice line items
create table public.invoice_lines (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices on delete cascade not null,
  user_id uuid references public.profiles on delete set null,
  date date not null,
  hours numeric(5,2) not null,
  rate numeric(10,2) not null,
  amount numeric(10,2) not null,
  description text
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.students enable row level security;
alter table public.goals enable row level security;
alter table public.sessions enable row level security;
alter table public.session_goals enable row level security;
alter table public.hours enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;

-- RLS Policies: authenticated users can read/write everything
-- (Rachel's team is small, so we keep it simple — all logged-in users have full access)
create policy "Authenticated users can read all" on public.profiles for select to authenticated using (true);
create policy "Authenticated users can update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "Authenticated users can insert profile" on public.profiles for insert to authenticated with check (id = auth.uid());

-- For all other tables: full access for authenticated users
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['schools','students','goals','sessions','session_goals','hours','invoices','invoice_lines'])
  loop
    execute format('create policy "Authenticated read %s" on public.%I for select to authenticated using (true)', tbl, tbl);
    execute format('create policy "Authenticated insert %s" on public.%I for insert to authenticated with check (true)', tbl, tbl);
    execute format('create policy "Authenticated update %s" on public.%I for update to authenticated using (true)', tbl, tbl);
    execute format('create policy "Authenticated delete %s" on public.%I for delete to authenticated using (true)', tbl, tbl);
  end loop;
end $$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'staff');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
