"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { groupDuplicates } from "@/lib/dedupe";
import { useNewsSearch } from "@/hooks/useNewsSearch";
import {
  DEFAULT_KEYWORD_SETTINGS,
  findCategoryIndex,
  firstKeyword,
  MAX_PAGE,
} from "@/lib/constants";
import { formatPubDate } from "@/lib/format";
import type { SortOption } from "@/lib/types";
import { AuthButton } from "./AuthButton";
import { useAuth } from "./AuthProvider";
import { BookmarkLink } from "./BookmarkLink";
import { CategoryTabs } from "./CategoryTabs";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { KeywordChips } from "./KeywordChips";
import { NewsCard } from "./NewsCard";
import { Pagination } from "./Pagination";
import { SearchBar } from "./SearchBar";
import { SkeletonCard } from "./SkeletonCard";
import { KeywordEditor } from "./KeywordEditor";
import { SortSelect } from "./SortSelect";
import { useUserData } from "./UserDataProvider";

const SKELETON_COUNT = 6; // FR-03-08
const KEYWORD_PANEL_ID = "keyword-panel";

interface NavigateOptions {
  replace?: boolean;
  scroll?: boolean;
}

export function NewsSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { keywords, readLinks, ready: keywordsReady } = useUserData();
  const [editing, setEditing] = useState(false);

  // 아직 아무것도 안 고쳤거나 비로그인이면 앱 기본 카테고리를 쓴다.
  const categories = (keywords ?? DEFAULT_KEYWORD_SETTINGS).categories;

  // URL 쿼리스트링이 검색 상태의 유일한 출처다 — 새로고침해도 그대로 복원된다 (FR-04-04).
  // 검색어 없이 들어온 첫 화면에서는 내 첫 카테고리의 첫 키워드를 보여준다.
  const explicitQuery = searchParams.get("query")?.trim() ?? "";
  const query = explicitQuery || firstKeyword(categories);

  // 내 키워드가 도착하기 전에는 조회를 미룬다. 기본값으로 먼저 물어보면
  // 도착한 뒤 다른 키워드로 다시 물어보게 되어 호출이 두 번 나가고 화면이 한 번 튄다.
  // 검색어가 URL에 명시돼 있으면 기다릴 이유가 없다.
  const waitingForKeywords = !explicitQuery && !keywordsReady;
  const sort: SortOption = searchParams.get("sort") === "date" ? "date" : "sim";
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(rawPage) ? Math.min(Math.max(rawPage, 1), MAX_PAGE) : 1;
  // 이것도 URL에 담는다 — 새로고침해도 유지되고, 링크를 남기면 상대도 같은 화면을 본다.
  const unreadOnly = searchParams.get("unread") === "1";

  const { status, items, total, error, lastBuildDate, retry } = useNewsSearch(
    { query, sort, page },
    { enabled: !waitingForKeywords },
  );

  // 어떤 탭을 펼쳐 둘지. 탭을 직접 누르면 그대로 따르고,
  // 검색어가 바뀌었을 때만 그 검색어가 속한 카테고리로 옮겨간다.
  // (검색어 우선으로 두면 현재 검색어가 든 탭에서 빠져나올 수 없다)
  const queryCategory = findCategoryIndex(categories, query);
  const [activeCategory, setActiveCategory] = useState(Math.max(queryCategory, 0));
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    if (queryCategory >= 0) setActiveCategory(queryCategory);
  }

  // 카테고리를 지우거나 줄이면 골라둔 인덱스가 범위를 벗어날 수 있다.
  // 카테고리를 전부 지웠다면 -1 이 되고, 탭도 칩도 그냥 비어 보인다.
  const safeCategory = Math.min(activeCategory, categories.length - 1);
  const categoryKeywords = categories[safeCategory]?.keywords ?? [];

  const navigate = useCallback(
    (
      next: {
        query?: string;
        sort?: SortOption;
        page?: number;
        unreadOnly?: boolean;
      },
      { replace = false, scroll = false }: NavigateOptions = {},
    ) => {
      const params = new URLSearchParams({
        query: next.query ?? query,
        sort: next.sort ?? sort,
        page: String(next.page ?? 1), // 검색어·정렬이 바뀌면 1페이지부터 (FR-04-02)
      });
      // 켜져 있을 때만 붙인다. 기본 상태에서 주소가 지저분해지지 않도록.
      if (next.unreadOnly ?? unreadOnly) params.set("unread", "1");

      const href = `/?${params.toString()}`;
      if (replace) router.replace(href, { scroll });
      else router.push(href, { scroll });
    },
    [query, sort, unreadOnly, router],
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

  // 같은 사건을 받아쓴 기사를 한 장으로 접는다. 접힌 것도 카드에서 펼쳐 볼 수 있다.
  const groups = useMemo(() => groupDuplicates(items), [items]);

  // 안 읽음 필터는 대표 기사(lead) 기준으로 판단한다 — 화면에서 누르는 게 그것이라 예측이 쉽다.
  const visibleGroups = useMemo(
    () => (unreadOnly ? groups.filter((group) => !readLinks.has(group.lead.link)) : groups),
    [groups, unreadOnly, readLinks],
  );

  const foldedCount = items.length - groups.length;
  const hiddenCount = groups.length - visibleGroups.length;

  const handleUnreadToggle = useCallback(
    // 페이지는 그대로 둔다. 보고 있던 자리에서 걸러내는 게 자연스럽다.
    () => navigate({ unreadOnly: !unreadOnly, page }, { replace: true }),
    [navigate, unreadOnly, page],
  );

  const isLoading = status === "loading";
  const showBanner = status === "error" && items.length > 0;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <div className="flex items-center justify-between gap-3 md:contents">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center text-lg font-bold tracking-tight hover:opacity-70 md:order-1"
              >
                뉴스편식
              </Link>
              <div className="flex items-center gap-2 md:order-3">
                <BookmarkLink />
                <AuthButton />
              </div>
            </div>
            <div className="md:order-2 md:flex-1">
              <SearchBar query={query} onSearch={handleSearch} />
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <CategoryTabs
                  categories={categories}
                  activeIndex={safeCategory}
                  panelId={KEYWORD_PANEL_ID}
                  onSelect={setActiveCategory}
                />
              </div>
              {user && (
                <>
                  {/* 탭 묶음이 여기서 끝난다는 표시. 버튼이 탭 하나로 읽히지 않게 한다. */}
                  <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    title="키워드 편집"
                    aria-label="키워드 편집"
                    // 키워드 줄에 딸린 부수 동작이라 헤더의 버튼들보다 가벼워야 한다.
                    // 테두리를 빼고 아이콘만 남긴다 — 탭은 전부 글자라 아이콘 하나로 충분히 갈린다.
                    // 크기는 44px 를 유지해 손가락으로 누르기 쉬운 상태로 둔다.
                    className="grid size-11 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
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
          <div className="min-w-0">
            <p className="text-sm text-muted" aria-live="polite">
              {isLoading
                ? "불러오는 중…"
                : status === "error" && items.length === 0
                  ? ""
                  : `검색결과 ${total.toLocaleString("ko-KR")}건`}
            </p>
            {/* 같은 검색은 30분간 캐시되므로 지금 보는 게 언제 만들어진 결과인지 밝혀 둔다.
                접거나 숨긴 건수도 같이 알린다 — 조용히 줄어들면 결과가 빠진 것처럼 보인다. */}
            {!isLoading && (
              <p className="mt-0.5 text-xs text-muted">
                {[
                  lastBuildDate ? `${formatPubDate(lastBuildDate)} 갱신` : null,
                  foldedCount > 0 ? `중복 ${foldedCount}건 접음` : null,
                  hiddenCount > 0 ? `읽은 기사 ${hiddenCount}건 숨김` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={handleUnreadToggle}
                aria-pressed={unreadOnly}
                className={`min-h-11 rounded-lg border px-3 text-sm transition-colors ${
                  unreadOnly
                    ? "border-foreground bg-foreground font-medium text-background"
                    : "border-border bg-surface text-muted hover:border-foreground/40 hover:text-foreground"
                }`}
              >
                안 읽은 것만
              </button>
            )}
            <SortSelect sort={sort} onChange={handleSort} />
          </div>
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
            {visibleGroups.length === 0 ? (
              // 이 페이지가 전부 읽은 기사인 경우. 결과가 없는 것과는 다르니 따로 안내한다.
              <div className="rounded-xl border border-border bg-surface px-4 py-16 text-center">
                <p className="text-sm text-muted">이 페이지의 기사를 모두 읽으셨어요.</p>
                <button
                  type="button"
                  onClick={handleUnreadToggle}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm hover:border-foreground/40"
                >
                  읽은 기사도 보기
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleGroups.map((group) => (
                  <NewsCard
                    key={group.lead.link}
                    item={group.lead}
                    duplicates={group.others}
                  />
                ))}
              </div>
            )}
            <Pagination page={page} total={total} onChange={handlePage} />
          </>
        )}
      </main>

      {editing && <KeywordEditor onClose={() => setEditing(false)} />}
    </>
  );
}
