export type CategoryId = "I" | "II" | "III" | "IV";

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  I: "Ⅰ 前伸傾向",
  II: "Ⅱ 前沈傾向",
  III: "Ⅲ 後伸傾向",
  IV: "Ⅳ 後沈傾向",
};

export function normalizeCategory(v: string | null | undefined): CategoryId | null {
  if (!v) return null;
  const s = v.toUpperCase();
  if (s === "I" || s === "II" || s === "III" || s === "IV") return s;
  return null;
}