"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { BookmarkIcon } from "./BookmarkIcon";
import { useUserData } from "./UserDataProvider";

/**
 * 헤더에서 북마크 화면으로 가는 링크.
 *
 * 카드의 북마크 버튼과 같은 아이콘을 쓴다 — 담은 기사가 어디로 가는지를 설명 없이 알리는 게 목적이다.
 * 비로그인 상태에서는 담을 것도 볼 것도 없으므로 아예 띄우지 않는다.
 */
export function BookmarkLink() {
  const { user } = useAuth();
  const { ready, bookmarks } = useUserData();
  const pathname = usePathname();

  if (!user) return null;

  const current = pathname === "/saved";
  // 목록을 받아오기 전에는 0을 보여주지 않는다. 실제로 담아둔 게 있는데 없다고 말하는 셈이 된다.
  const count = ready ? bookmarks.length : null;

  return (
    <Link
      href="/saved"
      aria-current={current ? "page" : undefined}
      aria-label={count === null ? "북마크" : `북마크 ${count}건`}
      title="북마크"
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors ${
        current
          ? "border-foreground/40 bg-surface text-accent"
          : "border-border bg-surface hover:border-foreground/40"
      }`}
    >
      <BookmarkIcon filled={current} className="size-5" />
      {count !== null && count > 0 && <span className="text-xs">{count}</span>}
    </Link>
  );
}
