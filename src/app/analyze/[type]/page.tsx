// src/app/analyze/[type]/page.tsx
import { Suspense } from "react";
import AnalyzeClient from "../AnalyzeClient";

function toType(v: string): 1 | 2 | 3 | 4 | null {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return null;
}

export default function AnalyzePage({
  params,
}: {
  params: { type: string };
}) {
  const type = toType(params.type);

  // ✅ ここでトップへ戻さない（戻る地獄の原因になる）
  // type が不正なら「ページ内にエラー表示」して終わり
  if (!type) {
    return (
      <main>
        <div className="page">
          <div className="title">解析</div>
          <div className="desc">type が不正です：{params.type}</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            正しいURL例：/analyze/1?movie=live-camera
          </div>
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={<div className="page">Loading...</div>}>
      {/* ✅ 必ず 1〜4 の “数字” を渡す */}
      <AnalyzeClient type={type} />
    </Suspense>
  );
}