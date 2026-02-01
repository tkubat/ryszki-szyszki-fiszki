-- purpose: create recipes table for storing generated recipes per user with like flag
-- tables: creates public.recipes
-- columns: id, user_id, title, ingredients, steps, liked, created_at
-- notes: enforces ownership via rls; anon access explicitly denied; requires pgcrypto for gen_random_uuid

begin;

-- ensure uuid generation function is available
create extension if not exists "pgcrypto";

-- core table for recipes generated per user
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  ingredients text not null, -- ingredients kept as a single text field (comma-separated list incl. staples)
  steps text not null,       -- multi-line description of recipe steps
  liked boolean not null default false,
  created_at timestamptz not null default now()
);

-- index to speed up listing a user's recipes ordered by recency
create index if not exists idx_recipes_user_created_at on public.recipes (user_id, created_at desc);

-- enable rls to enforce per-user ownership
alter table public.recipes enable row level security;

-- rls policies: authenticated users can access only their own rows
create policy select_own_recipes_authenticated
  on public.recipes
  for select
  to authenticated
  using (user_id = auth.uid());

create policy insert_own_recipes_authenticated
  on public.recipes
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy update_own_recipes_authenticated
  on public.recipes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy delete_own_recipes_authenticated
  on public.recipes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- rls policies: anonymous role explicitly denied (using false) to avoid accidental access
create policy select_recipes_anon_denied
  on public.recipes
  for select
  to anon
  using (false);

create policy insert_recipes_anon_denied
  on public.recipes
  for insert
  to anon
  with check (false);

create policy update_recipes_anon_denied
  on public.recipes
  for update
  to anon
  using (false)
  with check (false);

create policy delete_recipes_anon_denied
  on public.recipes
  for delete
  to anon
  using (false);

commit;
