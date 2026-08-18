/** 한 페이지에 보여줄 기사 수. */
export const DISPLAY = 20;

/** 네이버 API의 start 파라미터 상한. */
export const MAX_START = 1000;

/** start 상한 때문에 실제로 접근 가능한 마지막 페이지. */
export const MAX_PAGE = Math.floor((MAX_START - 1) / DISPLAY) + 1; // 50

/** 검색어 없이 진입했을 때 먼저 보여줄 키워드 (4.1 — 빈 화면으로 시작하지 않는다). */
export const DEFAULT_QUERY = "AI";

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
