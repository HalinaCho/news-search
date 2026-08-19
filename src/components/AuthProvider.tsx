"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AUTH_NEXT_COOKIE, isSupabaseConfigured } from "@/lib/supabase/config";

interface AuthValue {
  user: User | null;
  /** 세션을 아직 확인하는 중. 로그인/로그아웃 버튼이 깜빡이지 않도록 쓴다. */
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Supabase 설정 전에는 확인할 세션 자체가 없으므로 로딩 상태로 두지 않는다.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createSupabaseBrowserClient();

    // 구독하는 즉시 INITIAL_SESSION 이 한 번 발생한다 — 초기 세션을 따로 조회할 필요가 없다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createSupabaseBrowserClient();

    // 로그인을 마치면 보고 있던 화면으로 그대로 돌아온다.
    // 이 값을 redirect_to 의 쿼리스트링으로 붙이면 안 된다 — Supabase 는 Redirect URLs 허용 목록을
    // 쿼리까지 포함한 전체 URL로 대조해서, 목록에 있는 ".../auth/callback" 과 어긋나 걸러진다.
    // (그러면 Site URL 로 폴백해 엉뚱한 사이트로 코드가 날아간다)
    // 그래서 쿠키로 넘긴다. 돌아오는 길은 최상위 GET 이동이라 SameSite=Lax 로도 함께 전달된다.
    const next = `${window.location.pathname}${window.location.search}`;
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=600; samesite=lax${secure}`;
    // 처음에는 카카오로 붙였다가 Google 로 바꿨다. Supabase 의 카카오 제공자가
    // account_email·profile_image 를 항상 요청하는데(넘긴 scopes 는 교체가 아니라 덧붙이기만 된다),
    // 그 둘을 켜려면 카카오 비즈니스 앱 전환과 심사가 필요해서 KOE205 를 피할 방법이 없었다.
    // Google 은 기본 스코프(email·profile)만으로 충분해 그런 제약이 없다.
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    // 서버 컴포넌트가 들고 있는 세션도 갱신되도록 새로 그린다.
    router.refresh();
  }, [router]);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthValue {
  const value = use(AuthContext);
  if (!value) throw new Error("useAuth 는 AuthProvider 안에서만 쓸 수 있다.");
  return value;
}
