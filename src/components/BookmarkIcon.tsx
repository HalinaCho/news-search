/**
 * 기사 카드의 북마크 버튼과 헤더의 북마크 링크가 같은 모양을 쓴다.
 * "카드에서 누른 게 저기 쌓인다"를 아이콘만으로 전달하는 게 목적이라, 둘이 갈라지면 안 된다.
 */
export function BookmarkIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
