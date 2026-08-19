"use client";

import { useState } from "react";
import { formatPubDate, getArticleUrl, getSource, toIsoDate } from "@/lib/format";
import type { NewsItem } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { BookmarkIcon } from "./BookmarkIcon";
import { Highlight } from "./Highlight";
import { useUserData } from "./UserDataProvider";

interface Props {
  item: NewsItem;
  /** 같은 내용을 실은 다른 매체 기사. 접어 두었다가 눌러서 펼친다. */
  duplicates?: NewsItem[];
}

export function NewsCard({ item, duplicates = [] }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { user, signIn } = useAuth();
  const { ready, readLinks, bookmarkedLinks, markRead, markUnread, toggleBookmark } =
    useUserData();

  // 비로그인 상태에서는 저장할 곳이 없으니 읽음/저장 표시를 아예 켜지 않는다.
  // 로그인했더라도 내 데이터가 도착하기 전까지는 마찬가지로 끈다 —
  // 켜두면 모든 카드가 "안 읽음"으로 그려졌다가 뒤늦게 읽음으로 튀어서,
  // 로그인 직후마다 목록이 한 번씩 출렁인다.
  const personalized = Boolean(user) && ready;
  const read = personalized && readLinks.has(item.link);
  const saved = personalized && bookmarkedLinks.has(item.link);
  const trackRead = personalized;

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
          // 내 저장 목록이 도착하기 전에는 누른 게 반영되지 않는다 (반영할 기준 목록이 없다).
          // 눌러도 아무 일이 없는 것처럼 보이니 그동안은 막아 둔다.
          disabled={Boolean(user) && !ready}
          aria-pressed={saved}
          title={user ? (saved ? "북마크 해제" : "북마크") : "로그인하면 북마크할 수 있어요"}
          aria-label={user ? (saved ? "북마크 해제" : "북마크") : "로그인하고 북마크하기"}
          className={`-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-40 ${
            saved ? "text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          {/* 채워진 북마크 = 담긴 상태, 테두리만 = 안 담긴 상태 */}
          <BookmarkIcon filled={saved} className="size-5" />
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

      {/* 같은 내용을 실은 다른 매체. 감추는 게 아니라 접어 두는 것이라 언제든 펼칠 수 있다. */}
      {duplicates.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="text-xs text-muted hover:text-foreground"
          >
            같은 내용 {duplicates.length}곳 {expanded ? "접기" : "더 보기"}
          </button>

          {expanded && (
            <ul className="mt-2 flex flex-col gap-2">
              {duplicates.map((duplicate) => (
                <li key={duplicate.link}>
                  <a
                    href={getArticleUrl(duplicate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackRead && markRead(duplicate.link)}
                    className="flex items-baseline justify-between gap-2 text-xs text-muted hover:text-foreground"
                  >
                    <span className="min-w-0 truncate">{getSource(duplicate)}</span>
                    <time
                      dateTime={toIsoDate(duplicate.pubDate)}
                      className="shrink-0 tabular-nums"
                    >
                      {formatPubDate(duplicate.pubDate)}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
