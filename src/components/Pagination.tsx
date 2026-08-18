"use client";

import { DISPLAY, MAX_PAGE } from "@/lib/constants";

const WINDOW_SIZE = 5;

interface Props {
  page: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, onChange }: Props) {
  // 네이버는 start를 1000까지만 받으므로 total이 아무리 커도 50페이지가 한계다 (EC-05).
  const totalPages = Math.min(Math.ceil(total / DISPLAY), MAX_PAGE);
  if (totalPages <= 1) return null;

  const windowStart = Math.max(1, Math.min(page - 2, totalPages - WINDOW_SIZE + 1));
  const windowEnd = Math.min(totalPages, windowStart + WINDOW_SIZE - 1);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  const reachedApiLimit = page >= MAX_PAGE && total > MAX_PAGE * DISPLAY;

  const buttonClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm disabled:opacity-35";

  return (
    <nav aria-label="검색 결과 페이지" className="mt-8 flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button
            type="button"
            className={buttonClass}
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
          >
            이전
          </button>
        </li>

        {pages.map((number) => (
          <li key={number}>
            <button
              type="button"
              aria-current={number === page ? "page" : undefined}
              className={
                number === page
                  ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-foreground bg-foreground px-3 text-sm font-medium text-background"
                  : buttonClass
              }
              onClick={() => number !== page && onChange(number)}
            >
              {number}
            </button>
          </li>
        ))}

        <li>
          <button
            type="button"
            className={buttonClass}
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages}
          >
            다음
          </button>
        </li>
      </ul>

      {reachedApiLimit && (
        <p className="text-xs text-muted">더 이상 불러올 결과가 없어요.</p>
      )}
    </nav>
  );
}
