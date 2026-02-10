// src/app/analyze/[type]/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import AnalyzeClient from "../AnalyzeClient";

export default function Page({ params }: { params: { type: string } }) {
  // params.type は "1" | "2" | "3" | "4" の「文字列」
  const t = params.type;
  const n = Number(t);

  // 不正なtypeはトップへ
  if (!(n >= 1 && n <= 4)) redirect("/");

  return (
    <Suspense fallback={<div style={{ padding: 24 }}>解析中...</div>}>
      {/* ⭐ここが重要：numberじゃなくて文字列の t を渡す */}
      <AnalyzeClient type={t} />
    </Suspense>
  );
}