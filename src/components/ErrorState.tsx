"use client";

import { ERROR_PRESENTATION } from "@/lib/errors";
import type { ErrorCode } from "@/lib/types";

interface Props {
  code: ErrorCode;
  onRetry: () => void;
  /** 이미 보여줄 결과가 있으면 목록 위 배너로, 없으면 전체 화면으로 (FR-06-04). */
  variant: "page" | "banner";
}

export function ErrorState({ code, onRetry, variant }: Props) {
  const { title, hint, canRetry } = ERROR_PRESENTATION[code];

  const retryButton = canRetry ? (
    <button
      type="button"
      onClick={onRetry}
      className="min-h-11 shrink-0 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:border-foreground/40"
    >
      다시 시도
    </button>
  ) : null;

  if (variant === "banner") {
    return (
      <div
        role="alert"
        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
      >
        <p className="text-sm">
          {title} <span className="text-muted">{hint}</span>
        </p>
        {retryButton}
      </div>
    );
  }

  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-16 text-center"
    >
      <p aria-hidden className="text-4xl">
        ⚠️
      </p>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
      {retryButton && <div className="mt-3">{retryButton}</div>}
    </section>
  );
}
