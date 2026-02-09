import { Suspense } from "react";
import AnalyzeClient from "../AnalyzeClient";

export default function Page({ params }: { params: { type: string } }) {
  // ✅ params.type を確実に文字列で渡す
  const type = String(params?.type ?? "");

  return (
    <Suspense fallback={<div className="page">読み込み中...</div>}>
      <AnalyzeClient type={type} />
    </Suspense>
  );
}