-- Rode uma vez no Supabase: SQL Editor > New query > colar > Run.

create table if not exists public.captacao_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  client      text not null,
  date        date,
  location    text not null default '',
  type        text not null default 'outro',
  drive_url   text not null default '',
  notes       text not null default '',
  roteiro     text not null default '',
  plan        jsonb not null default '{}'::jsonb,
  checks      jsonb not null default '{}'::jsonb,
  custom      jsonb not null default '{"pre":[],"durante":[],"pos":[]}'::jsonb,
  created_by  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS ligado e sem policies: ninguém acessa pela chave pública.
-- Só as funções da Vercel (com a service role key) leem e gravam.
alter table public.captacao_events enable row level security;

-- Marca um item sem sobrescrever o que outra pessoa marcou ao mesmo tempo.
create or replace function public.captacao_set_check(p_id uuid, p_item text, p_val jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.captacao_events
     set checks = checks || jsonb_build_object(p_item, p_val),
         updated_at = now()
   where id = p_id;
$$;

revoke execute on function public.captacao_set_check(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.captacao_set_check(uuid, text, jsonb) to service_role;
