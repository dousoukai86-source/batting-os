"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * UploadClient は /upload?page.tsx から
 *  - category（"1"〜"4"） ※ string想定
 *  - title（表示用文字列）
 * を props でもらう前提
 *
 * もし props 名が違うなら、ここだけ合わせてOK：
 * export default function UploadClient({ category, title }: Props)
 */
type Props = {
  category: string | null;
  title: string;
};

export default function UploadClient({ category, title }: Props) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [movieUrl, setMovieUrl] = useState<string>(""); // 解析に渡す動画URL（デモは空でOK）
  const [starting, setStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // ✅ category を “必ず数値(1-4)” に正規化して使う（これが最重要）
  const type = useMemo(() => {
    const n = Number(category);
    if ([1, 2, 3, 4].includes(n)) return n as 1 | 2 | 3 | 4;
    return null;
  }, [category]);

  const startCamera = async () => {
    if (starting) return;
    setStarting(true);

    try {
      // すでに起動してたら一旦止める
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch (e) {
      console.error(e);
      alert("カメラを起動できませんでした（ブラウザ権限を確認）");
      setCameraReady(false);
    } finally {
      setStarting(false);
    }
  };

  // 🛑 カメラ停止（ページ離脱時）
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // ✅ 解析へ遷移（404対策：/analyze/1 の形に強制）
  const goAnalyze = () => {
    if (!type) {
      alert("カテゴリが不正です（1〜4）: " + String(category));
      return;
    }

    const movie = movieUrl || "/uploads/demo.mov";
    router.push(`/analyze/${type}?movie=${encodeURIComponent(movie)}`);
  };

  return (
    <main>
      <div className="page">
        <div className="title">撮影</div>
        <div className="desc">カテゴリ：{title}</div>

        {/* カメラ表示 */}
        <div
          style={{
            marginTop: 16,
            borderRadius: 16,
            overflow: "hidden",
            background: "#000",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              aspectRatio: "16 / 9",
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: cameraReady ? "block" : "none",
              }}
            />
            {!cameraReady && (
              <div style={{ opacity: 0.75, padding: 16 }}>
                カメラは起動していません（デモ解析用）
              </div>
            )}
          </div>
        </div>

        {/* ボタン群 */}
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <button
            type="button"
            className="cta"
            onClick={startCamera}
            disabled={starting}
            style={{ opacity: starting ? 0.7 : 1 }}
          >
            {starting ? "カメラ起動中..." : "カメラを起動"}
          </button>

          <button type="button" className="cta" onClick={goAnalyze}>
            解析を実行（デモ）
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "12px",
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            トップへ戻る
          </button>
        </div>
      </div>
    </main>
  );
}