-- =====================================================================
-- 마음서랍 앱: 익명 사용자 · 마음체크 점수 · 마을 공유 · 성과 집계
-- Supabase 프로젝트(loneliness) SQL Editor에서 한 번 실행하세요.
--
-- [먼저 할 일] Supabase 대시보드 → Authentication → Sign In / Providers
--   → "Allow anonymous sign-ins" 켜기
--   가입 화면 없이 기기마다 익명 계정이 하나씩 생기고(auth.uid()),
--   그 번호로 "내 기록은 나만 쓰고 볼 수 있게" 막을 수 있어요.
--
-- [저장하지 않는 것] 일기 본문, 실명, 전화번호, 이메일 — 이 파일 어디에도 없어요.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. 관리자 목록 (성과 대시보드를 볼 수 있는 계정)
--    기존 관리자 로그인(이메일/비밀번호) 계정의 user id를 직접 넣어요:
--    insert into mdr_admins (user_id) values ('관리자-계정-uuid');
-- ---------------------------------------------------------------------
create table if not exists mdr_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table mdr_admins enable row level security;
-- 정책 없음 = 앱에서는 읽기/쓰기 불가 (SQL Editor에서만 관리)

create or replace function mdr_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from mdr_admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 1. 프로필: 별명 · 캐릭터 · (선택) 센터 참여 코드
-- ---------------------------------------------------------------------
create table if not exists mdr_profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nick text not null check (char_length(nick) between 2 and 10),
  avatar jsonb not null default '{}'::jsonb,         -- { color, hat, acc }
  center_code text check (center_code is null or char_length(center_code) <= 20),  -- 센터가 나눠준 참여 코드
  age_band text check (age_band in ('under14', '14to18', '19to24', 'over24')),
  guardian_consent boolean not null default false,   -- 만 14세 미만이면 보호자 동의 필요
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table mdr_profiles enable row level security;

drop policy if exists "profiles own select" on mdr_profiles;
create policy "profiles own select" on mdr_profiles for select to authenticated using (id = auth.uid() or mdr_is_admin());
drop policy if exists "profiles own insert" on mdr_profiles;
create policy "profiles own insert" on mdr_profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles own update" on mdr_profiles;
create policy "profiles own update" on mdr_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 마을에서 다른 사람에게 보여도 되는 것만 (별명 · 캐릭터)
create or replace view mdr_public_profiles with (security_invoker = false) as
  select id, nick, avatar from mdr_profiles;
revoke all on mdr_public_profiles from anon;
grant select on mdr_public_profiles to authenticated;

-- ---------------------------------------------------------------------
-- 2. 마음체크 점수 (해소율 계산의 기준)
--    kind: 'quick3'(첫 실행 3문항, 3~9점) | 'lsis' 등 센터 척도
-- ---------------------------------------------------------------------
create table if not exists mdr_checks (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('quick3', 'lsis', 'ucla20')),
  score smallint not null check (score between 0 and 100),
  items smallint[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table mdr_checks enable row level security;

drop policy if exists "checks own insert" on mdr_checks;
create policy "checks own insert" on mdr_checks for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "checks own or admin select" on mdr_checks;
create policy "checks own or admin select" on mdr_checks for select to authenticated using (user_id = auth.uid() or mdr_is_admin());
create index if not exists mdr_checks_user_idx on mdr_checks (user_id, created_at);

-- ---------------------------------------------------------------------
-- 3. 하루 활동 수 (내용 없이 숫자만) — "많이 쓴 사람일수록 더 나아졌나" 분석용
-- ---------------------------------------------------------------------
create table if not exists mdr_activity (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  notes smallint not null default 0,       -- 마음일기 쪽지 수
  cards smallint not null default 0,       -- 마음카드 받은 수
  cheers smallint not null default 0,      -- 보낸 응원 수
  posts smallint not null default 0,       -- 날씨 마을에 남긴 마음 수
  visits smallint not null default 0,      -- 마을 방문 수
  primary key (user_id, day)
);
alter table mdr_activity enable row level security;

drop policy if exists "activity own write" on mdr_activity;
create policy "activity own write" on mdr_activity for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "activity own update" on mdr_activity;
create policy "activity own update" on mdr_activity for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "activity own or admin select" on mdr_activity;
create policy "activity own or admin select" on mdr_activity for select to authenticated using (user_id = auth.uid() or mdr_is_admin());

-- ---------------------------------------------------------------------
-- 4. 날씨 마을에 남긴 마음 (다른 사람에게 보임: 별명 + 고른 말 + 한 줄)
-- ---------------------------------------------------------------------
create table if not exists mdr_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weather text not null check (weather in ('sunny', 'cloudy', 'rain', 'storm')),
  word text not null check (char_length(word) between 1 and 10),
  line text check (line is null or char_length(line) <= 20),
  pos_x real, pos_z real,                  -- 마을 안 깃발 위치
  hidden boolean not null default false,   -- 신고 처리로 숨김
  created_at timestamptz not null default now()
);
alter table mdr_posts enable row level security;

