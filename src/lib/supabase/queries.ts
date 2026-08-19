import type { SupabaseClient } from "@supabase/supabase-js";
import type { KeywordSettings, NewsItem } from "@/lib/types";

/**
 * 저장해 둔 기사 한 건. 검색 결과에서 밀려나도 저장함에서 계속 보여야 하므로
 * 링크만이 아니라 카드를 그리는 데 필요한 필드를 통째로 복사해 둔다.
 */
export interface Bookmark {
  link: string;
  title: string;
  description: string;
  originalLink: string;
  pubDate: string;
  savedAt: string;
}

/**
 * 한 번에 들고 올 읽음 기록 수.
 * 읽음 기록은 계속 쌓이기만 하는데 화면에 필요한 건 최근 것뿐이라 상한을 둔다.
 * 이보다 오래된 기사는 다시 "안 읽음"으로 보인다 — 몇 달 전 기사가 검색에 다시 뜰 일은 드무니 이 정도면 충분하다.
 */
const READ_LIMIT = 2000;

/** 저장함에 최대 몇 건까지 들고 올지. 이보다 많이 쌓이면 오래된 건 화면에 안 나온다. */
const BOOKMARK_LIMIT = 500;

// ── 읽은 기사 ────────────────────────────────────────────────

export async function fetchReadLinks(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("read_articles")
    .select("article_link")
    .order("read_at", { ascending: false })
    .limit(READ_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => row.article_link as string);
}

export async function insertReadLink(supabase: SupabaseClient, userId: string, link: string) {
  // 같은 기사를 다시 열면 read_at 만 갱신된다 — 최근 것 위주로 남기기 위해서다.
  const { error } = await supabase
    .from("read_articles")
    .upsert(
      { user_id: userId, article_link: link, read_at: new Date().toISOString() },
      { onConflict: "user_id,article_link" },
    );
  if (error) throw error;
}

export async function deleteReadLink(supabase: SupabaseClient, link: string) {
  const { error } = await supabase.from("read_articles").delete().eq("article_link", link);
  if (error) throw error;
}

// ── 북마크 ──────────────────────────────────────────────────

export async function fetchBookmarks(supabase: SupabaseClient): Promise<Bookmark[]> {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("article_link, title, description, original_link, pub_date, saved_at")
    .order("saved_at", { ascending: false })
    .limit(BOOKMARK_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    link: row.article_link as string,
    title: row.title as string,
    description: row.description as string,
    originalLink: row.original_link as string,
    pubDate: row.pub_date as string,
    savedAt: row.saved_at as string,
  }));
}

/** 저장할 때 화면에 필요한 필드만 골라 담는다. */
export function toBookmark(item: NewsItem): Bookmark {
  return {
    link: item.link,
    title: item.title,
    description: item.description,
    originalLink: item.originallink,
    pubDate: item.pubDate,
    savedAt: new Date().toISOString(),
  };
}

/** 저장함의 항목도 카드로 그려야 하므로 NewsItem 모양으로 되돌린다. */
export function toNewsItem(bookmark: Bookmark): NewsItem {
  return {
    title: bookmark.title,
    description: bookmark.description,
    link: bookmark.link,
    originallink: bookmark.originalLink,
    pubDate: bookmark.pubDate,
  };
}

export async function insertBookmark(
  supabase: SupabaseClient,
  userId: string,
  bookmark: Bookmark,
) {
  const { error } = await supabase.from("bookmarks").upsert(
    {
      user_id: userId,
      article_link: bookmark.link,
      title: bookmark.title,
      description: bookmark.description,
      original_link: bookmark.originalLink,
      pub_date: bookmark.pubDate,
      saved_at: bookmark.savedAt,
    },
    { onConflict: "user_id,article_link" },
  );
  if (error) throw error;
}

export async function deleteBookmark(supabase: SupabaseClient, link: string) {
  const { error } = await supabase.from("bookmarks").delete().eq("article_link", link);
  if (error) throw error;
}

// ── 키워드 설정 ──────────────────────────────────────────────

/** 아직 한 번도 저장한 적 없으면 null — 이때는 앱의 기본 키워드를 쓴다. */
export async function fetchKeywordSettings(
  supabase: SupabaseClient,
): Promise<KeywordSettings | null> {
  const { data, error } = await supabase
    .from("keyword_settings")
    .select("dashboard_keywords, categories")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    dashboardKeywords: data.dashboard_keywords as string[],
    categories: data.categories as KeywordSettings["categories"],
  };
}

export async function saveKeywordSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: KeywordSettings,
) {
  const { error } = await supabase.from("keyword_settings").upsert(
    {
      user_id: userId,
      dashboard_keywords: settings.dashboardKeywords,
      categories: settings.categories,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** 행을 지우면 앱 기본 키워드로 되돌아간다. */
export async function deleteKeywordSettings(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("keyword_settings").delete().eq("user_id", userId);
  if (error) throw error;
}
