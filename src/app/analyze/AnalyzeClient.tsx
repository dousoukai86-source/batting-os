"use client";

// src/app/analyze/AnalyzeClient.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis, type CatId } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

type Props = {
  type: string; // route param: /analyze/[type]
};

/** ✅ UploadClient と同じ：何が来ても 1〜4 に寄せる（"1" / "IV" / "Ⅳ" など） */
function toCatId(v: string | null | undefined): CatId | null {
  if (!v) return null;
  const s = v.trim().toUpperCase();

  // 数字
  if (s === "1") return 1 as CatId;
  if (s === "2") return 2 as CatId;
  if (s === "3") return 3 as CatId;
  if (s === "4") return 4 as CatId;

  // ローマ数字（ASCII）
  if (s === "I") return 1 as CatId;
  if (s === "II") return 2 as CatId;
  if (s === "III") return 3 as CatId;
  if (s === "IV") return 4 as CatId;

  // ローマ数字（全角）
  if (s === "Ⅰ") return 1 as CatId;
  if (s === "Ⅱ") return 2 as CatId;
  if (s === "Ⅲ") return 3 as CatId;
  if (s === "Ⅳ") return 4 as CatId;

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

  // ✅ route param の type を「1〜4」に正規化
  const cat = useMemo(() => toCatId(type), [type]);

  // ✅ movie は query で受け取る（なくてもOK）
  const movie = useMemo(() => sp.get("movie") ?? "live-camera", [sp]);

  // video 表示用（今は使わない）
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const categoryText = useMemo(() => {
    if (!cat) return "未選択";
    return typeLabel(cat);
  }, [cat]);

  // ✅ ここが超重要：type が空のとき(一瞬)に誤爆しないようにガードする
  useEffect(() => {
    // type が空/未定義っぽい瞬間は何もしない
    if (!type) return;

    // type が確定してるのに cat が作れない → 不正URLなのでトップへ
    if (!cat) router.replace("/");
  }, [type, cat, router]);

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

          {/* 後で繋ぐなら
          <video ref={videoRef} controls playsInline style={{ width: "100%", borderRadius: 16 }} />
          */}
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