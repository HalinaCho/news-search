"use client";

import { useState } from "react";
import { DEFAULT_KEYWORD_SETTINGS } from "@/lib/constants";
import type { KeywordSettings } from "@/lib/types";
import { useUserData } from "./UserDataProvider";

/** 손이 미끄러져 수백 개를 만드는 걸 막는 선. 실제로 쓰기에는 한참 넉넉하다. */
const MAX_CATEGORIES = 12;
const MAX_KEYWORDS = 24;
const MAX_DASHBOARD = 8;

interface Props {
  /** 다이얼로그를 열면서 어느 섹션을 먼저 보여줄지. */
  focus: "dashboard" | "categories";
  onClose: () => void;
}

/** 앞뒤 공백과 맨 앞 #을 털어낸다 — 칩에 #이 붙어 보이니 그대로 따라 치는 사람이 많다. */
function clean(value: string): string {
  return value.trim().replace(/^#+/, "").trim();
}

export function KeywordEditor({ focus, onClose }: Props) {
  const { keywords, saveKeywords, resetKeywords } = useUserData();

  // 저장을 누르기 전까지는 초안만 고친다. 취소하면 통째로 버려진다.
  const [draft, setDraft] = useState<KeywordSettings>(() =>
    structuredClone(keywords ?? DEFAULT_KEYWORD_SETTINGS),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (next: KeywordSettings) => {
    setError(null);
    setDraft(next);
  };

  // ── 대시보드 컬럼 ──
  const addDashboard = (raw: string) => {
    const keyword = clean(raw);
    if (!keyword) return false;
    if (draft.dashboardKeywords.includes(keyword)) {
      setError(`"${keyword}"는 이미 있어요.`);
      return false;
    }
    if (draft.dashboardKeywords.length >= MAX_DASHBOARD) {
      setError(`대시보드 컬럼은 최대 ${MAX_DASHBOARD}개까지예요.`);
      return false;
    }
    update({ ...draft, dashboardKeywords: [...draft.dashboardKeywords, keyword] });
    return true;
  };

  const removeDashboard = (keyword: string) =>
    update({
      ...draft,
      dashboardKeywords: draft.dashboardKeywords.filter((entry) => entry !== keyword),
    });

  const moveDashboard = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.dashboardKeywords.length) return;
    const next = [...draft.dashboardKeywords];
    [next[index], next[target]] = [next[target], next[index]];
    update({ ...draft, dashboardKeywords: next });
  };

  // ── 카테고리 ──
  const patchCategory = (index: number, patch: Partial<KeywordSettings["categories"][number]>) =>
    update({
      ...draft,
      categories: draft.categories.map((category, position) =>
        position === index ? { ...category, ...patch } : category,
      ),
    });

  const addCategory = () => {
    if (draft.categories.length >= MAX_CATEGORIES) {
      setError(`카테고리는 최대 ${MAX_CATEGORIES}개까지예요.`);
      return;
    }
    update({ ...draft, categories: [...draft.categories, { name: "", keywords: [] }] });
  };

  const removeCategory = (index: number) =>
    update({
      ...draft,
      categories: draft.categories.filter((_, position) => position !== index),
    });

  const addKeyword = (index: number, raw: string) => {
    const keyword = clean(raw);
    if (!keyword) return false;
    const category = draft.categories[index];
    if (category.keywords.includes(keyword)) {
      setError(`"${keyword}"는 이 카테고리에 이미 있어요.`);
      return false;
    }
    if (category.keywords.length >= MAX_KEYWORDS) {
      setError(`카테고리 하나에 키워드는 최대 ${MAX_KEYWORDS}개까지예요.`);
      return false;
    }
    patchCategory(index, { keywords: [...category.keywords, keyword] });
    return true;
  };

  const removeKeyword = (index: number, keyword: string) =>
    patchCategory(index, {
      keywords: draft.categories[index].keywords.filter((entry) => entry !== keyword),
    });

  // ── 저장 ──
  const handleSave = async () => {
    const categories = draft.categories.map((category) => ({
      name: category.name.trim(),
      keywords: category.keywords,
    }));

    if (categories.some((category) => !category.name)) {
      setError("이름이 비어 있는 카테고리가 있어요.");
      return;
    }
    const names = categories.map((category) => category.name);
    if (new Set(names).size !== names.length) {
      setError("카테고리 이름이 겹쳐요.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveKeywords({ dashboardKeywords: draft.dashboardKeywords, categories });
      onClose();
    } catch {
      setError("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    try {
      await resetKeywords();
      onClose();
    } catch {
      setError("되돌리지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="키워드 편집"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-background sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">키워드 편집</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-muted hover:text-foreground"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* focus 로 넘어온 섹션을 위에 놓는다. 둘 다 편집은 가능하다. */}
          {(focus === "dashboard" ? ["dashboard", "categories"] : ["categories", "dashboard"]).map(
            (section) =>
              section === "dashboard" ? (
                <section key="dashboard" className="mb-7">
                  <h3 className="text-sm font-semibold">대시보드 컬럼</h3>
                  <p className="mt-1 text-xs text-muted">
                    홈에 나란히 뜨는 키워드예요. 위에 있는 것부터 왼쪽에 놓입니다.
                  </p>

                  <ul className="mt-3 flex flex-col gap-1.5">
                    {draft.dashboardKeywords.map((keyword, index) => (
                      <li
                        key={keyword}
                        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                      >
                        <span className="flex-1 truncate text-sm">#{keyword}</span>
                        <button
                          type="button"
                          onClick={() => moveDashboard(index, -1)}
                          disabled={index === 0}
                          aria-label={`${keyword} 위로`}
                          className="grid size-8 place-items-center rounded-md text-muted hover:text-foreground disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDashboard(index, 1)}
                          disabled={index === draft.dashboardKeywords.length - 1}
                          aria-label={`${keyword} 아래로`}
                          className="grid size-8 place-items-center rounded-md text-muted hover:text-foreground disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDashboard(keyword)}
                          aria-label={`${keyword} 삭제`}
                          className="grid size-8 place-items-center rounded-md text-muted hover:text-foreground"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                    {draft.dashboardKeywords.length === 0 && (
                      <li className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
                        컬럼이 하나도 없어요. 아래에서 추가해 주세요.
                      </li>
                    )}
                  </ul>

                  <AddInput
                    placeholder="키워드 추가"
                    onAdd={addDashboard}
                    disabled={draft.dashboardKeywords.length >= MAX_DASHBOARD}
                  />
                </section>
              ) : (
                <section key="categories">
                  <h3 className="text-sm font-semibold">검색 카테고리</h3>
                  <p className="mt-1 text-xs text-muted">
                    검색 화면의 탭과 그 아래 칩이에요.
                  </p>

                  <div className="mt-3 flex flex-col gap-3">
                    {draft.categories.map((category, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-surface p-3"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            value={category.name}
                            onChange={(event) =>
                              patchCategory(index, { name: event.target.value })
                            }
                            placeholder="카테고리 이름"
                            aria-label={`${index + 1}번째 카테고리 이름`}
                            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                          />
                          <button
                            type="button"
                            onClick={() => removeCategory(index)}
                            aria-label={`${category.name || "이름 없는"} 카테고리 삭제`}
                            className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:text-foreground"
                          >
                            ✕
                          </button>
                        </div>

                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {category.keywords.map((keyword) => (
                            <li key={keyword}>
                              <button
                                type="button"
                                onClick={() => removeKeyword(index, keyword)}
                                aria-label={`${keyword} 삭제`}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:border-foreground/40 hover:text-foreground"
                              >
                                #{keyword}
                                <span aria-hidden>✕</span>
                              </button>
                            </li>
                          ))}
                          {category.keywords.length === 0 && (
                            <li className="py-1.5 text-xs text-muted">키워드가 없어요.</li>
                          )}
                        </ul>

                        <AddInput
                          placeholder="키워드 추가"
                          onAdd={(value) => addKeyword(index, value)}
                          disabled={category.keywords.length >= MAX_KEYWORDS}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addCategory}
                    disabled={draft.categories.length >= MAX_CATEGORIES}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
                  >
                    + 카테고리 추가
                  </button>
                </section>
              ),
          )}
        </div>

        <footer className="border-t border-border px-5 py-4">
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-500">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="min-h-11 rounded-lg px-3 text-sm text-muted hover:text-foreground disabled:opacity-40"
            >
              기본값으로
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="min-h-11 rounded-lg border border-border px-4 text-sm hover:border-foreground/40 disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/** 입력하고 Enter 또는 + 를 누르면 추가된다. 성공했을 때만 입력칸을 비운다. */
function AddInput({
  placeholder,
  onAdd,
  disabled,
}: {
  placeholder: string;
  onAdd: (value: string) => boolean;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (onAdd(value)) setValue("");
  };

  return (
    <div className="mt-2 flex gap-2">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          submit();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-40"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="min-h-11 shrink-0 rounded-lg border border-border px-4 text-sm hover:border-foreground/40 disabled:opacity-40"
      >
        추가
      </button>
    </div>
  );
}
