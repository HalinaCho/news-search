-- TechPulse — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행한다. 여러 번 실행해도 안전하다.
--
-- 저장하는 건 "내 개인 설정"뿐이다 — 뉴스 본문이나 기사 목록을 쌓아두지 않는다.
-- 기사 데이터는 여전히 매 요청 네이버 API에서 실시간으로 가져온다.
-- (북마크만 예외로 기사 스냅샷을 남긴다. 검색 결과에서 밀려나도 저장함에서 계속 보여야 하므로.)

-- ─────────────────────────────────────────────────────────────
-- 1. 읽은 기사
--    기사 식별자는 네이버 기사 URL(link). originallink 는 비어 있을 수 있어 키로 못 쓴다.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.read_articles (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  article_link text        not null,
  read_at      timestamptz not null default now(),
  primary key (user_id, article_link)
);

-- "내 읽은 기사 중 이 링크들"을 한 번에 조회하는 게 유일한 패턴이라 이 인덱스면 충분하다.
create index if not exists read_articles_user_read_at_idx
  on public.read_articles (user_id, read_at desc);

-- ─────────────────────────────────────────────────────────────
-- 2. 북마크 — 기사 스냅샷을 통째로 보관
-- ─────────────────────────────────────────────────────────────
create table if not exists public.bookmarks (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  article_link  text        not null,
  title         text        not null,
  description   text        not null default '',
  original_link text        not null default '',
  pub_date      text        not null default '',
  saved_at      timestamptz not null default now(),
  primary key (user_id, article_link)
);

create index if not exists bookmarks_user_saved_at_idx
  on public.bookmarks (user_id, saved_at desc);

-- ─────────────────────────────────────────────────────────────
-- 3. 키워드 설정 — 사용자당 한 행
--
--    카테고리를 정규화된 테이블로 쪼개지 않고 jsonb 한 칸에 담는다.
--    편집 UI가 하는 일이 추가·이름변경·삭제·순서변경이고 저장은 항상 통째로 덮어쓰기라,
--    행 단위로 쪼개면 순서 컬럼과 동기화 문제만 생기고 얻는 게 없다.
--    개별 키워드로 조회할 일도 없다.
--
--    categories: [{ "name": "기술트렌드", "keywords": ["AI", "로봇"] }, ...]
--    빈 배열은 "아직 안 건드림"이 아니라 "사용자가 다 지움"을 뜻한다.
--    기본값 폴백 여부는 행의 존재 유무로 판단한다 — 그래서 default 를 두지 않는다.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.keyword_settings (
  user_id            uuid        primary key references auth.users (id) on delete cascade,
  categories         jsonb       not null,
  updated_at         timestamptz not null default now(),

  -- 형태만 최소한으로 강제한다. 내용 검증은 앱에서 한다.
  constraint categories_is_array check (jsonb_typeof(categories) = 'array')
);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS — 세 테이블 모두 "내 행만" 읽고 쓸 수 있다.
--
--    이게 이 앱의 유일한 접근 제어다. anon key 는 브라우저에 그대로 노출되므로
--    RLS 가 꺼져 있으면 누구나 남의 북마크를 읽을 수 있다. 반드시 켜져 있어야 한다.
-- ─────────────────────────────────────────────────────────────
alter table public.read_articles   enable row level security;
alter table public.bookmarks       enable row level security;
alter table public.keyword_settings enable row level security;

drop policy if exists "read_articles: 본인 행만" on public.read_articles;
create policy "read_articles: 본인 행만" on public.read_articles
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "bookmarks: 본인 행만" on public.bookmarks;
create policy "bookmarks: 본인 행만" on public.bookmarks
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "keyword_settings: 본인 행만" on public.keyword_settings;
create policy "keyword_settings: 본인 행만" on public.keyword_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────
-- 기존 프로젝트 마이그레이션
--
-- 대시보드 페이지를 없애고 검색 화면을 루트로 옮기면서 dashboard_keywords 가 쓰이지 않게 됐다.
-- 위의 create table 은 "if not exists" 라 이미 만들어진 테이블에서는 컬럼을 지워주지 않으므로,
-- 예전에 스키마를 적용해 둔 프로젝트에서는 이 문장을 한 번 실행한다.
--
-- 이 컬럼은 not null 이고 기본값이 없다. 앱이 값을 안 보내기 시작하면 저장이 깨지므로
-- 새 코드를 배포하기 "전에" 실행해야 한다.
-- ─────────────────────────────────────────────────────────────
alter table public.keyword_settings drop column if exists dashboard_keywords;
