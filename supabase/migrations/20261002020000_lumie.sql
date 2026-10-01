-- Lumie: chatbot trong phòng chat chung. Có hồ sơ riêng (không đăng nhập được: không có username, token không khớp với gì)
-- và cột reply_to để biết Lumie đang trả lời ai (giới hạn số câu mỗi người mỗi ngày).
insert into public.profiles (id, name, name_lower, avatar, token_hash)
values ('lumie', 'Lumie', 'lumie', 'i:star', 'bot-no-login')
on conflict (id) do nothing;

alter table public.chat_messages add column if not exists reply_to text;
create index if not exists chat_messages_reply_idx on public.chat_messages (reply_to, created_at desc) where reply_to is not null;
