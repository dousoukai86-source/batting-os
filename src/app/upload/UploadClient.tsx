"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string | null): CatNum | null {
  if (!v) return null;

  // 数字で来た場合（1-4）
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  // ローマ数字で来た場合（I/II/III/IV）
  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  return null;
}

function catTitle(n: CatNum) {
  return n === 1
    ? "Ⅰ 前伸傾向"
    : n === 2
    ? "Ⅱ 前沈傾向"
    : n === 3
    ? "Ⅲ 後伸傾向"
    : "Ⅳ 後沈傾向";
}

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ category を 1-4 に正規化
  const category = useMemo<CatNum | null>(() => toCatNum(sp.get("category")), [sp]);

  const title = category ? catTitle(category) : "未選択";

  // ---- camera ----
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = async () => {
    try {
      setCameraError(null);

      // 既存停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS対策：playsInline + muted + autoplay
        videoRef.current.muted = true;
        (videoRef.current as any).playsInline = true;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
    } catch (e: any) {
      setIsCameraOn(false);
      setCameraError(e?.message ?? "カメラを起動できませんでした");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  useEffect(() => {
    // ページ離脱で停止
    return () => stopCamera();
  }, []);

  // ---- go analyze ----
  const goAnalyze = () => {
    if (!category) {
      alert("カテゴリが取れてない！（category が 1〜4 / I〜IV になってるか確認）");
      return;
    }

    // デモ動画（必要なら自分のURLに差し替え）
    const movieUrl = "/uploads/demo.mov";

    // ✅ ここが最重要：type は 1-4 で渡す
    router.push(`/analyze?type=${category}&movie=${encodeURIComponent(movieUrl)}`);
  };

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
        <div className="desc">カテゴリ：{title}</div>

        {/* カメラ表示 */}
        <div style={{ marginTop: 14, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
          <div style={{ padding: 12, fontWeight: 800, opacity: 0.9 }}>カメラ</div>

          <div style={{ padding: 12 }}>
            {!isCameraOn ? (
              <button type="button" className="cta" onClick={startCamera} style={{ width: "100%" }}>
                カメラを起動（タップ必須）
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: 14,
                  fontWeight: 800,
                }}
              >
                カメラ停止
              </button>
            )}

            {cameraError && <div style={{ marginTop: 10, opacity: 0.85 }}>⚠️ {cameraError}</div>}
          </div>

          <div style={{ padding: 12 }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: 240,
                borderRadius: 14,
                background: "rgba(0,0,0,0.35)",
                objectFit: "cover",
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="button" className="cta" onClick={goAnalyze} style={{ width: "100%" }}>
            解析へ進む（デモ）
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              width: "100%",
              marginTop: 10,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "12px",
              borderRadius: 14,
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