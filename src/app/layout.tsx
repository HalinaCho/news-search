import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TechPulse — AI·로봇 기술 동향 뉴스",
  description: "AI, 로봇 등 미래 기술 키워드로 최신 뉴스를 검색하고 정렬해 훑어봅니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
