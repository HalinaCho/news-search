import Link from "next/link";
import { DashboardColumn } from "@/components/DashboardColumn";
import { DASHBOARD_KEYWORDS } from "@/lib/constants";

export default function Home() {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-lg font-bold tracking-tight">TechPulse</p>
          <Link
            href="/search"
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm hover:border-foreground/40"
          >
            키워드 검색
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {DASHBOARD_KEYWORDS.map((keyword) => (
            <DashboardColumn key={keyword} keyword={keyword} />
          ))}
        </div>
      </main>
    </>
  );
}
