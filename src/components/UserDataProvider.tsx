"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteBookmark,
  deleteKeywordSettings,
  deleteReadLink,
  fetchBookmarks,
  fetchKeywordSettings,
  fetchReadLinks,
  insertBookmark,
  insertReadLink,
  saveKeywordSettings,
  toBookmark,
  type Bookmark,
} from "@/lib/supabase/queries";
import type { KeywordSettings, NewsItem } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface UserDataValue {
  /** 내 데이터를 다 받아왔는지. 비로그인이면 항상 true. */
  ready: boolean;
  readLinks: ReadonlySet<string>;
  bookmarks: Bookmark[];
  bookmarkedLinks: ReadonlySet<string>;
  /** 저장한 적 없으면 null — 이때는 앱 기본 키워드를 쓴다. */
  keywords: KeywordSettings | null;
  markRead: (link: string) => void;
  markUnread: (link: string) => void;
  toggleBookmark: (item: NewsItem) => void;
  removeBookmark: (link: string) => void;
  saveKeywords: (settings: KeywordSettings) => Promise<void>;
  resetKeywords: () => Promise<void>;
}

/**
 * 받아온 데이터에 "누구 것인지"를 함께 담는다.
 * 이게 있어야 계정을 바꾼 직후 이전 사용자의 북마크가 잠깐 보이는 일이 없고,
 * 로그아웃할 때 상태를 되돌리려고 effect 안에서 setState 를 부를 일도 없다.
 */
interface Snapshot {
  userId: string | null;
  readLinks: ReadonlySet<string>;
  bookmarks: Bookmark[];
  keywords: KeywordSettings | null;
}

const EMPTY: Snapshot = {
  userId: null,
  readLinks: new Set(),
  bookmarks: [],
  keywords: null,
};

const UserDataContext = createContext<UserDataValue | null>(null);

/** 저장 목록은 항상 최근에 저장한 것이 위로 온다. */
function bySavedAtDesc(a: Bookmark, b: Bookmark) {
  return b.savedAt.localeCompare(a.savedAt);
}

