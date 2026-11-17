-- Which Way: one row per decision. Options, criteria and scores live in `data`.
-- data shape:
--   {
--     "options":  [{ "id": "...", "name": "..." }],
--     "criteria": [{ "id": "...", "name": "...", "weight": 1-5, "kind": "rating" }],
--     "scores":   { "<optionId>": { "<criterionId>": 1-5 } }
--   }
-- `kind` is always "rating" in v1; v2 can add real-number criteria.

create table public.decisions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default (auth.jwt() ->> 'sub'),
  title       text not null,
  data        jsonb not null default '{"options":[],"criteria":[],"scores":{}}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index decisions_user_id_idx on public.decisions (user_id);

alter table public.decisions enable row level security;

-- Only signed-in users (Clerk session token -> role "authenticated") get table access.
revoke all on public.decisions from anon;
grant select, insert, update, delete on public.decisions to authenticated;

-- (select auth.jwt()) is evaluated once per query instead of once per row.
create policy "decisions_select_own" on public.decisions
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);

create policy "decisions_insert_own" on public.decisions
  for insert to authenticated
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "decisions_update_own" on public.decisions
  for update to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id)
  with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "decisions_delete_own" on public.decisions
  for delete to authenticated
  using ((select auth.jwt() ->> 'sub') = user_id);
