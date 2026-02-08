"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function catLabelFromCategory(category: string | null) {
  switch (category) {
    case "1":
      return "Ⅰ 前伸傾向";
    case "2":
      return "Ⅱ 前沈傾向";
    case "3":
      return "Ⅲ 後伸傾向";
    case "4":
      return "Ⅳ 後沈傾向";
    default:
      return "未選択";
  }
}

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => catLabelFromCategory(category), [category]);

  // 🎥 カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // スマホは背面カメラ
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (e) {
      console.error(e);
      setError("カメラを起動できませんでした");
    }
  };

  // 🛑 カメラ停止（ページ離脱時）
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const goAnalyze = () => {
    if (!category) {
      alert("カテゴリが取れてない！");
      return;
    }
    router.push(`/analyze/${category}?movie=live-camera`);
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
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: 260,
              objectFit: "cover",
              display: cameraOn ? "block" : "none",
            }}
          />

          {!cameraOn && (
            <div
              style={{
                height: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#aaa",
                fontWeight: 700,
              }}
            >
              カメラはまだ起動していません
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 12, color: "#ff8a8a", fontWeight: 700 }}>
            {error}
          </div>
        )}

        {/* 操作ボタン */}
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <button type="button" className="cta" onClick={startCamera}>
            カメラを起動
          </button>

          <button
            type="button"
            className="cta"
            onClick={goAnalyze}
            disabled={!cameraOn}
            style={{
              opacity: cameraOn ? 1 : 0.5,
              cursor: cameraOn ? "pointer" : "not-allowed",
            }}
          >
            この映像を解析へ →
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
            ← 戻る
          </button>
        </div>
      </div>
    </main>
  );
}