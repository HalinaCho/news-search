"use client";

import type { SortOption } from "@/lib/types";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "sim", label: "정확도순" },
  { value: "date", label: "최신순" },
];

interface Props {
  sort: SortOption;
  onChange: (sort: SortOption) => void;
}

export function SortSelect({ sort, onChange }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <label htmlFor="sort" className="text-sm text-muted">
        정렬
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
