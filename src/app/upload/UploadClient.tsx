"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CatNum = 1 | 2 | 3 | 4;

// "IV" / "Ⅳ" / "4" / "Ⅰ" など何が来ても 1〜4 に正規化
function toType(raw: string | null | undefined): CatNum | null {
  if (!raw) return null;
  const s = String(raw).trim();

  // まず数字
  if (s === "1" || s === "2" || s === "3" || s === "4") return Number(s) as CatNum;

  // ローマ数字（ASCII）
  const upper = s.toUpperCase();
  if (upper === "I") return 1;
  if (upper === "II") return 2;
  if (upper === "III") return 3;
  if (upper === "IV") return 4;

  // ローマ数字（全角っぽい記号）
  if (s.includes("Ⅰ")) return 1;
  if (s.includes("Ⅱ")) return 2;
  if (s.includes("Ⅲ")) return 3;
  if (s.includes("Ⅳ")) return 4;

  // 表示用の "I/II/III/IV 前伸〜" みたいなのにも対応
  if (upper.includes("IV")) return 4;
  if (upper.includes("III")) return 3;
  if (upper.includes("II")) return 2;
  if (upper.includes("I")) return 1;

  return null;
}

function labelOf(type: CatNum) {
  return type === 1
    ? "I 前伸傾向"
    : type === 2
    ? "II 前沈傾向"
    : type === 3
    ? "III 後伸傾向"
    : "IV 後沈傾向";
}

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // /upload?category=... から受け取る（数字でもIVでもOK）
  const type = useMemo<CatNum | null>(() => toType(sp.get("category")), [sp]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [movieUrl, setMovieUrl] = useState<string>("");
  const [cameraReady, setCameraReady] = useState(false);

  // ✅ iOS Safari対策：ユーザー操作（ボタンタップ）で getUserMedia を呼ぶ
  const startCamera = async () => {
    try {
      // 既に起動してたら何もしない
      if (streamRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS対策
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch (e) {
      console.error(e);
      alert("カメラを起動できません。Safariのカメラ許可を確認してください。");
    }
  };

  // ✅ ページ離脱でカメラ停止
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const goAnalyze = () => {
    if (!type) {
      alert("カテゴリが取れていません。トップからカテゴリ選択し直してね。");
      return;
    }

    // デモ用：動画URLが無ければ固定デモへ
    const movie = movieUrl || "/uploads/demo.mov";

    // ✅ ここが最重要：/analyze/[type] は 1〜4 の数字で行く
   router.push(`/analyze/${category}?movie=live-camera`);
  };

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
        <div className="desc">カテゴリ：{type ? labelOf(type) : "未選択"}</div>

        {/* カメラ枠 */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>カメラ</div>

          <button
            type="button"
            className="cta"
            onClick={startCamera}
            style={{ width: "100%", marginBottom: 12 }}
          >
            カメラを起動（タップ必須）
          </button>

          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              height: 240,
              display: "grid",
              placeItems: "center",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: cameraReady ? "block" : "none",
              }}
            />
            {!cameraReady && (
              <div style={{ opacity: 0.7 }}>上のボタンでカメラを起動してください</div>
            )}
          </div>
        </div>

        {/* 解析へ */}
        <button
          type="button"
          className="cta"
          onClick={goAnalyze}
          style={{ width: "100%", marginTop: 18 }}
        >
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
            padding: "14px",
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