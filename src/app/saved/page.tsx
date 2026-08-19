import type { Metadata } from "next";
import { SavedPage } from "@/components/SavedPage";

export const metadata: Metadata = {
  title: "북마크 — 뉴스편식",
};

export default function Saved() {
  return <SavedPage />;
}
