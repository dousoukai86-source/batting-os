"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

type CatId = 1 | 2 | 3 | 4;

type Props = {
  type: string; // route param: /analyze/[type]
};

/** 何が来ても 1〜4 に寄せる（"1" / "IV" / "Ⅳ" など） */
function toCatId(v: string | null | undefined): CatId | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();

  // 数字
  if (s === "1") return 1;
  if (s === "2") return 2;
  if (s === "3") return 3;
  if (s === "4") return 4;

  // ローマ数字（ASCII）
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  // ローマ数字（全角）
  if (s === "Ⅰ") return 1;
  if (s === "Ⅱ") return 2;
  if (s === "Ⅲ") return 3;
  if (s === "Ⅳ") return 4;

  return null;
}

function typeLabel(type: CatId) {
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

  // ✅ route param の type を「1〜4」に正規化（ここが肝）
  const cat = useMemo(() => toCatId(type), [type]);

  // ✅ movie は query で受け取る（なくてもOK）
  const movie = useMemo(() => sp.get("movie") ?? "live-camera", [sp]);

  const [debugOpen, setDebugOpen] = useState(false);

  const runDemo = () => {
    if (!cat) return;

    const res = makeDemoAnalysis(cat);

    addHistory({
      type: res.type,
      score: res.score,
      comment: res.summary,
      drill: res.nextDrill,
      breakdown: res.breakdown,
      src: movie,
    });

    router.push("/history");
  };

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>

        {/* ✅ ここで “受け取ったtype” を見える化（トップ戻りを防ぐ） */}
        {!cat ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 900 }}>⚠️ 解析タイプが不正で止まっています</div>
            <div style={{ opacity: 0.9, marginTop: 6 }}>
              受け取った params.type：<b>{String(type)}</b>
              <br />
              movie：<b>{String(movie)}</b>
            </div>

            <button
              type="button"
              className="cta"
              onClick={() => router.replace("/")}
              style={{ marginTop: 12 }}
            >
              トップへ戻る
            </button>

            <button
              type="button"
              onClick={() => setDebugOpen((v) => !v)}
              style={{
                marginTop: 10,
                width: "100%",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                padding: "12px",
                borderRadius: 16,
                fontWeight: 800,
              }}
            >
              デバッグ表示 {debugOpen ? "▲" : "▼"}
            </button>

            {debugOpen && (
              <pre style={{ marginTop: 10, fontSize: 12, opacity: 0.9, whiteSpace: "pre-wrap" }}>
{`URLの例（数字にしたい）:
  /analyze/1
  /analyze/2
  /analyze/3
  /analyze/4

今来てる type が "IV 後沈傾向" みたいな文字列なら、
Upload 側が /analyze/${type} に label を入れてる可能性が高い。`}
              </pre>
            )}
          </div>
        ) : (
          <>
            <div className="desc">カテゴリ：{typeLabel(cat)}</div>

            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8, opacity: 0.9, fontWeight: 800 }}>動画</div>

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
                カメラは起動しています（デモ解析用）
              </div>
            </div>

            <button
              type="button"
              className="cta"
              onClick={runDemo}
              style={{ marginTop: 14 }}
            >
              解析を実行（デモ）
            </button>

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
          </>
        )}
      </div>
    </main>
  );
}