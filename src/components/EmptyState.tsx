"use client";

interface Props {
  query: string;
  suggestions: readonly string[];
  onSelect: (keyword: string) => void;
}

export function EmptyState({ query, suggestions, onSelect }: Props) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <p aria-hidden className="text-4xl">
        🔍
      </p>
      <h2 className="text-base font-medium">
        &lsquo;{query}&rsquo;에 대한 뉴스를 찾지 못했어요.
      </h2>
      <p className="text-sm text-muted">
        다른 키워드로 검색하거나 인기 키워드를 선택해 보세요.
      </p>

      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {suggestions.map((keyword) => (
          <li key={keyword}>
            <button
              type="button"
              onClick={() => onSelect(keyword)}
              className="min-h-11 rounded-full border border-border px-4 text-sm hover:border-foreground/40"
            >
              #{keyword}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
