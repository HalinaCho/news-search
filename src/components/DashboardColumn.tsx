"use client";

import Link from "next/link";
import { useNewsSearch } from "@/hooks/useNewsSearch";
import { DASHBOARD_ITEM_COUNT } from "@/lib/constants";
import { formatPubDate } from "@/lib/format";
import { ErrorState } from "./ErrorState";
import { NewsCard } from "./NewsCard";
import { SkeletonCard } from "./SkeletonCard";

const SKELETON_COUNT = 3;

/**
 * 키워드 하나를 최신순으로 보여주는 컬럼.
 * 검색 페이지와 같은 훅을 그대로 쓰므로 요청 취소·재시도·캐시가 전부 딸려온다.
 */
export function DashboardColumn({ keyword }: { keyword: string }) {
  const { status, items, error, lastBuildDate, retry } = useNewsSearch({
    query: keyword,
    sort: "date",
    page: 1,
  });

  // 20건을 받아 앞에서 자른다. 호출 수는 같으므로 display 파라미터를 따로 두지 않는다.
  const visible = items.slice(0, DASHBOARD_ITEM_COUNT);

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-3 border-b border-border">
        <Link
          href={`/search?query=${encodeURIComponent(keyword)}&sort=date&page=1`}
          className="inline-flex min-h-11 items-center text-sm font-semibold hover:underline"
        >
          #{keyword}
        </Link>
        {lastBuildDate && (
          <span className="text-xs text-muted">{formatPubDate(lastBuildDate)} 갱신</span>
        )}
      </header>

      {/* 한 컬럼이 실패해도 나머지 컬럼은 그대로 살아 있다 */}
      {status === "error" && (
        <ErrorState code={error ?? "UNKNOWN"} onRetry={retry} variant="banner" />
      )}

      {status === "loading" ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : status === "empty" ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-muted">
          최근 기사가 없어요.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <NewsCard key={item.link} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
