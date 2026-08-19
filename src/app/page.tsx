import { Suspense } from "react";
import { NewsSearchPage } from "@/components/NewsSearchPage";

export default function Home() {
  // useSearchParams를 쓰는 컴포넌트는 Suspense 경계 안에 있어야 한다.
  return (
    <Suspense>
      <NewsSearchPage />
    </Suspense>
  );
}
