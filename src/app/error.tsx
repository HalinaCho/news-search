"use client";

import { useEffect } from "react";

/** 렌더링 중 발생한 예상치 못한 오류 (E-06). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 상세는 콘솔에만 남기고 화면에는 노출하지 않는다 (FR-06-02).
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16">
      <section className="flex flex-col items-center gap-3 text-center">
        <p aria-hidden className="text-4xl">
          ⚠️
        </p>
        <h1 className="text-base font-medium">예상치 못한 문제가 발생했어요.</h1>
        <p className="text-sm text-muted">잠시 후 다시 시도해 주세요.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-3 min-h-11 rounded-lg border border-border bg-surface px-4 text-sm font-medium"
        >
          새로고침
        </button>
      </section>
    </main>
  );
}
