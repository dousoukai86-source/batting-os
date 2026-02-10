// src/app/analyze/AnalyzeClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis, type CatId, type AnalysisResult } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

type Props = {
  type: 1 | 2 | 3 | 4; // ✅ サーバーから数字で渡す前提に合わせる
};

function typeLabel(type: 1 | 2 | 3 | 4) {
  return type === 1
    ? "Ⅰ 前伸傾向"
    : type === 2
    ? "Ⅱ 前沈傾向"
    : type === 3
    ? "Ⅲ 後伸傾向"
    : "Ⅳ 後沈傾向";
}

export default function AnalyzeClient({ type }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ movie はクエリで受け取る（なくてもOK）
  const movie = useMemo(() => sp.get("movie") ?? "live-camera", [sp]);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDemo = async () => {
    setLoading(true);

    // ✅ type は props から必ず 1〜4 で来るので「不正」分岐を消す
    const res = makeDemoAnalysis(type as CatId);

    addHistory({
      type: res.type,
      score: res.score,
      comment: res.summary,       // A
      drill: res.nextDrill,       // A
      breakdown: res.breakdown,   // B
      src: movie,
    });

    setResult(res);
    setLoading(false);

    // ✅ “結果へ遷移しない” 問題を消す：実行後は履歴へ
    router.push("/history");
  };

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">カテゴリ：{typeLabel(type)}</div>

        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.9, fontWeight: 800 }}>動画</div>

          {/* ✅ live-camera は video を出さない（今はデモ表示） */}
          {movie === "live-camera" ? (
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "grid",
                placeItems: "center",
                color: "rgba(255,255,255,0.75)",
                fontWeight: 900,
              }}
            >
              カメラ映像（デモ）※保存はまだ
            </div>
          ) : (
            <video
              src={movie}
              controls
              playsInline
              style={{ width: "100%", borderRadius: 16 }}
            />
          )}
        </div>

        <button
          type="button"
          className="cta"
          onClick={runDemo}
          style={{ marginTop: 14 }}
          disabled={loading}
        >
          {loading ? "解析中..." : "解析を実行（デモ）"}
        </button>

        {/* デバッグ表示（消したければ消してOK） */}
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          type={type} / movie={movie}
        </div>

        {result && (
          <div style={{ marginTop: 14, opacity: 0.9, fontSize: 12 }}>
            （resultを保存しました。履歴へ移動します）
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            marginTop: 12,
            width: "100%",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            padding: "12px",
            borderRadius: 16,
            fontWeight: 800,
          }}
        >
          トップへ戻る
        </button>
      </div>
    </main>
  );
}