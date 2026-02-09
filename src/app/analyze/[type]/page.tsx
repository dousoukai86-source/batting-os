import { Suspense } from "react";
import AnalyzeClient from "../AnalyzeClient";

export default function Page({ params }: { params: { type: string } }) {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>読み込み中...</div>}>
      <AnalyzeClient type={params.type} />
    </Suspense>
  );
}