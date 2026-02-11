"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CatId = 1 | 2 | 3 | 4;

const labelOf = (t: CatId) =>
  t === 1 ? "Ⅰ 前伸傾向" : t === 2 ? "Ⅱ 前沈傾向" : t === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";

const toCatId = (v: string | null | undefined): CatId | null => {
  if (!v) return null;
  const s = v.trim().toUpperCase();
  if (s === "1" || s === "I" || s === "Ⅰ") return 1;
  if (s === "2" || s === "II" || s === "Ⅱ") return 2;
  if (s === "3" || s === "III" || s === "Ⅲ") return 3;
  if (s === "4" || s === "IV" || s === "Ⅳ") return 4;
  return null;
};

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const type = useMemo<CatId | null>(() => toCatId(sp.get("category")), [sp]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camState, setCamState] = useState<"idle" | "on" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const isSecure = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.location.protocol === "https:" || window.location.hostname === "localhost";
  }, []);

  const hasMediaDevices = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return !!navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function";
  }, []);

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamState("idle");
  };

  const startCamera = async () => {
    setErrMsg(null);

    // ここで “原因をはっきり出す”
    if (!hasMediaDevices) {
      setCamState("err");
      setErrMsg(
        "このブラウザ/接続ではカメラAPIが使えません。対策：① https のURLで開く（Vercel / ngrok / Cloudflare Tunnel）② LINE等の内蔵ブラウザではなくSafariで開く"
      );
      return;
    }
    if (!isSecure) {
      setCamState("err");
      setErrMsg(
        "現在 http で開いているためカメラがブロックされています。https のURLで開いてください（Vercel/ngrok推奨）。"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState("on");
    } catch (e: any) {
      setCamState("err");
      setErrMsg(e?.message ?? "カメラを起動できませんでした（権限/設定を確認）");
    }
  };

  useEffect(() => () => stopCamera(), []);

  const goAnalyze = () => {
    if (!type) {
      alert("カテゴリが取得できていません。マトリクスから選び直してください。");
      router.replace("/matrix");
      return;
    }
    router.push(`/analyze/${type}?movie=live-camera`);
  };

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
        <div className="desc">カテゴリ：{type ? labelOf(type) : "未選択"}</div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8, opacity: 0.9 }}>カメラ</div>

          <div
            style={{
              borderRadius: 18,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: 16,
            }}
          >
            <button type="button" className="cta" onClick={startCamera}>
              カメラを起動（タップ必須）
            </button>

            <div style={{ height: 12 }} />

            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                borderRadius: 16,
                overflow: "hidden",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {camState === "on" && (
              <button
                type="button"
                onClick={stopCamera}
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
                カメラ停止
              </button>
            )}

            {errMsg && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
                ⚠️ {errMsg}
                <div style={{ marginTop: 8, opacity: 0.75 }}>
                  現在のURL: {typeof window !== "undefined" ? window.location.href : ""}
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="button" className="cta" onClick={goAnalyze} style={{ marginTop: 14 }}>
          解析へ進む（デモ）
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