-- Hồ sơ người chơi & bảng xếp hạng (thay cho Upstash Redis)
-- Chạy 1 lần trong Supabase → SQL Editor. Chạy lại cũng không sao.
-- Chỉ server (secret key) đọc/ghi được: bật RLS và không tạo policy nào cho anon.

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  name_lower text not null unique,
  avatar text not null default 'Qin',
  token_hash text not null,
  certs text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  board text not null,
  user_id text not null references public.profiles (id) on delete cascade,
  score bigint not null,
  updated_at timestamptz not null default now(),
  primary key (board, user_id)
);
create index if not exists scores_board_score_idx on public.scores (board, score desc, updated_at);

alter table public.profiles enable row level security;
alter table public.scores enable row level security;

-- Gửi kỷ lục: chỉ giữ điểm cao nhất của mỗi người trên mỗi bảng
-- p_scores = [{"board": "...", "score": 123}, ...]
create or replace function public.submit_scores(p_user text, p_scores jsonb)
returns integer
language sql
set search_path = ''
as $$
  with incoming as (
    select distinct on (e ->> 'board') e ->> 'board' as board, (e ->> 'score')::bigint as score
    from jsonb_array_elements(p_scores) e
    order by e ->> 'board', (e ->> 'score')::bigint desc
  ), saved as (
    insert into public.scores (board, user_id, score)
    select board, p_user, score from incoming
    on conflict (board, user_id) do update
      set score = excluded.score, updated_at = now()
      where public.scores.score < excluded.score
    returning 1
  )
  select count(*)::integer from saved;
$$;

-- Top N của một bảng + hạng của mình + tổng số người
-- Bằng điểm thì ai đạt trước xếp trên
create or replace function public.leaderboard(p_board text, p_me text default null, p_limit integer default 50)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ranked as (
    select s.user_id, s.score,
           row_number() over (order by s.score desc, s.updated_at, s.user_id) as rank
    from public.scores s
    where s.board = p_board
  ), rows as (
    select r.rank, jsonb_build_object('rank', r.rank, 'id', r.user_id, 'score', r.score,
             'name', p.name, 'avatar', p.avatar, 'certs', p.certs) as row,
           r.user_id
    from ranked r join public.profiles p on p.id = r.user_id
  )
  select jsonb_build_object(
    'count', (select count(*) from ranked),
    'rows', coalesce((select jsonb_agg(row order by rank) from rows where rank <= p_limit), '[]'::jsonb),
    'me', (select row from rows where user_id = p_me)
  );
$$;

revoke all on function public.submit_scores(text, jsonb) from public, anon, authenticated;
revoke all on function public.leaderboard(text, text, integer) from public, anon, authenticated;
grant execute on function public.submit_scores(text, jsonb) to service_role;
grant execute on function public.leaderboard(text, text, integer) to service_role;
