-- Mode difficulty configs. Code-level defaults live in src/modes/<id>/index.ts;
-- rows here are admin-edited overrides. A missing row falls through to the code
-- default at runtime — there is no need to seed this table.

create table if not exists public.mode_configs (
  id serial primary key,
  mode_id text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard','ngplus')),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (mode_id, difficulty)
);

create index if not exists mode_configs_mode_id_idx on public.mode_configs (mode_id);
