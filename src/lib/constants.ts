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

/** 헤더 하단에 고정 노출할 인기 키워드 (FR-01-02). */
export const POPULAR_KEYWORDS = [
  "AI",
  "로봇",
  "휴머노이드",
  "자율주행",
  "생성형AI",
  "반도체",
  "양자컴퓨팅",
  "우주기술",
  "UAM",
  "스마트팩토리",
] as const;
