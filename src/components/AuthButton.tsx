"use client";

import Link from "next/link";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "./AuthProvider";
import { useUserData } from "./UserDataProvider";

/** 제공자에 따라 채워지는 프로필 필드가 다르다. 아무것도 없으면 그냥 "내 계정". */
function displayName(metadata: Record<string, unknown>): string {
  for (const key of ["name", "preferred_username", "full_name", "nickname"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "내 계정";
}

export function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();
  const { bookmarks } = useUserData();
  const [open, setOpen] = useState(false);

  // 환경변수가 아직 안 채워졌으면 로그인 자체가 불가능하니 버튼을 숨긴다.
  if (!isSupabaseConfigured) return null;

  // 세션 확인 중에는 자리만 잡아둔다 — 로그인 버튼이 떴다가 사라지는 깜빡임을 막는다.
  if (loading) {
    return <div className="h-11 w-24 animate-pulse rounded-lg bg-surface" aria-hidden />;
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

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex min-h-11 max-w-36 items-center rounded-lg border border-border bg-surface px-3 text-sm hover:border-foreground/40"
      >
        <span className="truncate">{displayName(user.user_metadata ?? {})}</span>
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
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-border bg-surface p-1 shadow-lg">
            <Link
              href="/saved"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-background"
            >
              <span>저장함</span>
              {bookmarks.length > 0 && (
                <span className="text-xs text-muted">{bookmarks.length}</span>
              )}
            </Link>
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