drop policy if exists "posts recent select" on mdr_posts;
create policy "posts recent select" on mdr_posts for select to authenticated
  using ((not hidden and created_at > now() - interval '24 hours') or user_id = auth.uid() or mdr_is_admin());
drop policy if exists "posts own insert" on mdr_posts;
create policy "posts own insert" on mdr_posts for insert to authenticated with check (user_id = auth.uid() and hidden = false);
drop policy if exists "posts own delete" on mdr_posts;
create policy "posts own delete" on mdr_posts for delete to authenticated using (user_id = auth.uid());
drop policy if exists "posts admin hide" on mdr_posts;
create policy "posts admin hide" on mdr_posts for update to authenticated using (mdr_is_admin()) with check (mdr_is_admin());
create index if not exists mdr_posts_recent_idx on mdr_posts (weather, created_at desc);

-- ---------------------------------------------------------------------
-- 5. 응원 (정해진 말만, 같은 사람에게 하루 한 번)
-- ---------------------------------------------------------------------
create table if not exists mdr_cheers (
  id bigint generated always as identity primary key,
  from_user uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  cheer text not null check (cheer in ('hug', 'proud', 'good', 'flower')),
  day date not null default (now() at time zone 'Asia/Seoul')::date,
  created_at timestamptz not null default now(),
  unique (from_user, to_user, day),
  check (from_user <> to_user)
);
alter table mdr_cheers enable row level security;

drop policy if exists "cheers own insert" on mdr_cheers;
create policy "cheers own insert" on mdr_cheers for insert to authenticated
  with check (from_user = auth.uid() and day = (now() at time zone 'Asia/Seoul')::date);
drop policy if exists "cheers mine select" on mdr_cheers;
create policy "cheers mine select" on mdr_cheers for select to authenticated using (to_user = auth.uid() or from_user = auth.uid());

-- ---------------------------------------------------------------------
-- 6. 신고 (마을 글 · 사용자) — 관리자만 확인
-- ---------------------------------------------------------------------
create table if not exists mdr_reports (
  id bigint generated always as identity primary key,
  reporter uuid not null default auth.uid() references auth.users (id) on delete cascade,
  post_id bigint references mdr_posts (id) on delete cascade,
  target_user uuid references auth.users (id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 100),
  created_at timestamptz not null default now(),
  check (post_id is not null or target_user is not null)
);
alter table mdr_reports enable row level security;

drop policy if exists "reports own insert" on mdr_reports;
create policy "reports own insert" on mdr_reports for insert to authenticated with check (reporter = auth.uid());
drop policy if exists "reports admin select" on mdr_reports;
create policy "reports admin select" on mdr_reports for select to authenticated using (mdr_is_admin());

-- ---------------------------------------------------------------------
-- 7. 성과 집계 (관리자만) — 개인 기록이 아니라 합계만 돌려줘요
--    해소 기준(임시, 센터 확인 필요):
--      quick3: 처음 점수 6점 이상(외로움 높음) → 21일 이상 지난 재검사에서 5점 이하
-- ---------------------------------------------------------------------
create or replace function mdr_outcome_summary(p_kind text default 'quick3', p_center text default null)
returns table (
  participants bigint,      -- 마음체크를 한 번이라도 한 사람
  eligible bigint,          -- 처음 점수가 높았던 사람
  followed_up bigint,       -- 그중 21일 뒤 재검사를 한 사람
  resolved bigint,          -- 그중 낮아진 사람
  resolution_rate numeric   -- resolved / followed_up
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not mdr_is_admin() then raise exception 'admin only'; end if;
  return query
  with c as (
    select k.user_id, k.score, k.created_at,
           first_value(k.score) over w as first_score,
           first_value(k.created_at) over w as first_at
    from mdr_checks k
    join mdr_profiles p on p.id = k.user_id
    where k.kind = p_kind and (p_center is null or p.center_code = p_center)
    window w as (partition by k.user_id order by k.created_at)
  ),
  per as (
    select user_id,
           min(first_score) as first_score,
           (array_agg(score order by created_at desc) filter (where created_at >= first_at + interval '21 days'))[1] as later_score
    from c group by user_id
  )
  select count(*),
         count(*) filter (where first_score >= 6),
         count(*) filter (where first_score >= 6 and later_score is not null),
         count(*) filter (where first_score >= 6 and later_score is not null and later_score <= 5),
         round(
           count(*) filter (where first_score >= 6 and later_score is not null and later_score <= 5)::numeric
           / nullif(count(*) filter (where first_score >= 6 and later_score is not null), 0), 4)
  from per;
end;
$$;
revoke all on function mdr_outcome_summary(text, text) from public, anon;
grant execute on function mdr_outcome_summary(text, text) to authenticated;
