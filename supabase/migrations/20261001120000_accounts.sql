-- Tài khoản đăng nhập (username + mật khẩu), phiên nhiều thiết bị và lưu tiến độ học lên đám mây.
-- Chạy lại cũng không sao. Chỉ server (secret key) đọc/ghi được: bật RLS, không tạo policy cho anon.

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists username_lower text;
alter table public.profiles add column if not exists password_hash text;
alter table public.profiles add column if not exists failed_logins integer not null default 0;
alter table public.profiles add column if not exists locked_until timestamptz;
create unique index if not exists profiles_username_lower_key on public.profiles (username_lower);

-- Mỗi lần đăng nhập ở một thiết bị tạo một token riêng (token đăng ký ban đầu vẫn nằm ở profiles.token_hash)
create table if not exists public.profile_tokens (
  token_hash text primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists profile_tokens_user_idx on public.profile_tokens (user_id);

-- Tiến độ học của tài khoản. rev tăng 1 mỗi lần lưu, để phát hiện hai thiết bị ghi chồng nhau
create table if not exists public.saves (
  user_id text primary key references public.profiles (id) on delete cascade,
  data jsonb not null,
  rev bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.profile_tokens enable row level security;
alter table public.saves enable row level security;

-- Lưu tiến độ có kiểm tra phiên bản: chỉ ghi khi p_base khớp rev hiện tại (hoặc p_force)
create or replace function public.put_save(p_user text, p_data jsonb, p_base bigint, p_force boolean default false)
returns jsonb
language sql
set search_path = ''
as $$
  with up as (
    insert into public.saves (user_id, data, rev) values (p_user, p_data, 1)
    on conflict (user_id) do update
      set data = excluded.data, rev = public.saves.rev + 1, updated_at = now()
      where p_force or public.saves.rev = p_base
    returning rev, updated_at
  )
  select coalesce(
    (select jsonb_build_object('ok', true, 'rev', rev, 'updatedAt', updated_at) from up),
    (select jsonb_build_object('ok', false, 'rev', rev, 'updatedAt', updated_at) from public.saves where user_id = p_user)
  );
$$;

revoke all on function public.put_save(text, jsonb, bigint, boolean) from public, anon, authenticated;
grant execute on function public.put_save(text, jsonb, bigint, boolean) to service_role;
