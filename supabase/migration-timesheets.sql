-- Migration: Create timesheets and timesheet_hours tables

create table public.timesheets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  total_hours numeric(6,2) not null default 0,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table public.timesheet_hours (
  id uuid default gen_random_uuid() primary key,
  timesheet_id uuid references public.timesheets(id) on delete cascade not null,
  hours_id uuid references public.hours(id) on delete cascade not null
);

alter table public.timesheets enable row level security;
alter table public.timesheet_hours enable row level security;

-- Same blanket authenticated policy used for all other tables
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['timesheets','timesheet_hours'])
  loop
    execute format('create policy "Authenticated read %s" on public.%I for select to authenticated using (true)', tbl, tbl);
    execute format('create policy "Authenticated insert %s" on public.%I for insert to authenticated with check (true)', tbl, tbl);
    execute format('create policy "Authenticated update %s" on public.%I for update to authenticated using (true)', tbl, tbl);
    execute format('create policy "Authenticated delete %s" on public.%I for delete to authenticated using (true)', tbl, tbl);
  end loop;
end $$;
