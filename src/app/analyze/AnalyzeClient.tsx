"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function typeLabel(type: CatNum) {
  return type === 1 ? "Ⅰ 前伸傾向" : type === 2 ? "Ⅱ 前沈傾向" : type === 3 ? "Ⅲ 後伸傾向" : "Ⅳ 後沈傾向";
}

// movie 形式:
// 1) 直URL (http/https)
// 2) video:<id>  ← Uploadから渡すやつ
function resolveMovieSource(movie: string) {
  const m = (movie ?? "").trim();
  if (!m) return { kind: "none" as const };

  if (m.startsWith("video:")) {
    const id = m.slice("video:".length);
    return { kind: "videoId" as const, id };
  }

  // URLっぽいのはそのまま
  if (m.startsWith("http://") || m.startsWith("https://")) {
    return { kind: "url" as const, url: m };
  }

  return { kind: "none" as const };
}

export default function AnalyzeClient({ type, movie }: { type: CatNum; movie: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string>("");
  const [src, setSrc] = useState<string>(""); // <video src>
  const [loading, setLoading] = useState(false);

  const resolved = useMemo(() => resolveMovieSource(movie), [movie]);

  // ★重要：indexedDB/URL.createObjectURL 系はクライアントでしか動かさない
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr("");
      setSrc("");

      if (resolved.kind === "none") {
        setErr("動画が指定されていません。アップロードから入り直してください。");
        return;
      }

      if (resolved.kind === "url") {
        setSrc(resolved.url);
        return;
      }

      if (resolved.kind === "videoId") {
        setLoading(true);
        try {
          const url = await getVideoObjectURL(resolved.id);
          if (cancelled) return;

          if (!url) {
            setErr("保存した動画が見つかりません。アップロードから撮り直してください。");
            setLoading(false);
            return;
          }

          setSrc(url);
          setLoading(false);
        } catch (e: any) {
          if (cancelled) return;
          setErr(e?.message ?? "動画の読み込みに失敗しました。");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [resolved]);

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">カテゴリ：{typeLabel(type)}</div>

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
              src={src}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                height: 260,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {loading && <div style={{ marginTop: 10, opacity: 0.9 }}>読み込み中...</div>}
          {err && <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>⚠️ {err}</div>}
        </div>

        <button type="button" className="cta" style={{ marginTop: 14 }} onClick={() => router.push("/matrix")}>
          マトリクスへ戻る
        </button>
      </div>
    </main>
  );
}