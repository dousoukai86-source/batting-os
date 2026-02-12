"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function typeLabel(type: CatNum) {
  return type === 1 ? "Ⅰ 前伸傾向" : type === 2 ? "Ⅱ 前沈傾向" : type === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";
}

const LAST_MOVIE_KEY = "batting_os_last_movie"; // Upload側でここに入れる

export default function AnalyzeClient({
  type,
  initialMovie,
}: {
  type: CatNum;
  initialMovie?: string;
}) {
  const router = useRouter();

  const [errMsg, setErrMsg] = useState("");
  const [movieSrc, setMovieSrc] = useState<string>(""); // videoタグのsrc
  const [movieLabel, setMovieLabel] = useState<string>(""); // 表示用

  const title = useMemo(() => `カテゴリ：${typeLabel(type)}`, [type]);

  useEffect(() => {
    let canceled = false;

    async function resolveMovie() {
      setErrMsg("");
      setMovieSrc("");
      setMovieLabel("");

      // 1) URLの movie を優先
      let movie = (initialMovie ?? "").trim();

      // 2) 無ければ「最後に保存した動画」を拾う
      if (!movie) {
        try {
          movie = localStorage.getItem(LAST_MOVIE_KEY) ?? "";
        } catch {}
      }

      if (!movie) {
        setErrMsg("動画が指定されていません。アップロードから入り直してください。");
        return;
      }

      // movie を覚えておく（リロード対策）
      try {
        localStorage.setItem(LAST_MOVIE_KEY, movie);
      } catch {}

      // video:<id> なら IndexedDB からURL化
      if (movie.startsWith("video:")) {
        const id = movie.slice("video:".length);
        const url = await getVideoObjectURL(id);
        if (canceled) return;

        if (!url) {
          setErrMsg("保存済み動画が見つかりません（端末をまたいだ/履歴が消えた可能性）");
          return;
        }

        setMovieSrc(url);
        setMovieLabel(`video:${id}`);
        return;
      }

      // それ以外は通常URLとして扱う
      setMovieSrc(movie);
      setMovieLabel(movie);
    }

    resolveMovie();

    return () => {
      canceled = true;
    };
  }, [initialMovie]);

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
              src={movieSrc || ""}
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

          {movieLabel && (
            <div style={{ marginTop: 10, opacity: 0.85, fontSize: 12, wordBreak: "break-all" }}>
              src: {movieLabel}
            </div>
          )}

          {errMsg && (
            <div style={{ marginTop: 10, opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ {errMsg}
            </div>
          )}
        </div>

        <button
          type="button"
          className="cta"
          onClick={() => router.push("/matrix")}
          style={{ marginTop: 14 }}
        >
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}