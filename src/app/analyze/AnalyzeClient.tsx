"use client";

// src/app/analyze/AnalyzeClient.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { makeDemoAnalysis, type CatId } from "@/lib/analysisText";
import { addHistory } from "@/lib/history";
import { loadVideoBlob } from "@/lib/videoStore";

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

  const cat = useMemo(() => toCatId(type), [type]);

  const movieParam = useMemo(() => sp.get("movie") ?? "live-camera", [sp]);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoNote, setVideoNote] = useState<string>("");

  // typeが不正ならトップへ
  useEffect(() => {
    if (!cat) router.replace("/matrix");
  }, [cat, router]);

  // movie を解決（idb:xxx の場合は IndexedDB から復元）
  useEffect(() => {
    let revoke: string | null = null;

    const run = async () => {
      setVideoSrc(null);
      setVideoNote("");

      if (movieParam.startsWith("idb:")) {
        const id = movieParam.slice("idb:".length);
        const blob = await loadVideoBlob(id);
        if (!blob) {
          setVideoNote("⚠️ 保存された動画が見つかりませんでした（端末を変えた/保存が消えた可能性）");
          return;
        }
        const url = URL.createObjectURL(blob);
        revoke = url;
        setVideoSrc(url);
        setVideoNote(`保存動画（${id}）`);
        return;
      }

      // live-camera や URL の場合
      if (movieParam === "live-camera") {
        setVideoNote("ライブカメラ（デモ解析）");
        return;
      }

      setVideoSrc(movieParam);
      setVideoNote("指定URL動画");
    };

    run();

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [movieParam]);

  const categoryText = useMemo(() => (cat ? typeLabel(cat) : "未選択"), [cat]);

  const runDemo = () => {
    if (!cat) return;
    const res = makeDemoAnalysis(cat);

    addHistory({
      type: res.type,
      score: res.score,
      comment: res.summary,
      drill: res.nextDrill,
      breakdown: res.breakdown,
      src: movieParam, // ✅ idb:xxxx のまま保存（再解析で復元できる）
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

          {/* 保存動画があるなら再生 */}
          {videoSrc ? (
            <video
              controls
              playsInline
              src={videoSrc}
              style={{
                width: "100%",
                borderRadius: 16,
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          ) : (
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
              {movieParam === "live-camera" ? "カメラは起動しています（デモ解析用）" : "動画を読み込み中..."}
            </div>
          )}

          {videoNote && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>{videoNote}</div>}
        </div>

        <button type="button" className="cta" onClick={runDemo} style={{ marginTop: 14 }} disabled={!cat}>
          解析を実行（デモ）
        </button>

        <button
          type="button"
          onClick={() => router.push("/matrix")}
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
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}