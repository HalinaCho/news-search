/**
 * Supabase 접속 정보.
 *
 * anon key 는 브라우저에 그대로 노출되는 게 정상이다 — 네이버 API 키와 성격이 다르다.
 * 이 키로 할 수 있는 일은 RLS 정책이 허용하는 범위뿐이므로, 보안은 전적으로
 * `supabase/schema.sql` 의 RLS 에 달려 있다.
 *
 * NEXT_PUBLIC_ 변수는 빌드 시점에 문자열로 치환되므로 반드시 이렇게 통째로 적어야 한다.
 * (`process.env[name]` 처럼 동적으로 읽으면 치환되지 않고 undefined 가 된다)
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * 환경변수가 아직 안 채워졌으면 로그인 관련 UI만 접고 나머지는 그대로 돌린다.
 * 뉴스 검색은 Supabase 와 무관하므로, 설정이 비어 있다고 사이트 전체가 죽으면 안 된다.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
