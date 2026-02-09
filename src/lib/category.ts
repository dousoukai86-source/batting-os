export type CategoryId = "I" | "II" | "III" | "IV";

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  I: "Ⅰ 前伸傾向",
  II: "Ⅱ 前沈傾向",
  III: "Ⅲ 後伸傾向",
  IV: "Ⅳ 後沈傾向",
};

export function normalizeCategory(
  v: string | number | null | undefined
): CategoryId | null {
  if (v == null) return null;

  // 数値 → ローマ数字
  if (typeof v === "number") {
    if (v === 1) return "I";
    if (v === 2) return "II";
    if (v === 3) return "III";
    if (v === 4) return "IV";
    return null;
  }

  const s = v.toUpperCase();
  if (s === "I" || s === "II" || s === "III" || s === "IV") return s;

  // "1"〜"4" の文字列も救済
  if (s === "1") return "I";
  if (s === "2") return "II";
  if (s === "3") return "III";
  if (s === "4") return "IV";

  return null;
}