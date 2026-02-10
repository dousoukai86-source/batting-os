// src/app/analyze/[type]/page.tsx
import { Suspense } from "react";
import AnalyzeClient from "../AnalyzeClient";

type Props = {
  params: { type: string };
};

export default function Page({ params }: Props) {
  const type = Number(params.type);

  if (!(type >= 1 && type <= 4)) {
    return <div style={{ padding: 24 }}>type が不正です（/analyze/1〜4）</div>;
  }

  return (
    <Suspense fallback={<div style={{ padding: 24 }}>解析中...</div>}>
      <AnalyzeClient type={type as 1 | 2 | 3 | 4} />
    </Suspense>
  );
}