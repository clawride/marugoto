-- Gửi tin chat: chống spam bằng đồng hồ của cơ sở dữ liệu (không phụ thuộc đồng hồ máy chủ web), khóa theo người gửi để
-- hai yêu cầu gửi cùng lúc không lọt qua; tiện tay dọn tin của các ngày trước.
create or replace function public.chat_post(p_user text, p_name text, p_avatar text, p_body text)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_last timestamptz;
  v_n integer;
  v_row public.chat_messages;
begin
  perform pg_advisory_xact_lock(hashtext('chat:' || p_user));
  select max(created_at), count(*) into v_last, v_n
    from public.chat_messages where user_id = p_user and created_at > now() - interval '5 minutes';
  if v_last is not null and v_last > now() - interval '2.5 seconds' then return jsonb_build_object('error', 'slow'); end if;
  if v_n >= 15 then return jsonb_build_object('error', 'burst'); end if;
  insert into public.chat_messages (user_id, name, avatar, body) values (p_user, p_name, p_avatar, p_body) returning * into v_row;
  delete from public.chat_messages where created_at < public.chat_day_start();
  return jsonb_build_object('message', to_jsonb(v_row));
end;
$$;
revoke all on function public.chat_post(text, text, text, text) from public, anon, authenticated;
grant execute on function public.chat_post(text, text, text, text) to service_role;
