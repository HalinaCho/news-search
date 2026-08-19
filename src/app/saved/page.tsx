import type { Metadata } from "next";
import { SavedPage } from "@/components/SavedPage";

export const metadata: Metadata = {
  title: "저장함 — TechPulse",
};

export default function Saved() {
  return <SavedPage />;
}
