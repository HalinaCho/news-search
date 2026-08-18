import type { NewsItem } from "./types";

const NAMED_ENTITIES: Record<string, string> = {
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  apos: "'",
  nbsp: "\u00a0",
};

/** HTML 엔티티를 사람이 읽을 수 있는 문자로 되돌린다 (FR-03-03). */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const codePoint =
        entity[1]?.toLowerCase() === "x"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return match;
      return String.fromCodePoint(codePoint);
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

export interface TextSegment {
  text: string;
  bold: boolean;
}

/**
 * 네이버가 검색어 강조로 넣어주는 <b> 태그만 굵은 글씨 구간으로 인정하고, 나머지는 전부 평문으로 남긴다.
 * 반환된 조각은 React가 텍스트 노드로 렌더링하므로 다른 태그가 섞여 있어도 실행되지 않는다 (FR-03-02, EC-02).
 *
 * 순서가 중요하다: 엔티티 디코딩을 먼저 하면 `&lt;b&gt;` 같은 평문이 진짜 태그로 승격되므로,
 * 반드시 태그를 먼저 가른 뒤 각 조각을 디코딩한다.
 */
export function splitHighlight(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let bold = false;

  for (const chunk of raw.split(/(<\/?b>)/i)) {
    if (/^<b>$/i.test(chunk)) {
      bold = true;
      continue;
    }
    if (/^<\/b>$/i.test(chunk)) {
      bold = false;
      continue;
    }
    if (!chunk) continue;
    segments.push({ text: decodeEntities(chunk), bold });
  }

  return segments;
}

/** 24시간 이내면 상대 시간, 그보다 오래됐으면 절대 시각으로 표시한다 (FR-03-05). */
export function formatPubDate(pubDate: string, now: number = Date.now()): string {
  const time = new Date(pubDate).getTime();
  if (Number.isNaN(time)) return "";

  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const date = new Date(time);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** originallink가 비어 있으면 link로 폴백한다 (EC-03). */
export function getArticleUrl(item: NewsItem): string {
  return item.originallink || item.link;
}

/** 출처는 기사 URL의 도메인으로 대신한다 (FR-03-01). */
export function getSource(item: NewsItem): string {
  try {
    return new URL(getArticleUrl(item)).hostname.replace(/^www\./, "");
  } catch {
    return "출처 미상";
  }
}

/** <time dateTime>에 넣을 ISO 문자열. 파싱 불가한 값이면 속성을 생략한다. */
export function toIsoDate(pubDate: string): string | undefined {
  const time = new Date(pubDate).getTime();
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}
