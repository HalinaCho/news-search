import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 검색 화면이 /search 에서 루트로 옮겨졌다. 예전 주소로 저장해 둔 링크를 살려 둔다.
      // query·sort·page 쿼리스트링은 Next 가 목적지로 그대로 넘겨준다.
      // 308(permanent) 이 아니라 307 을 쓴다 — 308 은 브라우저가 영구 캐시해서 되돌리기 어렵다.
      { source: "/search", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
