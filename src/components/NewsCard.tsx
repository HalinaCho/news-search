"use client";

import { formatPubDate, getArticleUrl, getSource, toIsoDate } from "@/lib/format";
import type { NewsItem } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { Highlight } from "./Highlight";
import { useUserData } from "./UserDataProvider";

export function NewsCard({ item }: { item: NewsItem }) {
  const { user, signIn } = useAuth();
  const { readLinks, bookmarkedLinks, markRead, markUnread, toggleBookmark } = useUserData();

  // 비로그인 상태에서는 저장할 곳이 없으니 읽음/저장 표시를 아예 켜지 않는다.
  const read = user ? readLinks.has(item.link) : false;
  const saved = user ? bookmarkedLinks.has(item.link) : false;
  const trackRead = Boolean(user);

  return (
    <article
      className={`flex flex-col rounded-xl border bg-surface p-5 transition-colors ${
        read ? "border-border/60" : "border-border hover:border-foreground/25"
      }`}
    >
      <div className="flex items-start gap-2">
        {trackRead && (
          <button
            type="button"
            onClick={() => (read ? markUnread(item.link) : markRead(item.link))}
            aria-pressed={read}
            title={read ? "안 읽음으로 되돌리기" : "읽음으로 표시"}
            aria-label={read ? "안 읽음으로 되돌리기" : "읽음으로 표시"}
            className="mt-1.5 grid size-5 shrink-0 place-items-center"
          >
            <span
              className={`size-2.5 rounded-full transition-colors ${
                read
                  ? "border border-muted/60 bg-transparent"
                  : "bg-accent"
              }`}
            />
          </button>
        )}

        <h2
          className={`line-clamp-2 flex-1 text-base leading-snug ${
            read ? "font-normal text-muted" : "font-medium"
          }`}
        >
          <Highlight text={item.title} />
        </h2>

        <button
          type="button"
          onClick={() => (user ? toggleBookmark(item) : signIn())}
          aria-pressed={saved}
          title={user ? (saved ? "저장 해제" : "저장") : "로그인하면 저장할 수 있어요"}
          aria-label={user ? (saved ? "저장 해제" : "저장") : "로그인하고 저장하기"}
          className={`-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
            saved ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          {/* 채워진 북마크 = 저장됨, 테두리만 = 저장 안 됨 */}
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path
              d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <p
        className={`mt-2 line-clamp-2 text-sm leading-relaxed ${
          read ? "text-muted/70" : "text-muted"
        }`}
      >
        <Highlight text={item.description} />
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="min-w-0 truncate text-xs text-muted">
          <span className="font-medium">{getSource(item)}</span>
          <span aria-hidden> · </span>
          <time dateTime={toIsoDate(item.pubDate)}>{formatPubDate(item.pubDate)}</time>
        </p>

        <a
          href={getArticleUrl(item)}
          target="_blank"
          rel="noopener noreferrer"
          // 기사를 실제로 연 순간이 "읽었다"의 기준이다.
          onClick={() => trackRead && markRead(item.link)}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-foreground hover:text-background"
        >
          원문보기
        </a>
      </div>
    </article>
  );
}
