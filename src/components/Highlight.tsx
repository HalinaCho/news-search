import { splitHighlight } from "@/lib/format";

/**
 * 네이버가 검색어에 씌워준 <b> 구간만 굵게 렌더링한다.
 * 모든 조각은 React 텍스트 노드로 들어가므로 dangerouslySetInnerHTML 없이 XSS가 차단된다 (FR-03-02).
 */
export function Highlight({ text }: { text: string }) {
  return (
    <>
      {splitHighlight(text).map((segment, index) =>
        segment.bold ? (
          <strong key={index} className="font-bold">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
