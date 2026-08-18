"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { CACHE_TTL_MS } from "@/lib/constants";
import { isRetriable } from "@/lib/errors";
import type {
  ErrorCode,
  NewsFailure,
  NewsItem,
  NewsSuccess,
  SearchStatus,
  SortOption,
} from "@/lib/types";

/** 스켈레톤이 깜빡이지 않도록 보장하는 최소 노출 시간 (FR-03-08). */
const MIN_LOADING_MS = 300;

/** 지수 백오프 — 최대 3회 재시도 (FR-06-03). */
const BACKOFF_MS = [1000, 2000, 4000];

/**
 * 같은 검색 조합을 다시 부르지 않기 위한 캐시 (EC-06).
 * 새로고침하면 비워지므로 어디까지나 보조다 — 호출량을 실제로 줄이는 건 서버의 revalidate 쪽이다.
 */
const cache = new Map<string, { payload: NewsSuccess; expiresAt: number }>();

function readCache(key: string): NewsSuccess | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.payload;
}

class SearchError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code);
  }
}

interface SearchParams {
  query: string;
  sort: SortOption;
  page: number;
}

interface State {
  status: SearchStatus;
  items: NewsItem[];
  total: number;
  /** 지금 보고 있는 결과가 언제 만들어진 것인지 (캐시를 쓰는 이상 숨기지 않는다) */
  lastBuildDate: string | null;
  error: ErrorCode | null;
  /** 현재 목록이 어떤 검색(검색어+정렬)의 결과인지 */
  scope: string;
}

type Action =
  | { type: "start"; scope: string }
  | { type: "resolved"; scope: string; payload: NewsSuccess }
  | { type: "failed"; code: ErrorCode };

const initialState: State = {
  status: "loading",
  items: [],
  total: 0,
  lastBuildDate: null,
  error: null,
  scope: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "start":
      // 같은 검색 안에서 페이지만 넘긴 거라면 기존 목록을 남겨둔다 (FR-06-04).
      // 검색어나 정렬이 바뀌었다면 이전 결과는 더 이상 맞지 않으므로 비운다.
      return action.scope === state.scope
        ? { ...state, status: "loading", error: null }
        : { ...initialState, scope: action.scope };
    case "resolved":
      return {
        status: action.payload.items.length === 0 ? "empty" : "success",
        items: action.payload.items,
        total: action.payload.total,
        lastBuildDate: action.payload.lastBuildDate,
        error: null,
        scope: action.scope,
      };
    case "failed":
      return { ...state, status: "error", error: action.code };
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function requestNews(
  { query, sort, page }: SearchParams,
  signal: AbortSignal,
): Promise<NewsSuccess> {
  // 브라우저가 오프라인이면 굳이 요청을 보내지 않는다 (E-01).
  if (!navigator.onLine) throw new SearchError("NETWORK");

  const search = new URLSearchParams({ query, sort, page: String(page) });

  let response: Response;
  try {
    response = await fetch(`/api/news?${search}`, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new SearchError("NETWORK");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as NewsFailure | null;
    throw new SearchError(body?.code ?? "UNKNOWN");
  }

  return (await response.json()) as NewsSuccess;
}

export function useNewsSearch({ query, sort, page }: SearchParams) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const scope = `${query}|${sort}`;
    const key = `${scope}|${page}`;

    const cached = readCache(key);
    if (cached) {
      dispatch({ type: "resolved", scope, payload: cached });
      return;
    }

    // 이전 요청을 취소해, 느린 응답이 뒤늦게 화면을 덮어쓰지 못하게 한다 (FR-02-03).
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (action: Action, startedAt: number) => {
      const remaining = Math.max(0, MIN_LOADING_MS - (Date.now() - startedAt));
      timer = setTimeout(() => {
        if (!controller.signal.aborted) dispatch(action);
      }, remaining);
    };

    const load = async () => {
      const startedAt = Date.now();
      dispatch({ type: "start", scope });

      for (let attempt = 0; ; attempt += 1) {
        try {
          const payload = await requestNews({ query, sort, page }, controller.signal);
          cache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
          settle({ type: "resolved", scope, payload }, startedAt);
          return;
        } catch (error) {
          if (controller.signal.aborted) return;

          const code = error instanceof SearchError ? error.code : "UNKNOWN";
          if (isRetriable(code) && attempt < BACKOFF_MS.length) {
            await sleep(BACKOFF_MS[attempt], controller.signal);
            if (controller.signal.aborted) return;
            continue;
          }

          settle({ type: "failed", code }, startedAt);
          return;
        }
      }
    };

    void load();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, sort, page, retryToken]);

  const retry = useCallback(() => setRetryToken((token) => token + 1), []);

  return { ...state, retry };
}
