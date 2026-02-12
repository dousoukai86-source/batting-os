"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function typeLabel(type: CatNum) {
  return type === 1
    ? "Ⅰ 前伸傾向"
    : type === 2
    ? "Ⅱ 前沈傾向"
    : type === 3
    ? "Ⅲ 後伸傾向"
    : "Ⅳ 後沈傾向";
}

const LAST_MOVIE_KEY = "batting_os_last_movie";

export default function AnalyzeClient({ type }: { type: CatNum }) {
  const router = useRouter();
  const sp = useSearchParams();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [errMsg, setErrMsg] = useState<string>("");
  const [movieRaw, setMovieRaw] = useState<string | null>(null);
  const [movieUrl, setMovieUrl] = useState<string | null>(null);

  // ① URLクエリ(movie) を優先、無ければ localStorage から復元
  useEffect(() => {
    try {
      const q = sp.get("movie");
      if (q && q.trim()) {
        setMovieRaw(q);
        // ここで「最後」を更新しておくと導線が安定する
        localStorage.setItem(LAST_MOVIE_KEY, q);
        return;
      }

      const last = localStorage.getItem(LAST_MOVIE_KEY);
      if (last && last.trim()) {
        setMovieRaw(last);
        return;
      }

      setMovieRaw(null);
    } catch (e) {
      setMovieRaw(null);
    }
  }, [sp]);

  // ② movieRaw を 실제再生URLに解決
  useEffect(() => {
    let revokedUrl: string | null = null;

    (async () => {
      setErrMsg("");
      setMovieUrl(null);

      if (!movieRaw) return;

      // video:<id> 形式（IndexedDB）
      if (movieRaw.startsWith("video:")) {
        const id = movieRaw.slice("video:".length);
        if (!id) {
          setErrMsg("動画IDが空です。アップロードから入り直してください。");
          return;
        }

        try {
          const url = await getVideoObjectURL(id);
          if (!url) {
            setErrMsg("保存済み動画が見つかりません。アップロードから入り直してください。");
            return;
          }
          revokedUrl = url;
          setMovieUrl(url);
          return;
        } catch (e: any) {
          setErrMsg(e?.message ?? "動画の読み込みに失敗しました。");
          return;
        }
      }

      // それ以外は「通常URL」として扱う
      setMovieUrl(movieRaw);
    })();

    // クリーンアップ：objectURL を revoke
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [movieRaw]);

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
              ref={videoRef}
              src={movieUrl ?? ""}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                height: 360,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {!movieRaw && (
            <div style={{ marginTop: 12, opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ 動画が指定されていません。アップロードから入り直してください。
            </div>
          )}

          {errMsg && (
            <div style={{ marginTop: 12, opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ {errMsg}
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