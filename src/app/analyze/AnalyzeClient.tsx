"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { categoryMap } from "@/lib/category";

type Props = {
  type: string;
};

export default function AnalyzeClient({ type }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const movie = searchParams.get("movie");

  // ✅ type を強制正規化（ここが肝）
  const normalizedType = useMemo(() => {
    if (!type) return null;
    const t = String(type).trim();
    return ["1", "2", "3", "4"].includes(t) ? t : null;
  }, [type]);

  const categoryLabel = normalizedType
    ? categoryMap[normalizedType]
    : "未選択";

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedType) {
      setMessage("type が不正！");
    } else {
      setMessage(null);
    }
  }, [normalizedType]);

  return (
    <main className="page">
      <h1>解析</h1>
      <p>カテゴリ：{categoryLabel}</p>

      <section className="card">
        <h2>動画</h2>

        {movie === "live-camera" ? (
          <div className="video-placeholder">
            カメラは起動しています（デモ解析用）
          </div>
        ) : (
          <video controls />
        )}
      </section>

      <button
        className="primary"
        onClick={() => setMessage("解析デモを実行しました")}
      >
        解析を実行（デモ）
      </button>

      {message && (
        <div className="modal">
          <p>{message}</p>
          <button onClick={() => setMessage(null)}>閉じる</button>
        </div>
      )}

      <button
        className="secondary"
        onClick={() => router.push("/")}
      >
        トップへ戻る
      </button>
    </main>
  );
}