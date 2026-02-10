// src/app/upload/UploadClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CatId = 1 | 2 | 3 | 4;

function toCatId(v: string | null): CatId | null {
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return null;
}

const TITLE: Record<CatId, string> = {
  1: "Ⅰ 前伸傾向",
  2: "Ⅱ 前沈傾向",
  3: "Ⅲ 後伸傾向",
  4: "Ⅳ 後沈傾向",
};

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // Home -> /upload?category=1 の受け口
  const categoryFromQuery = useMemo(() => toCatId(sp.get("category")), [sp]);
  const [category, setCategory] = useState<CatId | null>(categoryFromQuery);

  // デモ用：カメラやアップロード処理は一旦外して、遷移だけ確実にする
  useEffect(() => {
    if (categoryFromQuery) setCategory(categoryFromQuery);
  }, [categoryFromQuery]);

  const title = category ? TITLE[category] : "未選択";

  const goAnalyze = () => {
    if (!category) {
      alert("カテゴリが選択されていません");
      return;
    }
    // ✅ 最重要：404回避のため必ずこの形で飛ばす
    router.push(`/analyze/${category}`);
  };

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
        <div className="desc">カテゴリ：{title}</div>

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button
            type="button"
            className="cta"
            onClick={goAnalyze}
            style={{ width: "100%" }}
          >
            解析へ進む（デモ）
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: "12px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            トップへ戻る
          </button>
        </div>

        {!category && (
          <div style={{ marginTop: 14, opacity: 0.8, fontSize: 13 }}>
            先にトップで Ⅰ〜Ⅳ を選んでから来てね。
          </div>
        )}
      </div>
    </main>
  );
}