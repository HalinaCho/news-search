export function SkeletonCard() {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
      <div className="shimmer h-5 w-4/5 rounded" />
      <div className="shimmer h-4 w-full rounded" />
      <div className="shimmer h-4 w-2/3 rounded" />
      <div className="mt-4 flex items-center justify-between">
        <div className="shimmer h-3 w-28 rounded" />
        <div className="shimmer h-9 w-24 rounded-lg" />
      </div>
    </article>
  );
}
