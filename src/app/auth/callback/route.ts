import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_NEXT_COOKIE } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google 로그인 후 돌아오는 지점. 인가 코드를 세션으로 교환하고 원래 보던 곳으로 돌려보낸다.
 *
 * 돌아갈 경로는 쿼리스트링이 아니라 쿠키로 받는다 — 이 라우트의 주소가 Supabase 의
 * Redirect URLs 허용 목록과 **정확히** 일치해야 하기 때문이다. 자세한 사정은
 * AUTH_NEXT_COOKIE 정의부에 적어 뒀다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const requested = cookieStore.get(AUTH_NEXT_COOKIE)?.value ?? "/";

  // 외부 도메인으로 튕겨보내는 오픈 리다이렉트를 막는다 —
  // "/" 로 시작하되 "//evil.com" 형태(프로토콜 상대 URL)는 아닌 값만 통과시킨다.
  const decoded = decodeURIComponent(requested);
  const next = decoded.startsWith("/") && !decoded.startsWith("//") ? decoded : "/";

  // Vercel 뒤에서는 origin 이 내부 주소로 잡히므로 실제 접속 호스트를 우선한다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  const redirect = (path: string) => {
    const response = NextResponse.redirect(`${base}${path}`);
    // 한 번 쓰고 버린다.
    response.cookies.delete(AUTH_NEXT_COOKIE);
    return response;
  };

  if (!code) return redirect("/?auth=failed");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] 세션 교환 실패:", error.message);
    return redirect("/?auth=failed");
  }

  return redirect(next);
}
