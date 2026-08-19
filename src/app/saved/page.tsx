import type { Metadata } from "next";
import { SavedPage } from "@/components/SavedPage";

export const metadata: Metadata = {
  title: "저장함 — 뉴스편식",
};

export default function Saved() {
  return <SavedPage />;
}
