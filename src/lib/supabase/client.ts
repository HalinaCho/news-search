"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/**
 * 브라우저용 클라이언트.
 * createBrowserClient 는 기본이 싱글턴(isSingleton)이라 매번 불러도 같은 인스턴스가 온다.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
