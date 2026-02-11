"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CatId = 1 | 2 | 3 | 4;

type Cell = {
  id: CatId;
  roman: "Ⅰ" | "Ⅱ" | "Ⅲ" | "Ⅳ";
  title: string;     // 1行
  sub: string;       // 1行
  accent: string;    // 枠/ドット色
};

export default function MatrixPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<CatId | null>(null);

  const cells = useMemo<Cell[]>(
    () => [
      // 左上 = 1
      { id: 1, roman: "Ⅰ", title: "前伸傾向", sub: "ポイントが前に出やすい", accent: "#FF5A5A" },
      // 左下 = 2
      { id: 2, roman: "Ⅱ", title: "前沈傾向", sub: "沈み込みで詰まりやすい", accent: "#4DA3FF" },
      // 右上 = 3
      { id: 3, roman: "Ⅲ", title: "後伸傾向", sub: "伸び上がりで力が抜ける", accent: "#37D67A" },
      // 右下 = 4
      { id: 4, roman: "Ⅳ", title: "後沈傾向", sub: "しまい込みで弾道が乱れる", accent: "#F7C948" },
    ],
    []
  );

  const goNext = () => {
    if (!selected) return;
    router.push(`/upload?category=${selected}`);
  };

  // 表示順を「左上=1 / 右上=3 / 左下=2 / 右下=4」に固定
  const grid = useMemo(() => {
    const byId = new Map(cells.map((c) => [c.id, c]));
    return [byId.get(1)!, byId.get(3)!, byId.get(2)!, byId.get(4)!];
  }, [cells]);

  return (
    <main>
      <div className="page" style={{ paddingBottom: 92 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div className="title">打撃マトリクス</div>
          <div className="desc" style={{ marginBottom: 4 }}>
            いまの自分に近いタイプを1つ選んでね
          </div>
        </div>

        {/* ===== 軸ラベル ===== */}
        <div
          style={{
            position: "relative",
            marginTop: 14,
          }}
        >
          {/* 上：前傾 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: -20,
              textAlign: "center",
              fontSize: 12,
              opacity: 0.7,
              letterSpacing: 0.2,
              fontWeight: 800,
            }}
          >
            前傾
          </div>

          {/* 下：後傾 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -20,
              textAlign: "center",
              fontSize: 12,
              opacity: 0.7,
              letterSpacing: 0.2,
              fontWeight: 800,
            }}
          >
            後傾
          </div>

          {/* 左：伸び */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: -28,
              transform: "translateY(-50%) rotate(-90deg)",
              transformOrigin: "center",
              fontSize: 12,
              opacity: 0.7,
              letterSpacing: 0.2,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            伸び
          </div>

          {/* 右：沈み */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: -28,
              transform: "translateY(-50%) rotate(90deg)",
              transformOrigin: "center",
              fontSize: 12,
              opacity: 0.7,
              letterSpacing: 0.2,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            沈み
          </div>

          {/* ===== 2x2 本体（パキッ） ===== */}
          <div
            style={{
              borderRadius: 22,
              padding: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 14px 40px rgba(0,0,0,0.40)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {grid.map((c) => {
                const active = selected === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelected(c.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 18,
                      padding: 14,
                      background: active
                        ? "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.35))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.28))",
                      border: active
                        ? `2px solid ${c.accent}`
                        : "1px solid rgba(255,255,255,0.12)",
                      boxShadow: active
                        ? `0 0 0 4px ${c.accent}22`
                        : "0 10px 26px rgba(0,0,0,0.30)",
                      transition: "all .15s ease",
                      color: "#fff",
                      position: "relative",
                      minHeight: 118,
                    }}
                    aria-label={`${c.roman} ${c.title}`}
                  >
                    {/* Ⅰ〜Ⅳ：四隅に小さく固定 */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: `1px solid rgba(255,255,255,0.28)`,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        fontSize: 13,
                        lineHeight: 1,
                        background: "rgba(0,0,0,0.20)",
                      }}
                    >
                      {c.roman}
                    </div>

                    {/* アクセントドット（右上） */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: c.accent,
                        boxShadow: `0 0 0 3px ${c.accent}22`,
                      }}
                    />

                    {/* 文字：1行ずつ */}
                    <div style={{ marginTop: 22, display: "grid", gap: 6 }}>
                      <div
                        style={{
                          fontWeight: 950,
                          fontSize: 18,
                          letterSpacing: 0.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.title}
                      </div>

                      <div
                        style={{
                          fontSize: 12.5,
                          opacity: 0.75,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.sub}
                      </div>
                    </div>

                    {/* 選択中バッジ */}
                    {active && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 900,
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.18)",
                        }}
                      >
                        選択中
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== 下固定CTA（プロっぽい） ===== */}
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "12px 14px",
            background: "linear-gradient(180deg, rgba(11,14,19,0.0), rgba(11,14,19,0.95) 55%)",
            backdropFilter: "blur(6px)",
          }}
        >
          <button
            type="button"
            className="cta"
            onClick={goNext}
            disabled={!selected}
            style={{
              width: "100%",
              opacity: selected ? 1 : 0.5,
              cursor: selected ? "pointer" : "not-allowed",
            }}
          >
            {selected ? "このタイプで動画へ →" : "タイプを選択してね"}
          </button>
        </div>
      </div>
    </main>
  );
}