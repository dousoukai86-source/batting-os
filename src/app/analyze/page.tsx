import { Suspense } from "react";
import AnalyzeClient from "./AnalyzeClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>解析準備中...</div>}>
      <AnalyzeClient />
    </Suspense>
  );
}