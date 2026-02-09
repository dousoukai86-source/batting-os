"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* =========================
   type 正規化（I → 1）
========================= */
const normalizeType = (raw: string) => {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "I") return "1";
  if (s === "II") return "2";
  if (s === "III") return "3";
  if (s === "IV") return "4";
  return s;
};

/* =========================
   表示用テキスト
========================= */
const typeLabel = (t: string) => {
  switch (t) {
    case "1":
      return "I 前伸傾向";
    case "2":
      return "II 前沈傾向";
    case "3":
      return "III 後伸傾向";
    case "4":
      return "IV 後沈傾向";
    default:
      return "未選択";
  }
};

type Props = {
  type: string;
};

export default function AnalyzeClient({ type }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* =========================
     正規化された type
  ========================= */
  const t = useMemo(() => normalizeType(type), [type]);
  const validType = useMemo(() => ["1", "2", "3", "4"].includes(t), [t]);
  const label = useMemo(() => typeLabel(t), [t]);

  const movie = searchParams.get("movie");
  const isLiveCamera = movie === "live-camera";

  /* =========================
     UI state
  ========================= */
  const [showError, setShowError] = useState(false);

  /* =========================
     不正 type のときだけ警告
  ========================= */
  useEffect(() => {
    if (!validType) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [validType]);

  /* =========================
     描画
  ========================= */
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0f",
        color: "#fff",
        padding: 16,
      }}
    >
      <h1 style={{ fontSize: 18, marginBottom: 8 }}>解析</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        カテゴリ：{label}
      </p>

      {/* 動画 or カメラ */}
      <div
        style={{
          borderRadius: 16,
          background: "#111",
          padding: 12,
          marginBottom: 16,
        }}
      >
        <p style={{ marginBottom: 8 }}>動画</p>

        {isLiveCamera ? (
          <div
            style={{
              height: 200,
              borderRadius: 12,
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
            }}
          >
            カメラは起動しています（デモ解析用）
          </div>
        ) : (
          <div
            style={{
              height: 200,
              borderRadius: 12,
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
            }}
          >
            動画がありません
          </div>
        )}
      </div>

      {/* 解析ボタン */}
      <button
        onClick={() => alert("解析デモを実行しました")}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 12,
          background: "#3b82f6",
          color: "#fff",
          fontWeight: 700,
          border: "none",
          marginBottom: 12,
        }}
      >
        解析を実行（デモ）
      </button>

      {/* 下部ボタン */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push("/")}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          トップへ戻る
        </button>
      </div>

      {/* エラーダイアログ */}
      {showError && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#1a1a1f",
              borderRadius: 16,
              padding: 20,
              width: "85%",
            }}
          >
            <p style={{ marginBottom: 16 }}>
              type が不正！<br />
              /analyze/1〜4 の形か確認して
            </p>
            <button
              onClick={() => setShowError(false)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                fontWeight: 700,
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </main>
  );
}