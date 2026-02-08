// src/app/analyze/page.tsx
import { Suspense } from "react";
import AnalyzeClient from "./AnalyzeClient";

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <AnalyzeClient />
    </Suspense>
  );
}