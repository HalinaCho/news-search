import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { UserDataProvider } from "@/components/UserDataProvider";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "뉴스편식 — 내가 고른 키워드만",
  description:
    "관심 있는 키워드만 골라 네이버 뉴스를 훑어봅니다. 읽은 기사는 흐려지고, 담아둔 기사는 북마크에 남습니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <UserDataProvider>{children}</UserDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
