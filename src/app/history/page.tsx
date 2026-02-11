"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getHistory, clearHistory, type HistoryItem } from "@/lib/history";

function typeLabel(type: 1 | 2 | 3 | 4) {
  return type === 1 ? "Ⅰ 前伸" : type === 2 ? "Ⅱ 前沈" : type === 3 ? "Ⅲ 後伸" : "Ⅳ 後沈";
}

function fmt(n: unknown, digits = 1) {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return n.toFixed(digits);
}

/**
 * breakdown を「拡張キーも含めて」安全に読むための型
 * 既存の posture/weight/impact/repeat/timing は保持しつつ、
 * axis/rotation などが入ってきても表示できる。
 */
type ExtendedBreakdown = {
  posture?: number;
  weight?: number;
  impact?: number;
  repeat?: number;
  timing?: number;

  // 追加で入りがちなキー（必要なら増やせる）
  axis?: number;
  rotation?: number;
  // 他にも入る可能性があるならここに追記 OK
};

function getExtBreakdown(it: HistoryItem): ExtendedBreakdown | null {
  const b = it.breakdown as unknown;
  if (!b || typeof b !== "object") return null;
  return b as ExtendedBreakdown;
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <main>
      <div className="page">
        <div className="title">履歴</div>
        <div className="desc">A（文章）とB（数値）を両方保存しています。</div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <button type="button" className="cta" onClick={() => router.push("/")} style={{ flex: 1 }}>
            トップへ
          </button>

          <button
            type="button"
            onClick={() => {
              clearHistory();
              setItems([]);
            }}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "14px",
              borderRadius: 16,
              fontWeight: 800,
            }}
          >
            履歴を消す
          </button>
        </div>

        {!hasItems && <div style={{ opacity: 0.8 }}>まだ履歴がありません。</div>}

        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => {
            const b = getExtBreakdown(it);

            return (
              <div
                key={it.id}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>
                    {typeLabel(it.type)} / スコア {it.score ?? "-"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {new Date(it.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* A */}
                {it.comment && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>コメント（A）</div>
                    <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{it.comment}</div>
                  </div>
                )}

                {it.drill && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>次の宿題（A）</div>
                    <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{it.drill}</div>
                  </div>
                )}

                {/* ✅ B（差し替え版：見やすく・小数丸め・拡張キー対応） */}
                {b && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>数値（B）</div>

                    <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.9 }}>
                      姿勢：{fmt(b.posture)}
                      <br />
                      体重移動：{fmt(b.weight)}
                      <br />
                      インパクト：{fmt(b.impact)}
                      <br />
                      再現性：{fmt(b.repeat)}
                      <br />
                      タイミング：{fmt(b.timing)}
                      {/* axis / rotation があれば表示（無ければ出さない） */}
                      {typeof b.axis === "number" && (
                        <>
                          <br />
                          軸：{fmt(b.axis)}
                        </>
                      )}
                      {typeof b.rotation === "number" && (
                        <>
                          <br />
                          回転：{fmt(b.rotation)}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 再解析へ（同じタイプで飛ぶ） */}
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const movie = it.src || "live-camera";
                      router.push(`/analyze/${it.type}?movie=${encodeURIComponent(movie)}`);
                    }}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#fff",
                      padding: "10px 12px",
                      borderRadius: 12,
                      fontWeight: 800,
                    }}
                  >
                    この履歴のタイプで解析ページへ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}