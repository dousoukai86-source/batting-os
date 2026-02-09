"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis, type AnalysisResult } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

function typeLabel(type: string | null) {
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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.85 }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: "100%",
            borderRadius: 999,
            background: "rgba(255,255,255,0.75)",
          }}
        />
      </div>
    </div>
  );
}

export default function AnalyzeClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ type: string }>();

  // ✅ ここが超重要：/analyze/3 の「3」を読む
  const typeStr = params?.type ?? null;

  // movie はクエリから読む（?movie=...）
  const movie = sp.get("movie") || "";

  const typeNum = useMemo(() => {
    const n = Number(typeStr);
    return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
  }, [typeStr]);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDemo = async () => {
    if (!typeNum) {
      alert("type が不正です（URLが /analyze/1 の形になってるか確認して）");
      return;
    }
    setLoading(true);

    const r = makeDemoAnalysis(typeNum);

    // ✅ 履歴保存（A/B両方）
    addHistory({
      type: typeNum,
      src: movie,
      score: r.score,
      comment: r.summary,
      drill: r.nextDrill,
      breakdown: r.breakdown,
    });

    setResult(r);
    setLoading(false);
  };

  const isLiveCamera = movie === "live-camera";

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">カテゴリ：{typeLabel(typeStr)}</div>

        {/* ✅ live-camera のときは video を出さない */}
        {!isLiveCamera && (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>動画</div>
            {movie ? (
              <video
                src={movie}
                controls
                playsInline
                style={{ width: "100%", borderRadius: 12 }}
              />
            ) : (
              <div style={{ opacity: 0.8, fontSize: 13 }}>
                movie が空です（?movie=/uploads/... の形で来てるか確認）
              </div>
            )}
          </div>
        )}

        {isLiveCamera && (
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 6 }}>動画</div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              live-camera（撮影中の映像）はこのデモでは保存されません。<br />
              解析は「デモ結果」を表示します。
            </div>
          </div>
        )}

        <button
          type="button"
          className="cta"
          onClick={runDemo}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "解析中..." : "解析を実行（デモ）"}
        </button>

        {result && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              スコア：{result.score}
            </div>

            <div style={{ marginTop: 10, fontWeight: 900 }}>コーチコメント（A）</div>
            <div style={{ opacity: 0.92, whiteSpace: "pre-wrap" }}>{result.summary}</div>

            <div style={{ marginTop: 10, fontWeight: 900 }}>次の宿題（A）</div>
            <div style={{ opacity: 0.92, whiteSpace: "pre-wrap" }}>{result.nextDrill}</div>

            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>数値（B）</div>
              <div style={{ display: "grid", gap: 10 }}>
                <Bar label="姿勢" value={result.breakdown.posture} />
                <Bar label="体重移動" value={result.breakdown.weight} />
                <Bar label="インパクト" value={result.breakdown.impact} />
                <Bar label="再現性" value={result.breakdown.repeat} />
                <Bar label="タイミング" value={result.breakdown.timing} />
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push("/history")}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            履歴を見る
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            トップへ戻る
          </button>
        </div>
      </div>
    </main>
  );
}