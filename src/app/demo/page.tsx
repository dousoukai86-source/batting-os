"use client";

import Link from "next/link";

const CARD = [
  { id: 1, title: "Ⅰ 前伸傾向", key: "I",  upload: "/upload?category=1", analyze: "/analyze/1?movie=live-camera" },
  { id: 2, title: "Ⅱ 前沈傾向", key: "II", upload: "/upload?category=2", analyze: "/analyze/2?movie=live-camera" },
  { id: 3, title: "Ⅲ 後伸傾向", key: "III", upload: "/upload?category=3", analyze: "/analyze/3?movie=live-camera" },
  { id: 4, title: "Ⅳ 後沈傾向", key: "IV", upload: "/upload?category=4", analyze: "/analyze/4?movie=live-camera" },
];

export default function Home() {
  return (
    <main>
      <div className="page">
        <div className="title">トップ</div>
        <div className="desc">デモ導線（カテゴリ選択 → アップロード/解析）</div>

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {CARD.map((c) => (
            <div key={c.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontWeight: 950, fontSize: 18 }}>{c.title}</div>
                <div className="small">{c.key}</div>
              </div>

              <div className="hr" />

              <div style={{ display: "grid", gap: 10 }}>
                <Link className="btn link" href={c.upload}>
                  アップロードへ
                </Link>

                <Link className="cta link" href={c.analyze}>
                  解析へ直行（デモ）
                </Link>
              </div>
            </div>
          ))}

          <div className="card">
            <div style={{ fontWeight: 950, fontSize: 18 }}>履歴</div>
            <div className="desc" style={{ marginTop: 6 }}>
              直近の解析結果（A文章 + B数値）を確認
            </div>

            <div style={{ marginTop: 12 }}>
              <Link className="btn link" href="/history">
                履歴を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}