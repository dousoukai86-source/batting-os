import AnalyzeClient from "../AnalyzeClient";

export const runtime = "nodejs"; // 念のため
export const dynamic = "force-dynamic"; // クエリ(movie)で変わるので

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string): CatNum {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  const s = (v ?? "").toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  // 変なの来たら 1 に倒す（落とさない）
  return 1;
}

export default function Page({
  params,
  searchParams,
}: {
  params: { type: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const type = toCatNum(params.type);

  const movieRaw = searchParams?.movie;
  const movie = Array.isArray(movieRaw) ? movieRaw[0] : movieRaw; // string | undefined

  return <AnalyzeClient type={type} movie={movie ?? ""} />;
}