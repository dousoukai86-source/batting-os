"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CatId = 1 | 2 | 3 | 4;

type Cat = {
  id: CatId;
  roman: "I" | "II" | "III" | "IV";
  title: string; // 1行
  sub: string;   // 1行（長ければ…）
  chipBg: string;
  chipBd: string;
};

export default function SelectPage() {
  const router = useRouter();

  const cats: Cat[] = useMemo(
    () => [
      {
        id: 1,
        roman: "I",
        title: "前伸傾向",
        sub: "前傾×伸び上がり",
        chipBg: "rgba(255, 80, 80, 0.22)",
        chipBd: "rgba(255, 80, 80, 0.85)",
      },
      {
        id: 2,
        roman: "II",
        title: "前沈傾向",
        sub: "前傾×沈み込み",
        chipBg: "rgba(70, 160, 255, 0.22)",
        chipBd: "rgba(70, 160, 255, 0.85)",
      },
      {
        id: 3,
        roman: "III",
        title: "後伸傾向",
        sub: "後傾×伸び上がり",
        chipBg: "rgba(50, 220, 140, 0.22)",
        chipBd: "rgba(50, 220, 140, 0.85)",
      },
      {
        id: 4,
        roman: "IV",
        title: "後沈傾向",
        sub: "後傾×沈み込み",
        chipBg: "rgba(255, 200, 60, 0.22)",
        chipBd: "rgba(255, 200, 60, 0.90)",
      },
    ],
    []
  );

  const [selected, setSelected] = useState<CatId>(1);

  // ログイン入力（今はダミーでOK）
  const [userId, setUserId] = useState("");
  const [pass, setPass] = useState("");

  const canLogin = selected && userId.trim().length > 0 && pass.trim().length > 0;

  const onLogin = () => {
    // ✅ ここが本命：ログイン成功後に /upload?category=
    router.push(`/upload?category=${selected}`);
  };

  return (
    <main>
      <div className="page">
        {/* ロゴ（仮） */}
        <div
          style={{
            display: "grid",
            placeItems: "center",
            marginTop: 6,
            marginBottom: 8,
          }}
        >
          <div
            aria-label="BSO"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background:
                "linear-gradient(180deg, rgba(90,160,255,0.35), rgba(255,255,255,0.08))",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
              fontWeight: 950,
              letterSpacing: 1,
            }}
          >
            BSO
          </div>
        </div>

        {/* タイトル */}
        <div className="title" style={{ marginTop: 2 }}>
          BSOホームワーク
        </div>
        <div className="desc" style={{ opacity: 0.85 }}>
          カテゴリを選んでログイン（成功後にアップロードへ）
        </div>

        {/* 外枠（パキッ） */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 22,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          }}
        >
          {/* 見出し */}
          <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 10 }}>
            打撃マトリックス
          </div>
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 12 }}>
            今の自分に近いカテゴリを1つ選んでね（あとで変えてOK）
          </div>

          {/* 2x2 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {cats.map((c) => {
              const isOn = selected === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c.id)}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 18,

                    // ✅ 背景を少し明るく＋グラデで“面”を出す
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",

                    // ✅ 枠を強める（選択中は太く）
                    border: isOn
                      ? `2px solid ${c.chipBd}`
                      : "1px solid rgba(255,255,255,0.16)",

                    // ✅ 影で“パキッ”と立たせる
                    boxShadow: isOn
                      ? "0 10px 24px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,255,255,0.06) inset"
                      : "0 10px 22px rgba(0,0,0,0.38)",

                    // ✅ タップ感
                    transform: isOn ? "translateY(-1px)" : "translateY(0)",
                    transition: "transform 120ms ease, box-shadow 120ms ease",

                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {/* 上段：バッジとローマ */}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: c.chipBg,
                        border: `1px solid ${c.chipBd}`,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 950,
                      }}
                    >
                      {c.roman}
                    </div>

                    <div style={{ opacity: 0.55, fontWeight: 900 }}>
                      {c.roman}
                    </div>
                  </div>

                  <div style={{ height: 10 }} />

                  {/* タイトル（1行固定） */}
                  <div
                    style={{
                      fontWeight: 950,
                      fontSize: 16,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.title}
                  </div>

                  {/* サブ（1行固定） */}
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      opacity: 0.78,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 選択中表示 */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              opacity: 0.9,
              fontWeight: 850,
            }}
          >
            <div>選択中：{selected}</div>
            <div style={{ opacity: 0.75, fontSize: 12 }}>
              （I〜IV → 1〜4）
            </div>
          </div>

          {/* ログインフォーム */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>ログイン</div>

            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="ユーザーID"
              style={inputStyle()}
              autoCapitalize="none"
              autoCorrect="off"
            />

            <div style={{ height: 10 }} />

            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="パスワード"
              type="password"
              style={inputStyle()}
            />

            <button
              type="button"
              className="cta"
              onClick={onLogin}
              disabled={!canLogin}
              style={{
                marginTop: 14,
                width: "100%",
                opacity: canLogin ? 1 : 0.5,
              }}
            >
              このカテゴリでログイン →
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
              ※ いまはデモ：入力があればログイン成功扱いで <b>/upload?category={selected}</b> に遷移します
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff",
    outline: "none",
    fontWeight: 800,
  };
}