"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type AnalyzeResult = {
  type: 1 | 2 | 3 | 4;
  total: number;
  breakdown: {
    posture: number;
    weight: number;
    impact: number;
    reproducibility: number;
    timing: number;
  };
  comment: string;
  nextDrill: string;
};

function toType(raw: string | string[] | undefined): 1 | 2 | 3 | 4 | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "1" || v === "2" || v === "3" || v === "4") return Number(v) as 1 | 2 | 3 | 4;
  return null;
}

function typeMeta(type: 1 | 2 | 3 | 4) {
  switch (type) {
    case 1:
      return { roman: "Ⅰ", title: "前伸傾向", sub: "前傾 × 伸び上がり" };
    case 2:
      return { roman: "Ⅱ", title: "前沈傾向", sub: "前傾 × 沈み込み" };
    case 3:
      return { roman: "Ⅲ", title: "後伸傾向", sub: "後傾 × 伸び上がり" };
    case 4:
      return { roman: "Ⅳ", title: "後沈傾向", sub: "後傾 × 沈み込み" };
  }
}

export default function AnalyzeByTypePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // ✅ ここが「カテゴリリンク」の本体：URLの /analyze/[type] から type を取る
  const type = useMemo(() => toType(params?.type), [params]);
  const movie = searchParams.get("movie") ?? "/uploads/demo.mov";

  const meta = useMemo(() => (type ? typeMeta(type) : null), [type]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDemo, setOpenDemo] = useState(false);

  const runAnalyzeDemo = async () => {
    if (!type) {
      alert("type が取れてない！ /analyze/1 みたいに開けてるか確認して");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ ここで API を叩く（無い場合は下に貼る route.ts を作ればOK）
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, movie }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `API error: ${res.status}`);
      }

      const data = (await res.json()) as AnalyzeResult;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "解析に失敗した");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="page" style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="title" style={{ fontSize: 34, lineHeight: 1.1 }}>
              解析ページ
            </div>
            <div className="desc" style={{ marginTop: 6 }}>
              カテゴリ：{meta ? `${meta.roman} ${meta.title}` : "不明"}{" "}
              <span style={{ opacity: 0.7 }}>（{meta?.sub ?? "-"}）</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/history")}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 999,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            履歴を見る →
          </button>
        </div>

        {/* デバッグ（必要なら残してOK） */}
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6, opacity: 0.9 }}>デバッグ</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>URLの type = {String(type)}</div>
          <div style={{ fontSize: 13, opacity: 0.85, wordBreak: "break-all" }}>movie = {movie}</div>
        </div>

        {/* 動画カード */}
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10, opacity: 0.9 }}>動画</div>

          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <video
              src={movie}
              controls
              playsInline
              style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff",
                padding: "12px 12px",
                borderRadius: 14,
                fontWeight: 800,
              }}
            >
              ← トップへ
            </button>

            <button
              type="button"
              className="cta"
              onClick={() => setOpenDemo(true)}
              style={{ flex: 2 }}
            >
              解析を実行（デモ）
            </button>
          </div>
        </div>

        {/* 結果カード */}
        <div
          style={{
            marginTop: 14,
            padding: 16,
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>総合スコア</div>
            <div style={{ fontWeight: 900, fontSize: 56, lineHeight: 1 }}>{result?.total ?? "--"}</div>
          </div>

          <div style={{ marginTop: 8, opacity: 0.9, fontWeight: 900 }}>内訳</div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {[
              ["姿勢", result?.breakdown.posture],
              ["体重移動", result?.breakdown.weight],
              ["インパクト", result?.breakdown.impact],
              ["再現性", result?.breakdown.reproducibility],
              ["タイミング", result?.breakdown.timing],
            ].map(([label, v]) => (
              <div
                key={String(label)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontWeight: 800 }}>{label}</div>
                <div style={{ fontWeight: 900 }}>{typeof v === "number" ? `${v}/20` : "--/20"}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, fontWeight: 900, opacity: 0.9 }}>コーチコメント</div>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 14,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.10)",
              lineHeight: 1.6,
              opacity: 0.92,
            }}
          >
            {result?.comment ?? "（解析を実行するとここにコメントが出ます）"}
          </div>

          <div style={{ marginTop: 14, fontWeight: 900, opacity: 0.9 }}>次のドリル</div>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 14,
              background: "rgba(0,0,0,0.22)",
              border: "1px solid rgba(255,255,255,0.10)",
              lineHeight: 1.6,
              opacity: 0.92,
            }}
          >
            {result?.nextDrill ?? "（解析を実行するとここにドリルが出ます）"}
          </div>

          {error && (
            <div style={{ marginTop: 14, color: "#ffb3b3", fontWeight: 800 }}>
              エラー：{error}
            </div>
          )}
        </div>

        {/* モーダル（デモ） */}
        {openDemo && (
          <div
            onClick={() => setOpenDemo(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(520px, 100%)",
                borderRadius: 18,
                background: "rgba(20,20,22,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>解析を実行（デモ）</div>
              <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.6 }}>
                いまはデモです。APIを叩いて結果を画面に反映します。
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setOpenDemo(false)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.20)",
                    color: "#fff",
                    padding: "12px 12px",
                    borderRadius: 14,
                    fontWeight: 900,
                  }}
                >
                  閉じる
                </button>

                <button
                  type="button"
                  className="cta"
                  onClick={async () => {
                    setOpenDemo(false);
                    await runAnalyzeDemo();
                  }}
                  disabled={loading}
                  style={{
                    flex: 2,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "解析中…" : "実行する"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}