"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveVideo } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string | null): CatNum | null {
  if (!v) return null;
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;
  return null;
}

function typeLabel(type: CatNum) {
  return type === 1 ? "Ⅰ 前伸傾向" : type === 2 ? "Ⅱ 前沈傾向" : type === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";
}

function isIPhoneSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryRaw = sp.get("category");
  const category = useMemo(() => toCatNum(categoryRaw), [categoryRaw]);

  const [errMsg, setErrMsg] = useState("");
  const [useBackCam, setUseBackCam] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function setPreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  function openCapture() {
    setErrMsg("");
    setSavedId(null);
    setPreview(null);

    // capture を切り替えるため、毎回作り直す/属性更新してから click
    const el = fileInputRef.current;
    if (!el) return;

    // これ重要：同じファイルを撮り直しても onChange が発火するように
    el.value = "";
    el.click();
  }

  async function onPickedFile(file: File | null) {
    setErrMsg("");
    setSavedId(null);
    setPreview(null);

    if (!file) return;

    try {
      // 1) まず“その場で”プレビュー（ここが最強に安定）
      const url = URL.createObjectURL(file);
      setPreview(url);

      // 2) 保存（IndexedDB / LocalStorage 側）
      const id = await saveVideo(file, file.type || "video/mp4");
      setSavedId(id);
    } catch (e: any) {
      setErrMsg(e?.message ?? "保存に失敗しました。");
    }
  }

  function goAnalyze() {
    if (!category) {
      alert("カテゴリが未選択です。マトリクスから入り直してください。");
      router.push("/matrix");
      return;
    }
    if (!savedId) {
      alert("先に動画を撮影して保存してください。");
      return;
    }
    router.push(`/analyze/${category}?movie=${encodeURIComponent(`video:${savedId}`)}`);
  }

  const title = category ? `カテゴリ：${typeLabel(category)}` : "カテゴリ：未選択";
  const usingCapture = isIPhoneSafari(); // 今回は iPhone Safari を確実に救う

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
        <div className="desc">{title}</div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>カメラ</div>

          {/* iPhone Safari: file capture 方式 */}
          {usingCapture ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                // iPhone: environment=外カメラ, user=内カメラ（Safariが解釈する）
                capture={useBackCam ? "environment" : "user"}
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  onPickedFile(f);
                }}
              />

              <button type="button" className="cta" onClick={openCapture}>
                {useBackCam ? "撮影して保存（外カメラ）" : "撮影して保存（インカメラ）"}
              </button>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setUseBackCam((v) => !v)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.20)",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: 14,
                    fontWeight: 800,
                  }}
                >
                  {useBackCam ? "インカメラに切替" : "外カメラに切替"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrMsg("");
                    setSavedId(null);
                    setPreview(null);
                  }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.20)",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: 14,
                    fontWeight: 800,
                  }}
                >
                  リセット
                </button>
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.9, lineHeight: 1.7 }}>
              ※ iPhone Safari 以外は今は暫定。まず iPhone を確実に動かす方針で capture に寄せてます。
            </div>
          )}

          {errMsg && (
            <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>
              ⚠️ {errMsg}
            </div>
          )}

          <div style={{ marginTop: 14, fontWeight: 900, opacity: 0.95 }}>録画プレビュー</div>

          <div
            style={{
              marginTop: 10,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#000",
            }}
          >
            <video
              src={previewUrl ?? ""}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                height: 220,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {savedId && (
            <div style={{ marginTop: 10, opacity: 0.95 }}>
              ✅ 保存完了（id: {savedId}）
            </div>
          )}
        </div>

        <button
          type="button"
          className="cta"
          onClick={goAnalyze}
          disabled={!savedId}
          style={{ marginTop: 14 }}
        >
          この動画で解析へ進む
        </button>

        <button
          type="button"
          onClick={() => router.push("/matrix")}
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
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}