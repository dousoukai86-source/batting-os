import AnalyzeClient from "../AnalyzeClient";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string): CatNum {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  // 不正値は 1 に倒す（サーバーを落とさない）
  return 1;
}

export default function Page({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams?: { movie?: string };
}) {
  const type = toCatNum(params.type);
  const movie = searchParams?.movie ?? null; // ここでは触るだけ。復元はクライアントで。

  return <AnalyzeClient type={type} initialMovie={movie} />;
}