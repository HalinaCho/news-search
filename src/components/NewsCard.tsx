import { formatPubDate, getArticleUrl, getSource, toIsoDate } from "@/lib/format";
import type { NewsItem } from "@/lib/types";
import { Highlight } from "./Highlight";

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-foreground/25">
      <h2 className="line-clamp-2 text-base leading-snug font-medium">
        <Highlight text={item.title} />
      </h2>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
        <Highlight text={item.description} />
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="min-w-0 truncate text-xs text-muted">
          <span className="font-medium">{getSource(item)}</span>
          <span aria-hidden> · </span>
          <time dateTime={toIsoDate(item.pubDate)}>
            {formatPubDate(item.pubDate)}
          </time>
        </p>

        <a
          href={getArticleUrl(item)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-foreground hover:text-background"
        >
          원문보기
        </a>
      </div>
    </article>
  );
}
