"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string | null): CatNum | null {
  if (!v) return null;
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;
  return null;
}

function typeLabel(type: CatNum) {
  return type === 1 ? "Ⅰ 前伸傾向" : type === 2 ? "Ⅱ 前沈傾向" : type === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";
}

export default function AnalyzeClient() {
  const router = useRouter();
  const params = useParams<{ type?: string }>();
  const sp = useSearchParams();

  const cat = useMemo(() => toCatNum(params?.type ?? null), [params]);
  const movieRaw = sp.get("movie"); // 例: "video:xxxx" or "blob:..." or "https://..."

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let alive = true;

    async function resolve() {
      setErr("");
      setVideoUrl(null);

      if (!movieRaw) {
        setErr("動画が指定されていません。アップロードから入り直してください。");
        return;
      }

      // video:<id> を解決
      if (movieRaw.startsWith("video:")) {
        const id = movieRaw.slice("video:".length);
        const url = await getVideoObjectURL(id);
        if (!alive) return;

        if (!url) {
          setErr("保存した動画が見つかりませんでした。もう一度録画してください。");
          return;
        }
        setVideoUrl(url);
        return;
      }

      // それ以外はそのままURLとして扱う
      setVideoUrl(movieRaw);
    }

    resolve();
    return () => {
      alive = false;
    };
  }, [movieRaw]);

  const title = cat ? `カテゴリ：${typeLabel(cat)}` : "カテゴリ：未選択";

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
              key={videoUrl ?? "none"}
              src={videoUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", height: 260, objectFit: "contain", display: "block" }}
            />
          </div>

          {err && (
            <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>
              ⚠️ {err}
            </div>
          )}
        </div>

        <button type="button" className="cta" onClick={() => router.push("/matrix")} style={{ marginTop: 14 }}>
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}