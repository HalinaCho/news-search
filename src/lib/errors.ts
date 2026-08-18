import type { ErrorCode } from "./types";

interface ErrorPresentation {
  /** 무엇이 문제인지 (FR-06-01) */
  title: string;
  /** 무엇을 하면 되는지 (FR-06-01) */
  hint: string;
  /** 다시 시도 버튼을 누를 수 있는지 */
  canRetry: boolean;
}

export const ERROR_PRESENTATION: Record<ErrorCode, ErrorPresentation> = {
  NETWORK: {
    title: "인터넷 연결이 끊겼어요.",
    hint: "연결을 확인한 뒤 다시 시도해 주세요.",
    canRetry: true,
  },
  SERVER: {
    title: "뉴스를 불러오지 못했어요.",
    hint: "잠시 후 다시 시도해 주세요.",
    canRetry: true,
  },
  AUTH: {
    title: "검색 서비스에 일시적인 문제가 있어요.",
    hint: "잠시 후 다시 시도해 주세요.",
    canRetry: true,
  },
  RATE_LIMIT: {
    // 재시도해도 한도가 풀리지 않으므로 버튼을 막는다 (E-04).
    title: "요청이 많아 잠시 응답이 지연되고 있어요.",
    hint: "잠시 뒤에 다시 검색해 주세요.",
    canRetry: false,
  },
  TIMEOUT: {
    title: "응답이 너무 오래 걸려요.",
    hint: "네트워크 상태를 확인한 뒤 다시 시도해 주세요.",
    canRetry: true,
  },
  BAD_REQUEST: {
    title: "검색어를 다시 확인해 주세요.",
    hint: "다른 키워드로 검색하거나 인기 키워드를 선택해 보세요.",
    canRetry: false,
  },
  UNKNOWN: {
    title: "예상치 못한 문제가 발생했어요.",
    hint: "잠시 후 다시 시도해 주세요.",
    canRetry: true,
  },
};

/**
 * 자동 재시도(지수 백오프)를 걸 가치가 있는 오류들 (FR-06-03).
 * 인증 실패·한도 초과·잘못된 요청은 몇 번을 다시 보내도 결과가 같으므로 제외한다.
 */
const RETRIABLE: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "SERVER",
  "TIMEOUT",
  "NETWORK",
]);

export function isRetriable(code: ErrorCode): boolean {
  return RETRIABLE.has(code);
}
