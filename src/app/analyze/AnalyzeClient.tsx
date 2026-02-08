"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { makeDemoAnalysis, type AnalysisResult } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

function typeLabel(type: string) {
  switch (type) {
    case "1": return "Ⅰ 前伸傾向";
    case "2": return "Ⅱ 前沈傾向";
    case "3": return "Ⅲ 後伸傾向";
    case "4": return "Ⅳ 後沈傾向";
    default: return "未選択";
  }
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.2)" }}>
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: 999,
            background: "#fff",
          }}
        />
      </div>
    </div>
  );
}

export default function AnalyzeClient({ type }: { type: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const movie = sp.get("movie");

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDemo = () => {
    setLoading(true);
    const r = makeDemoAnalysis(Number(type));
    addHistory({
      type: Number(type),
      src: movie ?? "",
      score: r.score,
      comment: r.summary,
      drill: r.nextDrill,
      breakdown: r.breakdown,
    });
    setResult(r);
    setLoading(false);
  };

  return (
    <main className="page">
      <h1>解析</h1>
      <p>カテゴリ：{typeLabel(type)}</p>

      {/* 🎥 live-camera のときは動画を出さない */}
      {movie !== "live-camera" && movie && (
        <video
          src={movie}
          controls
          playsInline
          style={{ width: "100%", borderRadius: 12 }}
        />
      )}

      <button className="cta" onClick={runDemo} disabled={loading}>
        {loading ? "解析中…" : "解析を実行（デモ）"}
      </button>

      {result && (
        <>
          <h2>スコア：{result.score}</h2>

          <h3>コーチコメント</h3>
          <p>{result.summary}</p>

          <h3>次の宿題</h3>
          <p>{result.nextDrill}</p>

          <div style={{ display: "grid", gap: 10 }}>
            <Bar label="姿勢" value={result.breakdown.posture} />
            <Bar label="体重移動" value={result.breakdown.weight} />
            <Bar label="インパクト" value={result.breakdown.impact} />
            <Bar label="再現性" value={result.breakdown.repeat} />
            <Bar label="タイミング" value={result.breakdown.timing} />
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => router.push("/history")}>履歴を見る</button>
        <button onClick={() => router.push("/")}>トップへ戻る</button>
      </div>
    </main>
  );
}