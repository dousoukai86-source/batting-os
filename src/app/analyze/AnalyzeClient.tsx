"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addHistory } from "@/lib/history";

/**
 * 目的：
 * - /analyze/1〜4 の type を props から確実に受け取る
 * - type が変でも「アラート出さず」1〜4 に正規化して router.replace
 * - カテゴリ「未選択」を出さない（typeから必ずカテゴリを決める）
 * - デモ実行 → 履歴に保存 → 「履歴を見る」で遷移
 */

function normalizeType(raw: unknown): "1" | "2" | "3" | "4" {
  const s = String(raw ?? "");
  const m = s.match(/[1-4]/); // "1"〜"4" が含まれていれば拾う
  const t = (m?.[0] ?? "1") as "1" | "2" | "3" | "4";
  return t;
}

function typeLabel(type: "1" | "2" | "3" | "4") {
  switch (type) {
    case "1":
      return "I 前伸傾向";
    case "2":
      return "II 前沈傾向";
    case "3":
      return "III 後伸傾向";
    case "4":
      return "IV 後沈傾向";
  }
}

function nowId() {
  return `${Date.now()}`;
}

export default function AnalyzeClient(props: { type?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ type は props から受け取る（これが正）
  const type = useMemo(() => normalizeType(props.type), [props.type]);

  // query
  const movie = searchParams.get("movie") ?? "upload";

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [demoDone, setDemoDone] = useState(false);

  // ✅ props.type が "1"〜"4" じゃない場合でも、黙って正規URLに寄せる
  useEffect(() => {
    const raw = String(props.type ?? "");
    const normalized = normalizeType(raw);

    // raw が空/不正/余計な文字混入なら replace で正規化（アラート出さない）
    if (raw !== normalized) {
      const qs = new URLSearchParams(searchParams.toString());
      router.replace(`/analyze/${normalized}?${qs.toString()}`);
      return;
    }

    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.type]);

  const categoryText = useMemo(() => typeLabel(type), [type]);

  const showVideo = movie !== "live-camera"; // ✅ live-camera のとき video は出さない（撮影画面側でカメラを見せる想定）

  async function runDemo() {
    if (isRunning) return;
    setIsRunning(true);

    // ここで「解析デモ」を生成（いったん固定）
    const result = {
      summary: `デモ解析結果（${categoryText}）`,
      points: [
        "ポイントA：バット軌道の再現性",
        "ポイントB：ステップと体重移動",
        "ポイントC：インパクト時の姿勢",
      ],
      advice: [
        "まずはティーで同じスイングを10本×2セット",
        "体の軸がブレないように鏡 or 自撮りで確認",
      ],
    };

    // ✅ 履歴保存（既存の addHistory を使う）
    addHistory({
      id: nowId(),
      createdAt: Date.now(),
      type,
      movie,
      title: categoryText,
      result,
    });

    setDemoDone(true);
    setIsRunning(false);

    // ✅ “結果へ遷移しない” を解決：ボタンで履歴へ
    alert("解析デモを実行しました");
  }

  if (!isReady) {
    return (
      <main style={{ padding: 16 }}>
        <div style={{ opacity: 0.8 }}>読み込み中...</div>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>解析</div>
        <div style={{ opacity: 0.8, marginTop: 4 }}>
          カテゴリ：{categoryText}
        </div>
      </div>

      <section
        style={{
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 16,
          padding: 14,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>動画</div>

        {showVideo ? (
          <video
            controls
            playsInline
            style={{
              width: "100%",
              borderRadius: 12,
              background: "black",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              display: "grid",
              placeItems: "center",
              opacity: 0.8,
            }}
          >
            カメラは起動しています（デモ解析用）
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={runDemo}
            disabled={isRunning}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 12,
              border: "0",
              fontWeight: 900,
              fontSize: 16,
              background: isRunning ? "rgba(0,120,255,0.45)" : "#2f7cf6",
              color: "#fff",
            }}
          >
            {isRunning ? "解析中..." : "解析を実行（デモ）"}
          </button>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <button
          type="button"
          onClick={() => router.push("/history")}
          style={{
            height: 48,
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          履歴を見る
        </button>

        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            height: 48,
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            fontWeight: 800,
          }}
        >
          トップへ戻る
        </button>
      </div>

      {demoDone && (
        <div style={{ marginTop: 14, opacity: 0.9, fontSize: 13 }}>
          ✅ デモ解析は履歴に保存しました。「履歴を見る」から確認できます。
        </div>
      )}
    </main>
  );
}