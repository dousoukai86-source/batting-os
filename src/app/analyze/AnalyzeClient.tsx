"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function typeLabel(type: CatNum) {
  return type === 1 ? "Ⅰ 前伸傾向" : type === 2 ? "Ⅱ 前沈傾向" : type === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";
}

export default function AnalyzeClient({
  type,
  initialMovie,
}: {
  type: CatNum;
  initialMovie?: string | null;
}) {
  const router = useRouter();

  const [movieKey, setMovieKey] = useState<string | null>(initialMovie ?? null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  // 初回：URL movie が無ければ localStorage から拾う
  useEffect(() => {
    if (movieKey) return;

    try {
      const last = localStorage.getItem("batting_os_last_movie");
      if (last) setMovieKey(last);
    } catch {}
  }, [movieKey]);

  // movieKey を実URLに解決
  useEffect(() => {
    let revoked: string | null = null;

    async function run() {
      setErr("");
      setVideoUrl(null);

      if (!movieKey) return;

      // video:<id> の場合：IndexedDB から objectURL
      if (movieKey.startsWith("video:")) {
        const id = movieKey.slice("video:".length);
        const url = await getVideoObjectURL(id);
        if (!url) {
          setErr("動画が見つかりません。アップロードからやり直してください。");
          return;
        }
        revoked = url;
        setVideoUrl(url);
        return;
      }

      // それ以外はそのままURL扱い（将来拡張）
      setVideoUrl(movieKey);
    }

    run().catch((e: any) => {
      setErr(e?.message ?? "解析ページでエラーが発生しました。");
    });

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [movieKey]);

  const title = useMemo(() => `カテゴリ：${typeLabel(type)}`, [type]);

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">{title}</div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 18,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>対象動画</div>

          <div
            style={{
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#000",
            }}
          >
            <video
              src={videoUrl ?? ""}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                height: 320,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {!videoUrl && (
            <div style={{ marginTop: 12, opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ 動画が指定されていません。アップロードから入り直してください。
            </div>
          )}

          {err && (
            <div style={{ marginTop: 12, opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ {err}
            </div>
          )}
        </div>

        <button
          type="button"
          className="cta"
          style={{ marginTop: 14 }}
          onClick={() => router.push("/matrix")}
        >
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}