"use client";

import Link from "next/link";
import { toNewsItem } from "@/lib/supabase/queries";
import { AuthButton } from "./AuthButton";
import { NewsCard } from "./NewsCard";
import { SkeletonCard } from "./SkeletonCard";
import { useAuth } from "./AuthProvider";
import { useUserData } from "./UserDataProvider";

const SKELETON_COUNT = 6;

export function SavedPage() {
  const { user, loading, signIn } = useAuth();
  const { ready, bookmarks } = useUserData();

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-lg font-bold tracking-tight hover:opacity-70"
          >
            뉴스편식
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm hover:border-foreground/40"
            >
              키워드 검색
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <h1 className="mb-5 text-xl font-bold tracking-tight">
          저장함
          {user && ready && bookmarks.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted">{bookmarks.length}건</span>
          )}
        </h1>

        {loading || (user && !ready) ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : !user ? (
          <div className="rounded-xl border border-border bg-surface px-4 py-16 text-center">
            <p className="text-sm text-muted">
              저장한 기사는 계정에 담겨 어느 기기에서든 그대로 보입니다.
            </p>
            <button
              type="button"
              onClick={signIn}
              className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:border-foreground/40"
            >
              Google로 로그인
            </button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface px-4 py-16 text-center">
            <p className="text-sm text-muted">아직 저장한 기사가 없어요.</p>
            <p className="mt-1 text-sm text-muted">
              기사 카드 오른쪽 위의 북마크 아이콘을 누르면 여기에 담깁니다.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm hover:border-foreground/40"
            >
              기사 찾아보기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <NewsCard key={bookmark.link} item={toNewsItem(bookmark)} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
