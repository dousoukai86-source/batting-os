// src/app/analyze/page.tsx
import Link from "next/link";

export default function AnalyzeRootPage() {
  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">
          解析ページは <b>/analyze/1〜4</b> で開きます。
          <br />
          （例：/analyze/4）
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <Link className="cta" href="/analyze/1">Ⅰ へ</Link>
          <Link className="cta" href="/analyze/2">Ⅱ へ</Link>
          <Link className="cta" href="/analyze/3">Ⅲ へ</Link>
          <Link className="cta" href="/analyze/4">Ⅳ へ</Link>

          <Link
            href="/"
            style={{
              marginTop: 6,
              width: "100%",
              textAlign: "center",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "12px",
              borderRadius: 16,
              fontWeight: 800,
              display: "block",
            }}
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}