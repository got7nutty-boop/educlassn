create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  first_name text not null,
  last_name text not null default '',
  department text not null default '',
  subject text,
  level text,
  classroom text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
