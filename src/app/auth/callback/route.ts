import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google 로그인 후 돌아오는 지점. 인가 코드를 세션으로 교환하고 원래 보던 곳으로 돌려보낸다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // 로그인 후 돌아갈 경로. 외부 도메인으로 튕겨보내는 오픈 리다이렉트를 막기 위해
  // "/" 로 시작하되 "//evil.com" 형태(프로토콜 상대 URL)는 아닌 값만 통과시킨다.
  const requested = searchParams.get("next") ?? "/";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  // Vercel 뒤에서는 origin 이 내부 주소로 잡히므로 실제 접속 호스트를 우선한다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  if (!code) return NextResponse.redirect(`${base}/?auth=failed`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] 세션 교환 실패:", error.message);
    return NextResponse.redirect(`${base}/?auth=failed`);
  }

  return NextResponse.redirect(`${base}${next}`);
}
