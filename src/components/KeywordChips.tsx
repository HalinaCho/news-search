"use client";

interface Props {
  keywords: readonly string[];
  /** 현재 검색어. 칩과 정확히 같을 때만 활성으로 본다 (FR-01-04, FR-01-06). */
  activeQuery: string;
  onSelect: (keyword: string) => void;
}

export function KeywordChips({ keywords, activeQuery, onSelect }: Props) {
  return (
    <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
      {keywords.map((keyword) => {
        const active = keyword === activeQuery;
        return (
          <li key={keyword} className="shrink-0">
            <button
              type="button"
              aria-pressed={active}
              // 이미 선택된 칩을 다시 눌러도 재조회하지 않는다 (EC-04).
              onClick={() => !active && onSelect(keyword)}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                active
                  ? "border-foreground bg-foreground font-medium text-background"
                  : "border-border bg-surface hover:border-foreground/40"
              }`}
            >
              #{keyword}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
