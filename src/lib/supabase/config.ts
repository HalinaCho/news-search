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

/**
 * 로그인 후 돌아갈 경로를 담아 두는 쿠키.
 *
 * redirect_to 의 쿼리스트링으로 넘기지 않는 이유가 있다. Supabase 는 Redirect URLs 허용 목록을
 * 쿼리까지 포함한 전체 URL로 대조해서, 목록에 ".../auth/callback" 이 있어도
 * ".../auth/callback?next=%2F" 는 일치로 보지 않는다. 그러면 Site URL 로 폴백해
 * 인가 코드가 엉뚱한 사이트로 날아간다. (허용 목록에 /** 와일드카드를 쓰면 통과하지만,
 * 그건 열어주는 범위가 넓어지므로 목록은 좁게 두고 쿼리를 안 쓰는 쪽을 택했다)
 */
export const AUTH_NEXT_COOKIE = "tp-auth-next";
