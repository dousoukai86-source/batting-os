// src/lib/history.ts
export type Breakdown = {
  posture: number; // 姿勢
  weight: number;  // 体重移動
  impact: number;  // インパクト
  repeat: number;  // 再現性
  timing: number;  // タイミング
};

export type HistoryItem = {
  id: string;
  createdAt: string; // ISO
  type: 1 | 2 | 3 | 4;
  src: string;
  score?: number;
  comment?: string; // A：コーチ文
  drill?: string;   // A：次の宿題
  breakdown?: Breakdown; // B：数値
};

const KEY = "batting-os:history";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addHistory(item: Omit<HistoryItem, "id" | "createdAt">) {
  const now = new Date().toISOString();
  const next: HistoryItem = { id: makeId(), createdAt: now, ...item };
  const list = getHistory();
  setHistory([next, ...list]);
  return next;
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}