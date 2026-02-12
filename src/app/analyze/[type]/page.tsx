// src/app/analyze/[type]/page.tsx
import AnalyzeClient from "../AnalyzeClient";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string): CatNum {
  // 数字(1-4)
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  // ローマ(I/II/III/IV)
  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  // 変なの来たら 1 に倒す（ビルド落ち防止）
  return 1;
}

export default function Page({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams?: { movie?: string };
}) {
  const cat = toCatNum(params.type);
  const movie = searchParams?.movie ?? "";

  // ✅ サーバー側では解析しない（clientに渡すだけ）
  return <AnalyzeClient type={cat} initialMovie={movie} />;
}