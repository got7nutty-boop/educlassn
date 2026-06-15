-- ============================================================
--  EduClass — SQL แก้ไข (กรณี policy มีอยู่แล้ว)
--  รันอันนี้แทนไฟล์เดิมครับ
-- ============================================================

-- ลบ policy เก่าออกก่อน (ถ้ามี)
drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;

-- สร้าง policy ใหม่
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ตรวจสอบ trigger (drop แล้วสร้างใหม่เสมอ)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, first_name, last_name, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'department', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ดู user ทั้งหมดพร้อม UUID
select u.id, u.email, p.role, p.first_name, p.last_name
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;
