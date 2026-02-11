"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeLoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [pass, setPass] = useState("");

  const canLogin = useMemo(() => userId.trim() && pass.trim(), [userId, pass]);

  const onLogin = () => {
    // ✅ ログイン成功後 → マトリックスへ
    router.push("/matrix");
  };

  return (
    <main>
      <div className="page">
        <div style={{ display: "grid", placeItems: "center", marginTop: 10 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
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

        <div className="title" style={{ marginTop: 10 }}>
          BSOホームワーク
        </div>
        <div className="desc" style={{ opacity: 0.85 }}>
          ログインして、あなたのタイプを選びます
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 22,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ fontWeight: 950, marginBottom: 10 }}>ログイン</div>

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
            style={{ marginTop: 14, width: "100%", opacity: canLogin ? 1 : 0.5 }}
          >
            ログイン →
          </button>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
            ※デモ：入力があればログイン成功扱い
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