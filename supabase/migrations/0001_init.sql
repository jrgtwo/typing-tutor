-- KeyBandit v1 schema
-- Two monetization paths in mind: subscription tiers (profiles.plan) and
-- display ads (gated client-side via lib/plan.ts can('ads.hidden')).
-- See plan file: ~/.claude/plans/we-are-going-to-wise-lark.md

-- ── profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own (excluding plan)"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and plan = (select plan from public.profiles where id = auth.uid()));

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── content_items ─────────────────────────────────────────────────────────
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('prose','code')),
  title text not null,
  body text not null,
  language text,
  source text,
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  length_chars int generated always as (char_length(body)) stored,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists content_items_active_type_diff_idx
  on public.content_items (type, difficulty) where is_active;
create index if not exists content_items_lang_idx
  on public.content_items (language) where type = 'code';

alter table public.content_items enable row level security;

create policy "content_items: public read active"
  on public.content_items for select
  using (is_active = true);


-- ── sessions ──────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  content_item_id uuid references public.content_items on delete set null,
  mode text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_ms int,
  chars_typed int not null default 0,
  chars_correct int not null default 0,
  errors int not null default 0,
  wpm numeric(6,2),
  accuracy numeric(5,2),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists sessions_user_finished_idx
  on public.sessions (user_id, finished_at desc);

alter table public.sessions enable row level security;

create policy "sessions: own select" on public.sessions
  for select using (user_id = auth.uid());
create policy "sessions: own insert" on public.sessions
  for insert with check (user_id = auth.uid());
create policy "sessions: own update" on public.sessions
  for update using (user_id = auth.uid());


-- ── key_stats_user (lifetime aggregate per user per key) ──────────────────
create table if not exists public.key_stats_user (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  presses bigint not null default 0,
  errors bigint not null default 0,
  total_latency_ms bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.key_stats_user enable row level security;

create policy "key_stats_user: own select" on public.key_stats_user
  for select using (user_id = auth.uid());
create policy "key_stats_user: own upsert" on public.key_stats_user
  for insert with check (user_id = auth.uid());
create policy "key_stats_user: own update" on public.key_stats_user
  for update using (user_id = auth.uid());


-- ── key_stats_session (per-session per-key) ───────────────────────────────
create table if not exists public.key_stats_session (
  session_id uuid not null references public.sessions on delete cascade,
  key text not null,
  presses int not null default 0,
  errors int not null default 0,
  total_latency_ms int not null default 0,
  primary key (session_id, key)
);

alter table public.key_stats_session enable row level security;

create policy "key_stats_session: own select" on public.key_stats_session
  for select using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );
create policy "key_stats_session: own insert" on public.key_stats_session
  for insert with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );


-- ── keystrokes (full event log; not written in v1, schema present) ────────
create table if not exists public.keystrokes (
  session_id uuid not null references public.sessions on delete cascade,
  seq int not null,
  ts_ms int not null,
  key text not null,
  expected text,
  was_correct boolean not null,
  primary key (session_id, seq)
);

alter table public.keystrokes enable row level security;

create policy "keystrokes: own select" on public.keystrokes
  for select using (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );
create policy "keystrokes: own insert" on public.keystrokes
  for insert with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid())
  );
