"use client";

// src/app/analyze/AnalyzeClient.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis, type CatId } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

type Props = {
  type: string; // route param: /analyze/[type]
};

/** 何が来ても 1〜4 に寄せる（"4" / "IV" / "Ⅳ" / "IV 後沈傾向" など全部OK） */
function toCatId(v: string | null | undefined): CatId | null {
  if (!v) return null;

  // "IV 後沈傾向" みたいなのも来るので、先頭トークンだけ抜く
  const raw = v.trim();
  const first = raw.split(/[\s　]/)[0].toUpperCase(); // 半角/全角スペース対応

  // 数字
  if (first === "1") return 1;
  if (first === "2") return 2;
  if (first === "3") return 3;
  if (first === "4") return 4;

  // ローマ数字（ASCII）
  if (first === "I") return 1;
  if (first === "II") return 2;
  if (first === "III") return 3;
  if (first === "IV") return 4;

  // ローマ数字（全角）
  if (first === "Ⅰ") return 1;
  if (first === "Ⅱ") return 2;
  if (first === "Ⅲ") return 3;
  if (first === "Ⅳ") return 4;

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

  // ✅ route param の type を「1〜4」に正規化（IVでもOK）
  const cat = useMemo(() => toCatId(type), [type]);

  // ✅ movie は query で受け取る（なくてもOK）
  const movie = useMemo(() => sp.get("movie") ?? "live-camera", [sp]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const categoryText = useMemo(() => {
    if (!cat) return "未選択";
    return typeLabel(cat);
  }, [cat]);

  // ✅ type が不正ならトップへ（ただし今回の toCatId でほぼ起きない）
  useEffect(() => {
    if (!cat) router.replace("/");
  }, [cat, router]);

  const [toast, setToast] = useState<string | null>(null);

  const runDemo = () => {
    if (!cat) return;

    const res = makeDemoAnalysis(cat);

    addHistory({
      type: res.type,
      score: res.score,
      comment: res.summary,
      drill: res.nextDrill,
      breakdown: res.breakdown,
      src: movie === "live-camera" ? "live-camera" : movie,
    });

    router.push("/history");
  };

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">カテゴリ：{categoryText}</div>

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
          disabled={!cat}
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

        {toast && <div style={{ marginTop: 10, opacity: 0.85, fontSize: 12 }}>{toast}</div>}
      </div>
    </main>
  );
}