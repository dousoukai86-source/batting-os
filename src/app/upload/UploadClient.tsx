"use client";

// src/app/upload/UploadClient.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveVideoBlob } from "@/lib/videoStore";

type CatId = 1 | 2 | 3 | 4;

const labelOf = (t: CatId) =>
  t === 1 ? "Ⅰ 前伸傾向" : t === 2 ? "Ⅱ 前沈傾向" : t === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";

/** 何が来ても 1〜4 に寄せる（"1" / "IV" / "Ⅳ" など） */
const toCatId = (v: string | null | undefined): CatId | null => {
  if (!v) return null;
  const s = v.trim().toUpperCase();

  if (s === "1") return 1;
  if (s === "2") return 2;
  if (s === "3") return 3;
  if (s === "4") return 4;

  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  if (s === "Ⅰ") return 1;
  if (s === "Ⅱ") return 2;
  if (s === "Ⅲ") return 3;
  if (s === "Ⅳ") return 4;

  return null;
};

function isSecureContextForCamera() {
  if (typeof window === "undefined") return false;
  // https か localhost 系のみ基本OK
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".local");
  return window.isSecureContext || isLocal;
}

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const type = useMemo<CatId | null>(() => toCatId(sp.get("category")), [sp]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [camState, setCamState] = useState<"idle" | "on" | "err">("idle");
  const [recState, setRecState] = useState<"idle" | "rec" | "saving">("idle");

  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const cleanupPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const stopCamera = () => {
    try {
      recorderRef.current?.stop?.();
    } catch {}
    recorderRef.current = null;

    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
    setCamState("idle");
  };

  const startCamera = async () => {
    setErrMsg(null);

    if (!isSecureContextForCamera()) {
      setCamState("err");
      setErrMsg(
        `このURLではカメラAPIが使えません。httpsで開いてください。\n現在のURL: ${typeof window !== "undefined" ? location.href : ""}`
      );
      return;
    }

    try {
      // 外カメラ優先（iPhone）
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true, // 動画として保存したいなら true 推奨（音なしなら false に）
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // 録画中のハウリング回避
        await videoRef.current.play().catch(() => {});
      }

      setCamState("on");
    } catch (e: any) {
      setCamState("err");
      setErrMsg(e?.message ?? "カメラを起動できませんでした");
    }
  };

  const startRec = () => {
    setErrMsg(null);

    if (!streamRef.current) {
      setErrMsg("先にカメラを起動してください。");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setErrMsg("このブラウザは録画(MediaRecorder)に未対応です。iPhoneはSafariで開いてください。");
      return;
    }

    try {
      cleanupPreview();
      setSavedId(null);

      chunksRef.current = [];

      // iOS Safari は mimeType 指定でコケる事があるので、まずは指定なしが安全
      const mr = new MediaRecorder(streamRef.current);
      recorderRef.current = mr;

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        try {
          setRecState("saving");
          const blob = new Blob(chunksRef.current, { type: "video/webm" }); // 実際のtypeはブラウザ依存
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);

          // IndexedDB に保存
          const id = await saveVideoBlob(blob);
          setSavedId(id);

          setRecState("idle");
        } catch (e: any) {
          setRecState("idle");
          setErrMsg(e?.message ?? "保存に失敗しました");
        }
      };

      mr.start();
      setRecState("rec");
    } catch (e: any) {
      setErrMsg(e?.message ?? "録画を開始できませんでした");
    }
  };

  const stopRec = () => {
    try {
      recorderRef.current?.stop();
    } catch {}
    recorderRef.current = null;
    setRecState("idle");
  };

  // 解析へ進む（保存済みIDを渡す）
  const goAnalyze = () => {
    if (!type) {
      alert("カテゴリが取得できていません。マトリクスから選び直してください。");
      router.replace("/matrix");
      return;
    }
    if (!savedId) {
      alert("まだ動画が保存できていません。録画→停止してから進んでください。");
      return;
    }

    router.push(`/analyze/${type}?movie=${encodeURIComponent(`idb:${savedId}`)}`);
  };

  // ページ離脱で停止 + preview解放
  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop?.();
      } catch {}
      stopCamera();
      cleanupPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <button type="button" className="cta" onClick={startCamera} disabled={camState === "on"}>
              カメラを起動（外カメラ）
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

            <div style={{ height: 12 }} />

            {/* 録画ボタン */}
            <div style={{ display: "flex", gap: 10 }}>
              {recState !== "rec" ? (
                <button
                  type="button"
                  className="cta"
                  onClick={startRec}
                  style={{ flex: 1 }}
                  disabled={camState !== "on" || recState === "saving"}
                >
                  録画開始
                </button>
              ) : (
                <button type="button" className="cta" onClick={stopRec} style={{ flex: 1 }}>
                  録画停止
                </button>
              )}

              <button
                type="button"
                onClick={stopCamera}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  padding: "12px",
                  borderRadius: 16,
                  fontWeight: 800,
                }}
                disabled={camState !== "on"}
              >
                カメラ停止
              </button>
            </div>

            {recState === "saving" && <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>保存中...</div>}

            {errMsg && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, whiteSpace: "pre-wrap" }}>
                ⚠️ {errMsg}
              </div>
            )}

            {/* プレビュー */}
            {previewUrl && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 8, opacity: 0.9 }}>録画プレビュー</div>
                <video
                  controls
                  playsInline
                  src={previewUrl}
                  style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}
                />
                {savedId && (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                    ✅ 保存完了（id: {savedId}）
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <button type="button" className="cta" onClick={goAnalyze} style={{ marginTop: 14 }} disabled={!savedId}>
          この動画で解析へ進む
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