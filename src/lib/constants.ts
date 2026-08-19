import type { KeywordSettings } from "./types";

/** 한 페이지에 보여줄 기사 수. */
export const DISPLAY = 20;

/** 네이버 API의 start 파라미터 상한. */
export const MAX_START = 1000;

/** start 상한 때문에 실제로 접근 가능한 마지막 페이지. */
export const MAX_PAGE = Math.floor((MAX_START - 1) / DISPLAY) + 1; // 50

/** 검색어 없이 진입했을 때 먼저 보여줄 키워드 (4.1 — 빈 화면으로 시작하지 않는다). */
export const DEFAULT_QUERY = "AI";

/** 대시보드에 나란히 띄울 키워드. 바꾸고 싶으면 이 줄만 고치면 된다. */
export const DASHBOARD_KEYWORDS = ["AI", "로봇", "반도체"] as const;

/** 컬럼 하나에 보여줄 기사 수. 한 번의 호출로 받아온 20건 중 앞에서 자른다. */
export const DASHBOARD_ITEM_COUNT = 8;

/** 검색 결과 캐시 유효기간. 서버(fetch revalidate)와 클라이언트 캐시가 같은 값을 쓴다. */
export const CACHE_TTL_SECONDS = 1800; // 30분
export const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

export interface KeywordCategory {
  name: string;
  keywords: readonly string[];
}

/**
 * 헤더 하단에 고정 노출할 키워드 (FR-01-02).
 * 카테고리를 먼저 고르면 그 안의 키워드 칩만 보인다 — 칩을 늘려도 헤더가 높아지지 않는다.
 */
export const KEYWORD_CATEGORIES: readonly KeywordCategory[] = [
  {
    name: "기술트렌드",
    keywords: [
      "AI",
      "생성형AI",
      "휴머노이드",
      "로봇",
      "자율주행",
      "반도체",
      "양자컴퓨팅",
      "우주기술",
    ],
  },
  {
    name: "주식",
    keywords: ["국내주식", "미국주식", "중국주식", "코스피", "나스닥", "ETF", "공모주"],
  },
  {
    name: "크립토",
    keywords: ["비트코인", "이더리움", "리플", "솔라나", "알트코인", "스테이블코인"],
  },
];

/**
 * 사용자가 아직 아무것도 안 고쳤을 때 쓰는 기본 구성.
 * 편집 UI 가 이 값을 복사해 초안으로 삼고, "기본값으로 되돌리기"도 여기로 돌아온다.
 */
export const DEFAULT_KEYWORD_SETTINGS: KeywordSettings = {
  dashboardKeywords: [...DASHBOARD_KEYWORDS],
  categories: KEYWORD_CATEGORIES.map((category) => ({
    name: category.name,
    keywords: [...category.keywords],
  })),
};

/** 검색어가 어느 카테고리에도 없으면 -1. */
export function findCategoryIndex(
  categories: readonly KeywordCategory[],
  query: string,
): number {
  return categories.findIndex((category) => category.keywords.includes(query));
}
