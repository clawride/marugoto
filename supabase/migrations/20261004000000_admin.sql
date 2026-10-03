-- Trang quản trị: khóa tài khoản, cấu hình trang web (banner, bảo trì, hệ số thưởng…) và nhật ký thao tác quản trị.
-- Chạy lại cũng không sao. Chỉ server (secret key) đọc/ghi được: bật RLS, không tạo policy cho anon.

alter table public.profiles add column if not exists banned boolean not null default false;
alter table public.profiles add column if not exists banned_reason text;

-- Cấu hình trang: mỗi khóa một dòng, value là JSON
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Nhật ký: ai (tên đăng nhập quản trị) làm gì với đối tượng nào
create table if not exists public.admin_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  admin text not null,
  action text not null,
  target text,
  detail jsonb
);
create index if not exists admin_log_at_idx on public.admin_log (at desc);

alter table public.site_settings enable row level security;
alter table public.admin_log enable row level security;
