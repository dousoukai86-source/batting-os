// src/app/analyze/[type]/page.tsx
import { Suspense } from "react";
import AnalyzeClient from "../AnalyzeClient";

export default function Page({ params }: { params: { type: string } }) {
  return (
    <Suspense fallback={<div className="page">読み込み中...</div>}>
      <AnalyzeClient type={params.type} />
    </Suspense>
  );
}