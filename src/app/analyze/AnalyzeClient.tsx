"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function typeLabel(type: CatNum) {
  return type === 1 ? "Ⅰ 前伸傾向" : type === 2 ? "Ⅱ 前沈傾向" : type === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";
}

type MovieState =
  | { kind: "live" }
  | { kind: "video"; id: string; url: string }
  | { kind: "loading"; msg: string }
  | { kind: "error"; msg: string };

function parseMovieParam(raw: string | null) {
  if (!raw) return { kind: "live" as const };
  if (raw === "live-camera") return { kind: "live" as const };

  // movie=video:<id>
  if (raw.startsWith("video:")) {
    const id = raw.slice("video:".length).trim();
    if (id) return { kind: "video" as const, id };
  }

  return { kind: "live" as const };
}

export default function AnalyzeClient({ type }: { type: CatNum }) {
  const router = useRouter();
  const sp = useSearchParams();

  const movieParam = sp.get("movie");
  const parsed = useMemo(() => parseMovieParam(movieParam), [movieParam]);

  const [movieState, setMovieState] = useState<MovieState>({ kind: "loading", msg: "読み込み中..." });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (parsed.kind === "live") {
        setMovieState({ kind: "live" });
        return;
      }

      // video
      setMovieState({ kind: "loading", msg: "保存動画を読み込み中..." });
      const url = await getVideoObjectURL(parsed.id);

      if (cancelled) return;

      if (!url) {
        setMovieState({ kind: "error", msg: "動画が見つかりません（保存が失敗した可能性）" });
        return;
      }

      setMovieState({ kind: "video", id: parsed.id, url });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [parsed.kind, (parsed as any).id]);

  const title = `カテゴリ：${typeLabel(type)}`;

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
          <div style={{ fontWeight: 900, marginBottom: 10 }}>動画</div>

          {movieState.kind === "live" && (
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.35)",
                height: 220,
                display: "grid",
                placeItems: "center",
                opacity: 0.9,
              }}
            >
              カメラは起動しています（デモ解析用）
            </div>
          )}

          {movieState.kind === "loading" && (
            <div style={{ opacity: 0.9, lineHeight: 1.6 }}>
              {movieState.msg}
            </div>
          )}

          {movieState.kind === "error" && (
            <div style={{ opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ {movieState.msg}
            </div>
          )}

          {movieState.kind === "video" && (
            <>
              <div
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#000",
                }}
              >
                <video
                  src={movieState.url}
                  controls
                  playsInline
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
                movie: video:{movieState.id}
              </div>
            </>
          )}
        </div>

        {/* ここは“デモ解析”のまま置いておく（本実装に合わせて差し替えOK） */}
        <button type="button" className="cta" style={{ marginTop: 14 }} onClick={() => router.push("/history")}>
          解析を実行（デモ）
        </button>

        <button
          type="button"
          onClick={() => router.push("/matrix")}
          style={{
            width: "100%",
            marginTop: 10,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff",
            padding: "14px",
            borderRadius: 16,
            fontWeight: 800,
          }}
        >
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}