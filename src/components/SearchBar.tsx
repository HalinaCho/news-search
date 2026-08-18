"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const DEBOUNCE_MS = 300; // FR-02-02

interface Props {
  /** URL에 반영된 현재 검색어 */
  query: string;
  onSearch: (term: string, options: { replace: boolean }) => void;
}

export function SearchBar({ query, onSearch }: Props) {
  const [value, setValue] = useState(query);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** 마지막으로 우리가 내보낸 검색어. 우리 입력이 URL을 통해 되돌아온 것과 외부 변경을 구분한다. */
  const sentRef = useRef(query);

  // 칩 클릭이나 뒤로가기처럼 밖에서 검색어가 바뀌면 입력창에도 반영한다 (FR-01-03).
  // 타이핑 중 우리가 보낸 값이 되돌아온 경우는 무시해야 입력이 끊기지 않는다.
  useEffect(() => {
    if (query === sentRef.current) return;
    sentRef.current = query;
    setValue(query);
  }, [query]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const send = (term: string, replace: boolean) => {
    sentRef.current = term;
    onSearch(term, { replace });
  };

  const handleChange = (next: string) => {
    setValue(next);
    clearTimeout(timerRef.current);

    // 검색어가 비면 조회하지 않는다 (FR-02-04).
    if (!next.trim()) return;

    timerRef.current = setTimeout(() => send(next.trim(), true), DEBOUNCE_MS);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    clearTimeout(timerRef.current); // 즉시 검색은 디바운스를 무시한다 (FR-02-02)

    const term = value.trim();
    if (!term) return;
    send(term, false);
  };

  const isEmpty = value.trim() === "";

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} role="search" className="flex w-full gap-2">
        <label htmlFor="news-search" className="sr-only">
          뉴스 검색
        </label>
        <input
          id="news-search"
          type="search"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="AI, 로봇, 자율주행…"
          autoComplete="off"
          className="min-h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm outline-none placeholder:text-muted focus:border-foreground/40"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
          disabled={isEmpty}
        >
          검색
        </button>
      </form>

      {isEmpty && (
        <p className="mt-2 text-xs text-muted">검색어를 입력해 주세요.</p>
      )}
    </div>
  );
}
