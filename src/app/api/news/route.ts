import { DISPLAY, MAX_START } from "@/lib/constants";
import type { ErrorCode, NewsSuccess, SortOption } from "@/lib/types";

// 검색 API는 개발자센터(openapi.naver.com)에서 NAVER API HUB로 이관됐다.
const NAVER_ENDPOINT = "https://naverapihub.apigw.ntruss.com/search/v1/news";
const TIMEOUT_MS = 8000; // E-05

function fail(code: ErrorCode, status: number) {
  return Response.json({ code }, { status });
}

/**
 * 네이버 뉴스 검색 API 프록시 (FR-00).
 * API 키는 이 서버 전용 파일 안에서만 읽는다 — 클라이언트 번들에 절대 포함되지 않는다.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const query = params.get("query")?.trim() ?? "";
  const sort: SortOption = params.get("sort") === "date" ? "date" : "sim";
  const page = Number(params.get("page") ?? "1");

  if (!query) return fail("BAD_REQUEST", 400);
  if (!Number.isInteger(page) || page < 1) return fail("BAD_REQUEST", 400);

  const start = (page - 1) * DISPLAY + 1;
  // 네이버는 start를 1~1000까지만 받는다 (EC-05). UI는 이미 50페이지에서 막지만 직접 입력된 URL을 위한 방어선.
  if (start > MAX_START) return fail("BAD_REQUEST", 400);

  const keyId = process.env.NAVER_API_KEY_ID;
  const key = process.env.NAVER_API_KEY;
  if (!keyId || !key) {
    // EC-07 — 서버 콘솔에만 남기고, 사용자 화면은 E-03과 동일하게 처리한다.
    console.error(
      "[api/news] 환경변수가 설정되지 않았습니다. .env.local 에 NAVER_API_KEY_ID / NAVER_API_KEY 를 채워 주세요.",
    );
    return fail("AUTH", 500);
  }

  const url =
    `${NAVER_ENDPOINT}?query=${encodeURIComponent(query)}` + // EC-01
    `&display=${DISPLAY}&start=${start}&sort=${sort}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": keyId,
        "X-NCP-APIGW-API-KEY": key,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("[api/news] 네이버 API 호출 실패:", error);
    return timedOut ? fail("TIMEOUT", 504) : fail("SERVER", 502);
  }

  if (!response.ok) {
    console.error(
      `[api/news] 네이버 API 오류 ${response.status}: ${await response.text()}`,
    );
    if (response.status === 401 || response.status === 403) return fail("AUTH", 500);
    if (response.status === 429) return fail("RATE_LIMIT", 429);
    return fail("SERVER", 502);
  }

  const data = (await response.json()) as NewsSuccess;
  return Response.json({
    total: data.total,
    start: data.start,
    display: data.display,
    items: data.items,
  } satisfies NewsSuccess);
}
