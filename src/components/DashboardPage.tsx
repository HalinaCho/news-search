"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_KEYWORD_SETTINGS } from "@/lib/constants";
import { AuthButton } from "./AuthButton";
import { DashboardColumn } from "./DashboardColumn";
import { KeywordEditor } from "./KeywordEditor";
import { useAuth } from "./AuthProvider";
import { useUserData } from "./UserDataProvider";

export function DashboardPage() {
  const { user } = useAuth();
  const { keywords } = useUserData();
  const [editing, setEditing] = useState(false);

  // 아직 아무것도 안 고쳤거나 비로그인이면 앱 기본 키워드를 쓴다.
  const dashboardKeywords = (keywords ?? DEFAULT_KEYWORD_SETTINGS).dashboardKeywords;

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-lg font-bold tracking-tight">TechPulse</p>
          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-3 text-sm hover:border-foreground/40"
              >
                키워드 편집
              </button>
            )}
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm hover:border-foreground/40"
            >
              키워드 검색
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {dashboardKeywords.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface px-4 py-16 text-center">
            <p className="text-sm text-muted">대시보드에 띄울 키워드가 없어요.</p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm hover:border-foreground/40"
            >
              키워드 추가하기
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardKeywords.map((keyword) => (
              <DashboardColumn key={keyword} keyword={keyword} />
            ))}
          </div>
        )}
      </main>

      {editing && <KeywordEditor focus="dashboard" onClose={() => setEditing(false)} />}
    </>
  );
}
