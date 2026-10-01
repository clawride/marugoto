-- Phòng chat chung: mọi người đọc được tin TRONG NGÀY (giờ Việt Nam), làm mới lúc 0:00 mỗi ngày.
-- Ghi tin chỉ qua API của server (/api/chat, secret key); trình duyệt chỉ đọc + nhận tin mới qua Supabase Realtime.

create or replace function public.chat_day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select (date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh')) at time zone 'Asia/Ho_Chi_Minh';
$$;
grant execute on function public.chat_day_start() to anon, authenticated, service_role;

create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id text not null references public.profiles (id) on delete cascade,
  name text not null,
  avatar text not null default 'i:fox',
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);
create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;
drop policy if exists "chat read today" on public.chat_messages;
create policy "chat read today" on public.chat_messages
  for select to anon, authenticated
  using (created_at >= public.chat_day_start());
revoke insert, update, delete on public.chat_messages from anon, authenticated;

-- nhận tin mới trực tiếp
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
