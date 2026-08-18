"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useNewsSearch } from "@/hooks/useNewsSearch";
import {
  DEFAULT_QUERY,
  findCategoryIndex,
  KEYWORD_CATEGORIES,
  MAX_PAGE,
} from "@/lib/constants";
import type { SortOption } from "@/lib/types";
import { CategoryTabs } from "./CategoryTabs";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { KeywordChips } from "./KeywordChips";
import { NewsCard } from "./NewsCard";
import { Pagination } from "./Pagination";
import { SearchBar } from "./SearchBar";
import { SkeletonCard } from "./SkeletonCard";
import { SortSelect } from "./SortSelect";

const SKELETON_COUNT = 6; // FR-03-08
const KEYWORD_PANEL_ID = "keyword-panel";

interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

export function NewsSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 쿼리스트링이 검색 상태의 유일한 출처다 — 새로고침해도 그대로 복원된다 (FR-04-04).
  const query = searchParams.get("query")?.trim() || DEFAULT_QUERY;
  const sort: SortOption = searchParams.get("sort") === "date" ? "date" : "sim";
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(rawPage) ? Math.min(Math.max(rawPage, 1), MAX_PAGE) : 1;

  const { status, items, total, error, retry } = useNewsSearch({ query, sort, page });

  // 어떤 탭을 펼쳐 둘지. 탭을 직접 누르면 그대로 따르고,
  // 검색어가 바뀌었을 때만 그 검색어가 속한 카테고리로 옮겨간다.
  // (검색어 우선으로 두면 현재 검색어가 든 탭에서 빠져나올 수 없다)
  const queryCategory = findCategoryIndex(query);
  const [activeCategory, setActiveCategory] = useState(Math.max(queryCategory, 0));
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    if (queryCategory >= 0) setActiveCategory(queryCategory);
  }

  const categoryKeywords = KEYWORD_CATEGORIES[activeCategory].keywords;

  const navigate = useCallback(
    (
      next: { query?: string; sort?: SortOption; page?: number },
      { replace = false, scroll = false }: NavigateOptions = {},
    ) => {
      const params = new URLSearchParams({
        query: next.query ?? query,
        sort: next.sort ?? sort,
        page: String(next.page ?? 1), // 검색어·정렬이 바뀌면 1페이지부터 (FR-04-02)
      });
      const href = `/search?${params.toString()}`;
      if (replace) router.replace(href, { scroll });
      else router.push(href, { scroll });
    },
    [query, sort, router],
  );

  const handleSearch = useCallback(
    (term: string, { replace }: { replace: boolean }) => navigate({ query: term }, { replace }),
    [navigate],
  );
  const handleKeyword = useCallback(
    (keyword: string) => navigate({ query: keyword }),
    [navigate],
  );
  const handleSort = useCallback((next: SortOption) => navigate({ sort: next }), [navigate]);
  const handlePage = useCallback(
    (next: number) => navigate({ page: next }, { scroll: true }),
    [navigate],
  );

  const isLoading = status === "loading";
  const showBanner = status === "error" && items.length > 0;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <p className="text-lg font-bold tracking-tight">TechPulse</p>
            <div className="md:flex-1">
              <SearchBar query={query} onSearch={handleSearch} />
            </div>
          </div>

          <div className="mt-2">
            <CategoryTabs
              categories={KEYWORD_CATEGORIES}
              activeIndex={activeCategory}
              panelId={KEYWORD_PANEL_ID}
              onSelect={setActiveCategory}
            />
            <div id={KEYWORD_PANEL_ID} role="tabpanel" className="mt-2">
              <KeywordChips
                keywords={categoryKeywords}
                activeQuery={query}
                onSelect={handleKeyword}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {isLoading
              ? "불러오는 중…"
              : status === "error" && items.length === 0
                ? ""
                : `검색결과 ${total.toLocaleString("ko-KR")}건`}
          </p>
          <SortSelect sort={sort} onChange={handleSort} />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : status === "error" && items.length === 0 ? (
          <ErrorState code={error ?? "UNKNOWN"} onRetry={retry} variant="page" />
        ) : status === "empty" ? (
          <EmptyState
            query={query}
            suggestions={categoryKeywords.filter((keyword) => keyword !== query).slice(0, 4)}
            onSelect={handleKeyword}
          />
        ) : (
          <>
            {showBanner && (
              <ErrorState code={error ?? "UNKNOWN"} onRetry={retry} variant="banner" />
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <NewsCard key={item.link} item={item} />
              ))}
            </div>
            <Pagination page={page} total={total} onChange={handlePage} />
          </>
        )}
      </main>
    </>
  );
}
