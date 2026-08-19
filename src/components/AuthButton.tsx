"use client";

import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "./AuthProvider";

/** 제공자에 따라 채워지는 프로필 필드가 다르다. 아무것도 없으면 그냥 "내 계정". */
function displayName(metadata: Record<string, unknown>): string {
  for (const key of ["name", "preferred_username", "full_name", "nickname"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "내 계정";
}

/** 원형 안에 넣을 한 글자. 이모지처럼 두 칸을 차지하는 문자도 쪼개지지 않게 코드포인트로 자른다. */
function initial(name: string): string {
  return Array.from(name.trim())[0] ?? "?";
}

export function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // 환경변수가 아직 안 채워졌으면 로그인 자체가 불가능하니 버튼을 숨긴다.
  if (!isSupabaseConfigured) return null;

  // 세션 확인 중에는 자리만 잡아둔다 — 로그인 버튼이 떴다가 사라지는 깜빡임을 막는다.
  if (loading) {
    return <div className="size-11 animate-pulse rounded-full bg-surface" aria-hidden />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:border-foreground/40"
      >
        Google로 로그인
      </button>
    );
  }

  const name = displayName(user.user_metadata ?? {});

  return (
    <div className="relative shrink-0">
      {/* 헤더의 다른 요소가 전부 사각 상자라, 계정만 원형으로 두어 한눈에 갈리게 한다.
          이름을 통째로 쓰면 길이에 따라 헤더 폭이 흔들리는 문제도 같이 사라진다. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${name} 계정 메뉴`}
        title={name}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-sm font-medium hover:border-foreground/40"
      >
        <span aria-hidden>{initial(name)}</span>
      </button>

      {open && (
        <>
          {/* 바깥을 누르면 닫힌다 */}
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-lg">
            {/* 헤더에서 이름을 뺀 대신 여기서 어느 계정인지 확인할 수 있게 한다. */}
            <p className="truncate border-b border-border px-3 py-2 text-xs text-muted">{name}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full rounded-md px-3 py-2.5 text-left text-sm hover:bg-background"
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
