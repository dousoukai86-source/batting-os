import AnalyzeClient from "./AnalyzeClient";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string): CatNum {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  return 1; // fallback
}

export default async function Page({
  params,
}: {
  params: { type: string };
}) {
  const cat = toCatNum(params.type);

  return <AnalyzeClient type={cat} />;
}