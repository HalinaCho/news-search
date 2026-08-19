import type { KeywordSettings } from "./types";

/** 한 페이지에 보여줄 기사 수. */
export const DISPLAY = 20;

/** 네이버 API의 start 파라미터 상한. */
export const MAX_START = 1000;

/** start 상한 때문에 실제로 접근 가능한 마지막 페이지. */
export const MAX_PAGE = Math.floor((MAX_START - 1) / DISPLAY) + 1; // 50

/**
 * 검색어 없이 진입했을 때 쓸 최후의 기본값 (4.1 — 빈 화면으로 시작하지 않는다).
 * 평소에는 사용자의 첫 키워드를 따르고(firstKeyword), 키워드를 전부 지웠을 때만 여기로 온다.
 */
export const DEFAULT_QUERY = "AI";

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
  categories: KEYWORD_CATEGORIES.map((category) => ({
    name: category.name,
    keywords: [...category.keywords],
  })),
};

/**
 * 랜딩에서 처음 보여줄 검색어. 첫 카테고리의 첫 키워드를 쓴다.
 * 첫 카테고리가 비어 있으면 다음 카테고리로 넘어가고, 어디에도 키워드가 없으면 기본값으로 돌아간다.
 */
export function firstKeyword(categories: readonly KeywordCategory[]): string {
  for (const category of categories) {
    const keyword = category.keywords[0];
    if (keyword) return keyword;
  }
  return DEFAULT_QUERY;
}

/** 검색어가 어느 카테고리에도 없으면 -1. */
export function findCategoryIndex(
  categories: readonly KeywordCategory[],
  query: string,
): number {
  return categories.findIndex((category) => category.keywords.includes(query));
}
