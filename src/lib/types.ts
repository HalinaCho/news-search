/** 네이버 뉴스 검색 API가 돌려주는 기사 1건. */
export interface NewsItem {
  title: string; // <b> 태그 포함 원본
  originallink: string;
  link: string;
  description: string; // <b> 태그 포함 원본
  pubDate: string; // RFC 822
}

/** /api/news 성공 응답. */
export interface NewsSuccess {
  /** 네이버가 이 응답을 만든 시각. 캐시가 히트하면 값이 그대로 유지된다. */
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NewsItem[];
}

/**
 * /api/news 실패 응답. 코드만 내려보내고 원인 상세는 서버 콘솔에만 남긴다.
 * (FR-06-02 — 상태 코드·스택·키 정보를 사용자에게 노출하지 않는다)
 */
export interface NewsFailure {
  code: ErrorCode;
}

export type ErrorCode =
  | "BAD_REQUEST"
  | "AUTH" // E-03
  | "RATE_LIMIT" // E-04
  | "SERVER" // E-02
  | "TIMEOUT" // E-05
  | "NETWORK" // E-01 (클라이언트에서만 발생)
  | "UNKNOWN";

export type SortOption = "sim" | "date";

export type SearchStatus = "loading" | "success" | "empty" | "error";

/** 사용자가 직접 고친 키워드 구성. 저장한 적 없으면 앱 기본값을 쓴다. */
export interface KeywordSettings {
  dashboardKeywords: string[];
  categories: { name: string; keywords: string[] }[];
}
