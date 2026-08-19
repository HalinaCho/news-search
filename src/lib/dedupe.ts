import { splitHighlight } from "./format";
import type { NewsItem } from "./types";

/**
 * 같은 사건을 여러 매체가 받아쓴 기사를 한 덩어리로 묶는다.
 * lead 만 카드로 그리고 나머지는 "외 N개 매체"로 접어 둔다.
 */
export interface ArticleGroup {
  lead: NewsItem;
  others: NewsItem[];
}

/**
 * 두 제목이 같은 기사라고 볼 최소 유사도.
 *
 * 감으로 정하지 않고 실제 검색 결과로 맞췄다. 8개 검색어·페이지 조합에서 나온 모든 제목 쌍의
 * 점수 분포를 보니, 0.45 이상은 전부 같은 사건을 여러 매체가 쓴 것이었고 오탐이 없었다.
 * (한국어 헤드라인은 같은 사건이면 고유명사와 숫자를 공유해서, 다른 사건끼리는 점수가 잘 안 오른다)
 *
 * 그래도 표본이 좁아 0.6 으로 여유를 뒀다. 처음에 0.8 로 뒀더니
 * "SK하이닉스 40조 자사주 취득·전량 소각" 과 "SK하이닉스 40조원 자사주 취득·소각" 같은
 * 명백한 중복을 놓쳤다(0.708). 반대로 너무 낮추면 다른 기사가 접히므로, 낮출 때는 다시 측정한다.
 */
const SIMILARITY_THRESHOLD = 0.6;

/** 이보다 짧은 제목은 글자 수가 적어 우연히 겹치기 쉬우므로 묶지 않는다. */
const MIN_LENGTH = 8;

/**
 * 비교용으로 제목을 깎아낸다.
 * 매체마다 다르게 붙이는 말머리([속보]·(종합) 등)와 문장부호를 털어내면 본문만 남는다.
 */
function normalize(rawTitle: string): string {
  // <b> 태그를 걷어내고 엔티티를 되돌린다 — 검색어 강조 위치는 매체마다 다를 수 있다.
  const plain = splitHighlight(rawTitle)
    .map((segment) => segment.text)
    .join("");

  return plain
    .replace(/[[(<【][^\])>】]{0,20}[\])>】]/g, "") // [속보] (종합) 〈단독〉 …
    .replace(/[^\p{L}\p{N}]/gu, "") // 공백·문장부호 제거
    .toLowerCase();
}

/** 글자 2개씩 잘라낸 집합. 한국어는 형태소 분석 없이도 이 방식이 잘 통한다. */
function bigrams(text: string): Set<string> {
  const result = new Set<string>();
  for (let index = 0; index < text.length - 1; index += 1) {
    result.add(text.slice(index, index + 2));
  }
  return result;
}

/** Dice 계수 — 겹치는 조각의 비율. 0(무관) ~ 1(동일). */
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let shared = 0;
  for (const gram of a) {
    if (b.has(gram)) shared += 1;
  }
  return (2 * shared) / (a.size + b.size);
}

/**
 * 앞에서부터 훑으며 이미 만든 덩어리에 붙일 수 있으면 붙이고, 아니면 새 덩어리를 연다.
 * 목록 순서(정확도순·최신순)가 곧 대표 기사 우선순위가 된다 — 먼저 나온 것이 lead 다.
 *
 * 한 페이지는 20건이라 전부 비교해도 부담이 없다.
 */
export function groupDuplicates(items: NewsItem[]): ArticleGroup[] {
  const groups: ArticleGroup[] = [];
  const leadGrams: (Set<string> | null)[] = [];

  for (const item of items) {
    const normalized = normalize(item.title);
    // 너무 짧으면 비교가 미덥지 않다. 묶지 않고 혼자 둔다.
    const grams = normalized.length >= MIN_LENGTH ? bigrams(normalized) : null;

    let joined = false;
    if (grams) {
      for (let index = 0; index < groups.length; index += 1) {
        const other = leadGrams[index];
        if (!other) continue;
        if (similarity(grams, other) >= SIMILARITY_THRESHOLD) {
          groups[index].others.push(item);
          joined = true;
          break;
        }
      }
    }

    if (!joined) {
      groups.push({ lead: item, others: [] });
      leadGrams.push(grams);
    }
  }

  return groups;
}
