"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getHistory, clearHistory } from "@/lib/history";

export default function HistoryPage() {
  const router = useRouter();

  const items = useMemo(() => {
    // lib/history.ts 側に getHistory がある想定
    // （なければ、この後すぐ合わせる）
    return getHistory();
  }, []);

  return (
    <main>
      <div className="page">
        <div className="title">履歴</div>

        {items.length === 0 ? (
          <div style={{ opacity: 0.8, marginTop: 10 }}>まだ履歴がありません</div>
        ) : (
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            {items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 6 }}>
                  {it.typeLabel ?? `type: ${it.type}`}
                  <span style={{ opacity: 0.8, marginLeft: 10 }}>score: {it.score}</span>
                </div>

                {it.comment && <div style={{ marginTop: 6, opacity: 0.95 }}>{it.comment}</div>}
                {it.drill && <div style={{ marginTop: 8, opacity: 0.9 }}>次：{it.drill}</div>}

                {it.breakdown && (
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
                    <div>再現性：{it.breakdown.repeat}</div>
                    <div>タイミング：{it.breakdown.timing}</div>
                    <div>軸：{it.breakdown.axis}</div>
                    <div>回転：{it.breakdown.rotate}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          className="cta"
          onClick={() => router.push("/")}
          style={{ marginTop: 14 }}
        >
          トップへ戻る
        </button>

        <button
          type="button"
          onClick={() => {
            clearHistory();
            router.refresh();
          }}
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
          履歴をクリア
        </button>
      </div>
    </main>
  );
}