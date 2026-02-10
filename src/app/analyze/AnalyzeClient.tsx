"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis, type CatId } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";

type Props = {
  type: string; // route param: /analyze/[type]
};

function toCatId(v: string | null | undefined): CatId | null {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
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

  // ✅ ルート param の type を「1〜4」に正規化
  const cat = useMemo(() => toCatId(type), [type]);

  // ✅ movie は query で受け取る（なくてもOK）
  const movie = useMemo(() => {
    const m = sp.get("movie");
    // live-camera など文字列も来る想定。とりあえずそのまま保持
    return m ?? "live-camera";
  }, [sp]);

  // video 表示用（必要なら使う）
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 表示だけ（カテゴリ未選択に見えないようにする）
  const categoryText = useMemo(() => {
    if (!cat) return "未選択";
    return typeLabel(cat);
  }, [cat]);

  // ✅ type が不正なら、アラートじゃなくてトップへ戻す（これで “typeが不正” ダイアログ消える）
  useEffect(() => {
    if (!cat) router.replace("/");
  }, [cat, router]);

  const [toast, setToast] = useState<string | null>(null);

  const runDemo = () => {
    if (!cat) return;

    const res = makeDemoAnalysis(cat);

    // ✅ 履歴へ保存（movie も一緒に持たせる）
    addHistory({
      type: res.type,
      score: res.score,
      comment: res.summary,   // A
      drill: res.nextDrill,   // A
      breakdown: res.breakdown, // B
      src: movie === "live-camera" ? "live-camera" : movie,
    });

    // ✅ デモ実行後は必ず履歴へ遷移（「実行しました」だけで止まらない）
    router.push("/history");
  };

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">カテゴリ：{categoryText}</div>

        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.9, fontWeight: 800 }}>動画</div>

          {/* デモ用表示（カメラ/動画の実装は後でOK） */}
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

          {/* 必要なら後で video を繋ぐ
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

        {toast && (
          <div style={{ marginTop: 10, opacity: 0.85, fontSize: 12 }}>{toast}</div>
        )}
      </div>
    </main>
  );
}