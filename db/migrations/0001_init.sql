-- KeyBandit v1 schema (Neon)
-- Two monetization paths in mind: subscription tiers (profiles.plan) and
-- display ads (gated client-side via lib/plan.ts can('ads.hidden')).
--
-- Authorization is enforced in serverless API routes via WHERE user_id = $1
-- against the validated Neon Auth (Better Auth) session. RLS is intentionally
-- off; can be re-enabled later as defense-in-depth.

-- ── profiles ──────────────────────────────────────────────────────────────
-- Neon Auth (Better Auth) writes users into neon_auth.user(id uuid). Profiles
-- are lazily inserted from API routes on first authenticated request.
create table if not exists public.profiles (
  id uuid primary key references neon_auth.user(id) on delete cascade,
  display_name text,
  plan text not null default 'free',
  plan_expires_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);


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


-- ── sessions ──────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth.user(id) on delete cascade,
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


-- ── key_stats_user (lifetime aggregate per user per key) ──────────────────
create table if not exists public.key_stats_user (
  user_id uuid not null references neon_auth.user(id) on delete cascade,
  key text not null,
  presses bigint not null default 0,
  errors bigint not null default 0,
  total_latency_ms bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);


-- ── key_stats_session (per-session per-key) ───────────────────────────────
create table if not exists public.key_stats_session (
  session_id uuid not null references public.sessions on delete cascade,
  key text not null,
  presses int not null default 0,
  errors int not null default 0,
  total_latency_ms int not null default 0,
  primary key (session_id, key)
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
