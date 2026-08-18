"use client";

import type { KeywordCategory } from "@/lib/constants";

interface Props {
  categories: readonly KeywordCategory[];
  activeIndex: number;
  panelId: string;
  onSelect: (index: number) => void;
}

export function CategoryTabs({ categories, activeIndex, panelId, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="키워드 카테고리"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      {categories.map((category, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={category.name}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            onClick={() => !active && onSelect(index)}
            className={`min-h-11 shrink-0 border-b-2 px-3 text-sm transition-colors ${
              active
                ? "border-foreground font-semibold"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
