import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * 서버 컴포넌트·라우트 핸들러용 클라이언트. 요청마다 새로 만든다 (절대 재사용 금지).
 * Next 16 부터 cookies() 동기 접근이 제거돼 await 가 필수다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
          // 토큰 갱신은 proxy.ts 가 대신 처리하므로 여기서는 무시해도 안전하다.
        }
      },
    },
  });
}
