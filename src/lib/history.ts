// src/lib/history.ts

export type HistoryItem = {
  id: string;
  createdAt: number;
  type: 1 | 2 | 3 | 4;

  // A（文章）
  comment?: string; // 解析コメント
  drill?: string;   // 次の宿題

  // B（数値）
  score?: number;
  breakdown?: {
    posture: number; // 姿勢
    weight: number;  // 体重移動
    impact: number;  // インパクト
    repeat: number;  // 再現性
    timing: number;  // タイミング
  };

  // 元動画の参照（URL or "live-camera" など）
  src?: string;
};

const KEY = "batting_os_history";

function safeParse<T>(v: string | null): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  const parsed = safeParse<HistoryItem[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function addHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
  if (typeof window === "undefined") return;

  const cur = getHistory();

  const next: HistoryItem = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: Date.now(),
    ...item,
  };

  // 新しい順で先頭に積む
  localStorage.setItem(KEY, JSON.stringify([next, ...cur]));
}