-- SMS System Tables
-- Run this in Supabase SQL Editor AFTER the initial migration.sql

-- SMS Conversations (state machine for multi-turn confirm flow)
create table if not exists public.sms_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  state text not null default 'idle' check (state in ('idle', 'confirming', 'saved', 'cancelled', 'expired')),
  pending_data jsonb,
  pending_type text,
  last_session_id uuid references public.sessions on delete set null,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SMS Messages (audit log + debugging + cost tracking)
create table if not exists public.sms_messages (
  id uuid default gen_random_uuid() primary key,
  twilio_sid text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_number text not null,
  to_number text not null,
  body text,
  media_url text,
  user_id uuid references public.profiles on delete set null,
  conversation_id uuid references public.sms_conversations on delete set null,
  ai_parse_result jsonb,
  ai_model text,
  ai_confidence numeric(3,2),
  processing_time_ms integer,
  parse_method text check (parse_method in ('ai', 'regex', 'vision')),
  status text default 'received' check (status in ('received', 'parsed', 'confirmed', 'saved', 'failed', 'expired')),
  error_message text,
  created_at timestamptz default now()
);

-- RLS for new tables
alter table public.sms_conversations enable row level security;
alter table public.sms_messages enable row level security;

-- Same blanket policy as other tables (authenticated users get full access)
do $$
declare
  tbl text;
begin
  for tbl in select unnest(array['sms_conversations', 'sms_messages'])
  loop
    execute format('create policy "Authenticated read %s" on public.%I for select to authenticated using (true)', tbl, tbl);
    execute format('create policy "Authenticated insert %s" on public.%I for insert to authenticated with check (true)', tbl, tbl);
    execute format('create policy "Authenticated update %s" on public.%I for update to authenticated using (true)', tbl, tbl);
    execute format('create policy "Authenticated delete %s" on public.%I for delete to authenticated using (true)', tbl, tbl);
  end loop;
end $$;

-- Also allow anonymous inserts for the webhook (Twilio calls are unauthenticated)
-- The webhook validates via Twilio signature, not Supabase auth
create policy "Anon insert sms_messages" on public.sms_messages for insert to anon with check (true);
create policy "Anon insert sms_conversations" on public.sms_conversations for insert to anon with check (true);
create policy "Anon select sms_conversations" on public.sms_conversations for select to anon using (true);
create policy "Anon update sms_conversations" on public.sms_conversations for update to anon using (true);
create policy "Anon select sms_messages" on public.sms_messages for select to anon using (true);

-- Indexes
create index if not exists idx_sms_messages_user_id on public.sms_messages(user_id);
create index if not exists idx_sms_messages_created_at on public.sms_messages(created_at desc);
create index if not exists idx_sms_messages_twilio_sid on public.sms_messages(twilio_sid);
create index if not exists idx_sms_conversations_user_id_state on public.sms_conversations(user_id, state);