/**
 * 읽음 표시·북마크·키워드 설정을 한곳에서 들고 있는다.
 *
 * 쓰기는 전부 낙관적(optimistic)으로 처리한다 — 화면을 먼저 바꾸고 서버에 보낸 뒤,
 * 실패하면 되돌린다. 읽음 표시처럼 잦은 동작에 매번 왕복을 기다리면 쓰기 답답해서다.
 */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY);

  // 지금 로그인한 사람의 데이터일 때만 쓴다. 아니면 빈 상태로 본다.
  const mine = snapshot.userId === userId ? snapshot : EMPTY;
  const ready = userId === null || snapshot.userId === userId;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const [links, saved, keywords] = await Promise.all([
        fetchReadLinks(supabase),
        fetchBookmarks(supabase),
        fetchKeywordSettings(supabase),
      ]);
      if (cancelled) return;
      setSnapshot({ userId, readLinks: new Set(links), bookmarks: saved, keywords });
    };

    // 개인화 데이터를 못 받아도 뉴스 검색 자체는 돌아가야 한다.
    // 빈 상태로 두되 userId 는 채워서 로딩이 끝난 것으로 본다.
    void load().catch((error: unknown) => {
      if (cancelled) return;
      console.error("[UserDataProvider] 사용자 데이터를 불러오지 못했습니다:", error);
      setSnapshot({ ...EMPTY, userId });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** 지금 사용자의 스냅샷일 때만 바꾼다 — 그 사이 로그아웃했다면 그냥 둔다. */
  const patch = useCallback(
    (update: (current: Snapshot) => Snapshot) => {
      setSnapshot((prev) => (prev.userId === userId ? update(prev) : prev));
    },
    [userId],
  );

  const setRead = useCallback(
    (link: string, read: boolean) => {
      patch((current) => {
        const next = new Set(current.readLinks);
        if (read) next.add(link);
        else next.delete(link);
        return { ...current, readLinks: next };
      });
    },
    [patch],
  );

  const markRead = useCallback(
    (link: string) => {
      if (!userId || mine.readLinks.has(link)) return;

      setRead(link, true);
      void insertReadLink(createSupabaseBrowserClient(), userId, link).catch(
        (error: unknown) => {
          console.error("[UserDataProvider] 읽음 표시 실패:", error);
          setRead(link, false);
        },
      );
    },
    [userId, mine.readLinks, setRead],
  );

  const markUnread = useCallback(
    (link: string) => {
      if (!userId || !mine.readLinks.has(link)) return;

      setRead(link, false);
      void deleteReadLink(createSupabaseBrowserClient(), link).catch((error: unknown) => {
        console.error("[UserDataProvider] 읽음 해제 실패:", error);
        setRead(link, true);
      });
    },
    [userId, mine.readLinks, setRead],
  );

  const removeBookmark = useCallback(
    (link: string) => {
      if (!userId) return;

      const removed = mine.bookmarks.find((bookmark) => bookmark.link === link);
      if (!removed) return;

      patch((current) => ({
        ...current,
        bookmarks: current.bookmarks.filter((bookmark) => bookmark.link !== link),
      }));

      void deleteBookmark(createSupabaseBrowserClient(), link).catch((error: unknown) => {
        console.error("[UserDataProvider] 저장 해제 실패:", error);
        patch((current) => ({
          ...current,
          bookmarks: [...current.bookmarks, removed].sort(bySavedAtDesc),
        }));
      });
    },
    [userId, mine.bookmarks, patch],
  );

  const toggleBookmark = useCallback(
    (item: NewsItem) => {
      if (!userId) return;

      if (mine.bookmarks.some((bookmark) => bookmark.link === item.link)) {
        removeBookmark(item.link);
        return;
      }

      const bookmark = toBookmark(item);
      patch((current) => ({ ...current, bookmarks: [bookmark, ...current.bookmarks] }));

      void insertBookmark(createSupabaseBrowserClient(), userId, bookmark).catch(
        (error: unknown) => {
          console.error("[UserDataProvider] 저장 실패:", error);
          patch((current) => ({
            ...current,
            bookmarks: current.bookmarks.filter((entry) => entry.link !== bookmark.link),
          }));
        },
      );
    },
    [userId, mine.bookmarks, patch, removeBookmark],
  );

  const saveKeywords = useCallback(
    async (settings: KeywordSettings) => {
      if (!userId) return;

      const previous = mine.keywords;
      patch((current) => ({ ...current, keywords: settings }));

      try {
        await saveKeywordSettings(createSupabaseBrowserClient(), userId, settings);
      } catch (error) {
        // 키워드 편집은 사용자가 공들여 넣은 입력이라 조용히 넘기지 않는다.
        // 되돌린 뒤, 호출한 쪽에서 알릴 수 있도록 다시 던진다.
        patch((current) => ({ ...current, keywords: previous }));
        throw error;
      }
    },
    [userId, mine.keywords, patch],
  );

  const resetKeywords = useCallback(async () => {
    if (!userId) return;

    const previous = mine.keywords;
    patch((current) => ({ ...current, keywords: null }));

    try {
      await deleteKeywordSettings(createSupabaseBrowserClient(), userId);
    } catch (error) {
      patch((current) => ({ ...current, keywords: previous }));
      throw error;
    }
  }, [userId, mine.keywords, patch]);

  const bookmarkedLinks = useMemo(
    () => new Set(mine.bookmarks.map((bookmark) => bookmark.link)),
    [mine.bookmarks],
  );

  const value = useMemo<UserDataValue>(
    () => ({
      ready,
      readLinks: mine.readLinks,
      bookmarks: mine.bookmarks,
      bookmarkedLinks,
      keywords: mine.keywords,
      markRead,
      markUnread,
      toggleBookmark,
      removeBookmark,
      saveKeywords,
      resetKeywords,
    }),
    [
      ready,
      mine.readLinks,
      mine.bookmarks,
      mine.keywords,
      bookmarkedLinks,
      markRead,
      markUnread,
      toggleBookmark,
      removeBookmark,
      saveKeywords,
      resetKeywords,
    ],
  );

  return <UserDataContext value={value}>{children}</UserDataContext>;
}

export function useUserData(): UserDataValue {
  const value = use(UserDataContext);
  if (!value) throw new Error("useUserData 는 UserDataProvider 안에서만 쓸 수 있다.");
  return value;
}
