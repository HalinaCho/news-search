import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * 매 요청마다 Supabase 세션 토큰을 갱신한다.
 *
 * Next 16 에서 middleware 가 proxy 로 이름이 바뀌었다 — 파일명이 middleware.ts 면 실행되지 않는다.
 * (Supabase 공식 가이드는 아직 middleware.ts 기준이라 그대로 옮기면 조용히 로그아웃된다)
 *
 * 여기서 getUser() 를 부르지 않으면 만료된 토큰이 갱신되지 않아
 * 서버 컴포넌트가 간헐적으로 비로그인 상태를 보게 된다.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        // 갱신된 토큰을 이번 요청의 서버 컴포넌트도 볼 수 있도록 request 에 먼저 심고,
        // 그 request 로 응답을 다시 만든다.
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // 인증 쿠키가 실린 응답은 캐시되면 안 된다 — 캐시되면 남의 세션이 다른 사람에게 나간다.
        // 라이브러리가 넘겨주는 no-store 계열 헤더를 그대로 응답에 붙인다.
        // (response 를 새로 만든 뒤에 붙여야 덮어써지지 않는다)
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  // 정적 자산에는 돌릴 필요가 없다. 나머지 경로에서는 전부 세션을 갱신한다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
