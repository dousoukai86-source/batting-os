"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Cat = {
  id: 1 | 2 | 3 | 4;
  label: string;
  colorClass: string;
  title: string;
  sub: string;
};

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<1 | 2 | 3 | 4 | null>(null);

  const cats = useMemo<Cat[]>(
    () => [
      { id: 1, label: "Ⅰ", colorClass: "red", title: "前伸傾向", sub: "ポイントが前に出やすい" },
      { id: 2, label: "Ⅱ", colorClass: "green", title: "前沈傾向", sub: "沈み込みで詰まりやすい" },
      { id: 3, label: "Ⅲ", colorClass: "blue", title: "後伸傾向", sub: "体重移動が弱く伸び上がる" },
      { id: 4, label: "Ⅳ", colorClass: "yellow", title: "後沈傾向", sub: "しまい込みで弾道が乱れやすい" },
    ],
    []
  );

  const goUpload = () => {
    if (!selected) return;
    router.push(`/upload?category=${selected}`);
  };

  return (
    <main>
      <div className="page">
        <div className="title">BATTING OS</div>
        <div className="desc">自分の打撃タイプを選んで、動画をアップして解析します。</div>

        <div className="matrix">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cell ${c.colorClass}`}
              onClick={() => setSelected(c.id)}
              aria-label={`カテゴリ${c.id}`}
              style={{
                outline: selected === c.id ? "3px solid rgba(255,255,255,0.9)" : "none",
                boxShadow: selected === c.id ? "0 0 0 6px rgba(255,255,255,0.15)" : "none",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="list">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`row ${selected === c.id ? "active" : ""}`}
              onClick={() => setSelected(c.id)}
              style={{ textAlign: "left", cursor: "pointer" }}
            >
              <div className="dot" style={{ background: "rgba(255,255,255,0.75)" }} />
              <div className="text">
                <div className="rowTitle">
                  {c.label}：{c.title}
                </div>
                <div className="rowSub">{c.sub}</div>
              </div>
              <div className="arrow">›</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="cta"
          onClick={goUpload}
          disabled={!selected}
          style={{
            opacity: selected ? 1 : 0.5,
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          動画を解析する
        </button>
      </div>
    </main>
  );
}