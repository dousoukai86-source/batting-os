"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";
import AngleChart from "@/components/AngleChart";

// MediaPipe Tasks Vision
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

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

const LS_LAST_VIDEO_ID = "batting_os:lastVideoId";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function vec(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: b.x - a.x, y: b.y - a.y };
}
function dot(u: { x: number; y: number }, v: { x: number; y: number }) {
  return u.x * u.x + u.y * v.y; // ←ミスると終わるので注意
}
function norm(u: { x: number; y: number }) {
  return Math.sqrt(u.x * u.x + u.y * u.y);
}

// 角度（A-B-Cの∠ABC、度数）
function angleABC(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const u = vec(b, a);
  const v = vec(b, c);
  const nu = norm(u);
  const nv = norm(v);
  if (nu === 0 || nv === 0) return NaN;
  const cos = clamp((u.x * v.x + u.y * v.y) / (nu * nv), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

// 体幹の前傾（肩中点→股関節中点のベクトルと“鉛直”のなす角）
function trunkLeanDeg(shoulderMid: { x: number; y: number }, hipMid: { x: number; y: number }) {
  const v = vec(hipMid, shoulderMid); // hip -> shoulder
  const nv = norm(v);
  if (nv === 0) return NaN;
  const cos = clamp((v.x * 0 + v.y * -1) / nv, -1, 1); // 鉛直上(0,-1)
  return (Math.acos(cos) * 180) / Math.PI;
}

type FrameMetrics = {
  t: number;
  trunkLeanDeg: number;
  hipAngleDeg: number;
  kneeAngleDeg: number;
  visScore: number;
};

type AvgMetrics = {
  trunkLeanDeg: number;
  hipAngleDeg: number;
  kneeAngleDeg: number;
  visScore: number;
};

type AnalysisResult = {
  frames: number;
  usedFrames: number;

  avg: AvgMetrics;
  peak: FrameMetrics;

  // グラフ用（時系列）
  series: {
    trunk: number[];
    hip: number[];
    knee: number[];
    t: number[];
  };

  message: string;
};

export default function AnalyzeClient({ type }: { type: CatNum }) {
  const router = useRouter();
  const sp = useSearchParams();

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const peakRef = useRef<HTMLDivElement | null>(null);

  const [movieUrl, setMovieUrl] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [status, setStatus] = useState<"idle" | "loading_video" | "ready" | "analyzing" | "done">("idle");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const movieParam = useMemo(() => sp.get("movie"), [sp]);

  useEffect(() => {
    let canceled = false;

    async function resolveMovie() {
      setErrMsg("");
      setResult(null);
      setProgress(null);
      setStatus("loading_video");

      let m = movieParam;

      if (!m && typeof window !== "undefined") {
        const last = localStorage.getItem(LS_LAST_VIDEO_ID);
        if (last) m = `video:${last}`;
      }

      if (!m) {
        setStatus("idle");
        setErrMsg("動画が指定されていません。アップロードから入り直してください。");
        setMovieUrl(null);
        return;
      }

      try {
        if (m.startsWith("video:")) {
          const id = m.slice("video:".length);
          const url = await getVideoObjectURL(id);
          if (!url) throw new Error("保存動画が見つかりません（IndexedDB）。録画し直してください。");
          if (!canceled) setMovieUrl(url);
        } else {
          if (!canceled) setMovieUrl(m);
        }

        if (!canceled) setStatus("ready");
      } catch (e: any) {
        if (!canceled) {
          setStatus("idle");
          setMovieUrl(null);
          setErrMsg(e?.message ?? "動画の読み込みに失敗しました。");
        }
      }
    }

    resolveMovie();
    return () => {
      canceled = true;
    };
  }, [movieParam]);

  function goBack() {
    router.push("/matrix");
  }

  // ✅ 最大前傾へジャンプ（スクロール + 動画シーク）
  function jumpToPeak() {
    peakRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const video = videoElRef.current;
    const t = result?.peak?.t;
    if (video && typeof t === "number" && isFinite(t)) {
      try {
        video.currentTime = Math.max(0, t - 0.1);
        video.pause();
      } catch {}
    }
  }

  async function runAnalysis() {
    setErrMsg("");
    setResult(null);
    setProgress(null);

    const video = videoElRef.current;
    const canvas = canvasRef.current;

    if (!movieUrl || !video || !canvas) {
      setErrMsg("動画が準備できていません。");
      return;
    }

    setStatus("analyzing");

    try {
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => resolve();
        const onErr = () => reject(new Error("動画の読み込みに失敗しました。"));
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onErr, { once: true });
        video.src = movieUrl;
        video.playsInline = true;
        video.muted = true;
        video.preload = "auto";
        video.load();
      });

      await video.play().catch(() => {});
      video.pause();

      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) throw new Error("動画の長さが取得できませんでした。");

      const w = video.videoWidth || 720;
      const h = video.videoHeight || 1280;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvasが初期化できませんでした。");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      const sampleFps = 6;
      const totalFrames = Math.max(1, Math.floor(duration * sampleFps));
      const step = duration / totalFrames;

      setProgress({ current: 0, total: totalFrames });

      const list: FrameMetrics[] = [];

      function pickSide(landmarks: any[]) {
        const l = { sh: landmarks[11], hip: landmarks[23], knee: landmarks[25], ank: landmarks[27] };
        const r = { sh: landmarks[12], hip: landmarks[24], knee: landmarks[26], ank: landmarks[28] };
        const lVis =
          (l.sh.visibility ?? 0) + (l.hip.visibility ?? 0) + (l.knee.visibility ?? 0) + (l.ank.visibility ?? 0);
        const rVis =
          (r.sh.visibility ?? 0) + (r.hip.visibility ?? 0) + (r.knee.visibility ?? 0) + (r.ank.visibility ?? 0);
        return lVis >= rVis ? { side: "L" as const, ...l } : { side: "R" as const, ...r };
      }
      function mid(a: any, b: any) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }

      for (let i = 0; i < totalFrames; i++) {
        const t = i * step;

        await seekVideo(video, t);

        ctx.drawImage(video, 0, 0, w, h);

        const ts = Math.round(t * 1000);
        const res = landmarker.detectForVideo(canvas, ts);

        setProgress({ current: i + 1, total: totalFrames });

        const pose = res?.landmarks?.[0];
        if (!pose) continue;

        const leftShoulder = pose[11];
        const rightShoulder = pose[12];
        const leftHip = pose[23];
        const rightHip = pose[24];

        const shoulderMid = mid(leftShoulder, rightShoulder);
        const hipMid = mid(leftHip, rightHip);

        const picked = pickSide(pose);
        const visScore =
          ((picked.sh.visibility ?? 0) +
            (picked.hip.visibility ?? 0) +
            (picked.knee.visibility ?? 0) +
            (picked.ank.visibility ?? 0) +
            (leftShoulder.visibility ?? 0) +
            (rightShoulder.visibility ?? 0) +
            (leftHip.visibility ?? 0) +
            (rightHip.visibility ?? 0)) /
          8;

        if (visScore < 0.45) continue;

        const trunk = trunkLeanDeg(shoulderMid, hipMid);
        const hipAng = angleABC(picked.sh, picked.hip, picked.knee);
        const kneeAng = angleABC(picked.hip, picked.knee, picked.ank);

        if (!isFinite(trunk) || !isFinite(hipAng) || !isFinite(kneeAng)) continue;

        list.push({
          t,
          trunkLeanDeg: trunk,
          hipAngleDeg: hipAng,
          kneeAngleDeg: kneeAng,
          visScore,
        });
      }

      landmarker.close();

      if (list.length === 0) {
        throw new Error(
          "姿勢推定に失敗しました（有効フレーム0）。\n明るい場所・全身が入る・カメラ固定で撮り直してください。"
        );
      }

      const avg = avgMetrics(list);
      const peak = peakMetrics(list);

      const series = {
        trunk: list.map((m) => m.trunkLeanDeg),
        hip: list.map((m) => m.hipAngleDeg),
        knee: list.map((m) => m.kneeAngleDeg),
        t: list.map((m) => m.t),
      };

      const message = buildMessage(type, avg, peak);

      setResult({
        frames: totalFrames,
        usedFrames: list.length,
        avg,
        peak,
        series,
        message,
      });

      setStatus("done");
    } catch (e: any) {
      setStatus("ready");
      setErrMsg(e?.message ?? "解析に失敗しました。");
    }
  }

  const title = `カテゴリ：${typeLabel(type)}`;

  // ✅ A: 評価ゾーン（見やすさ強化）
  // ※この数値は「仮の見やすい帯」。あとでチューニングする前提でOK
  const zonesTrunk = [
    { from: 0, to: 12, color: "rgba(255,255,255,0.05)", label: "立ち気味" },
    { from: 12, to: 25, color: "rgba(90,160,255,0.12)", label: "目安" },
    { from: 25, to: 60, color: "rgba(255,120,120,0.10)", label: "前傾大" },
  ];
  const zonesHip = [
    { from: 110, to: 150, color: "rgba(255,120,120,0.08)", label: "浅い" },
    { from: 150, to: 175, color: "rgba(90,160,255,0.12)", label: "目安" },
    { from: 175, to: 200, color: "rgba(255,255,255,0.05)", label: "伸びすぎ" },
  ];
  const zonesKnee = [
    { from: 110, to: 150, color: "rgba(255,120,120,0.08)", label: "入りすぎ" },
    { from: 150, to: 175, color: "rgba(90,160,255,0.12)", label: "目安" },
    { from: 175, to: 200, color: "rgba(255,255,255,0.05)", label: "伸びすぎ" },
  ];

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
              ref={videoElRef}
              src={movieUrl ?? ""}
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", height: 300, objectFit: "contain", display: "block" }}
            />
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {errMsg && (
            <div style={{ marginTop: 10, opacity: 0.95, lineHeight: 1.6 }}>
              ⚠️ {errMsg}
            </div>
          )}

          {status === "analyzing" && progress && (
            <div style={{ marginTop: 12, lineHeight: 1.6, opacity: 0.95 }}>
              🔍 解析中… {progress.current}/{progress.total}
              <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.12)" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round((progress.current / progress.total) * 100)}%`,
                    borderRadius: 999,
                    background: "rgba(90,160,255,0.9)",
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button
              type="button"
              className="cta"
              onClick={runAnalysis}
              disabled={!movieUrl || status === "analyzing"}
              style={{ flex: 1 }}
            >
              解析開始（本気）
            </button>

            <button
              type="button"
              onClick={goBack}
              style={{
                flex: 1,
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
        </div>

        {result && (
          <div style={{ marginTop: 14 }}>
            {/* 結果テキスト */}
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>結果</div>

              <div style={{ opacity: 0.95, lineHeight: 1.8 }}>
                <div>🧾 サンプル：{result.frames} frames（有効 {result.usedFrames}）</div>
                <div>平均 体幹前傾：{result.avg.trunkLeanDeg.toFixed(1)}°</div>
                <div>平均 股関節角：{result.avg.hipAngleDeg.toFixed(1)}°</div>
                <div>平均 膝角：{result.avg.kneeAngleDeg.toFixed(1)}°</div>
                <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>✅ {result.message}</div>

                <div style={{ marginTop: 12 }}>
                  <button type="button" className="cta" onClick={jumpToPeak} style={{ width: "100%" }}>
                    最大前傾フレームへジャンプ
                  </button>
                </div>
              </div>
            </div>

            {/* グラフ（ここが消えてたので復活） */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>グラフ</div>

              <div style={{ display: "grid", gap: 12 }}>
                <AngleChart
                  title="体幹前傾"
                  data={result.series.trunk}
                  avg={result.avg.trunkLeanDeg}
                  peak={result.peak.trunkLeanDeg}
                  zones={zonesTrunk}
                />

                <AngleChart
                  title="股関節角"
                  data={result.series.hip}
                  avg={result.avg.hipAngleDeg}
                  peak={result.peak.hipAngleDeg}
                  zones={zonesHip}
                />

                <AngleChart
                  title="膝角"
                  data={result.series.knee}
                  avg={result.avg.kneeAngleDeg}
                  peak={result.peak.kneeAngleDeg}
                  zones={zonesKnee}
                />
              </div>
            </div>

            {/* ジャンプ先 */}
            <div ref={peakRef} style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>最大前傾フレーム（自動抽出）</div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                }}
              >
                <div style={{ opacity: 0.9, lineHeight: 1.7 }}>
                  <div>ピーク前傾：{result.peak.trunkLeanDeg.toFixed(1)}°</div>
                  <div>ピーク時刻：{result.peak.t.toFixed(2)} sec</div>
                  <div style={{ opacity: 0.75, marginTop: 6 }}>
                    ※ボタンを押すとこの位置へスクロールし、動画もこの時刻へ移動します。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ===== helper =====

async function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const onSeeked = () => resolve();
    const onErr = () => reject(new Error("動画のシークに失敗しました。"));
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onErr, { once: true });
    try {
      video.currentTime = time;
    } catch {
      reject(new Error("動画のシークができませんでした。"));
    }
  });
}

function avgMetrics(list: FrameMetrics[]): AvgMetrics {
  const n = list.length;
  const sum = list.reduce(
    (acc, m) => {
      acc.trunkLeanDeg += m.trunkLeanDeg;
      acc.hipAngleDeg += m.hipAngleDeg;
      acc.kneeAngleDeg += m.kneeAngleDeg;
      acc.visScore += m.visScore;
      return acc;
    },
    { trunkLeanDeg: 0, hipAngleDeg: 0, kneeAngleDeg: 0, visScore: 0 }
  );

  return {
    trunkLeanDeg: sum.trunkLeanDeg / n,
    hipAngleDeg: sum.hipAngleDeg / n,
    kneeAngleDeg: sum.kneeAngleDeg / n,
    visScore: sum.visScore / n,
  };
}

function peakMetrics(list: FrameMetrics[]): FrameMetrics {
  let best = list[0];
  for (const m of list) {
    if (m.trunkLeanDeg > best.trunkLeanDeg) best = m;
  }
  return best;
}

function buildMessage(type: CatNum, avg: AvgMetrics, peak: FrameMetrics) {
  const trunk = avg.trunkLeanDeg;
  const hip = avg.hipAngleDeg;
  const knee = avg.kneeAngleDeg;

  const lines: string[] = [];

  lines.push(`体幹前傾(平均) ${trunk.toFixed(1)}° / Peak ${peak.trunkLeanDeg.toFixed(1)}°`);
  lines.push(`股関節角(平均) ${hip.toFixed(1)}°  膝角(平均) ${knee.toFixed(1)}°`);

  if (trunk > 25) lines.push("→ 体幹前傾が大きめ。上体が突っ込みやすい可能性。");
  else if (trunk < 12) lines.push("→ 体幹が立ち気味。股関節で折れていない可能性。");
  else lines.push("→ 体幹前傾は概ね良好。");

  if (hip < 150) lines.push("→ 股関節が浅い（折れが弱い）可能性。股関節主導を意識。");
  else if (hip > 175) lines.push("→ 股関節が伸びすぎ（反り/抜け）傾向の可能性。");
  else lines.push("→ 股関節角は概ね良好。");

  if (knee < 150) lines.push("→ 膝が入りすぎ（沈み）傾向の可能性。");
  else if (knee > 175) lines.push("→ 膝が伸びすぎ（棒立ち）傾向の可能性。");
  else lines.push("→ 膝角は概ね良好。");

  if (type === 1) lines.push("カテゴリⅠ：前伸の狙い → “前へ伸ばす”時に体幹が潰れないか要チェック。");
  if (type === 2) lines.push("カテゴリⅡ：前沈の狙い → 沈みすぎて前へ進まない形になってないか要チェック。");
  if (type === 3) lines.push("カテゴリⅢ：後伸の狙い → 後ろ側の反発が“前へ伝わる”か要チェック。");
  if (type === 4) lines.push("カテゴリⅣ：後沈の狙い → 後ろに沈んでも“前の推進”が死んでないか要チェック。");

  lines.push("");
  lines.push("次の本気拡張：①骨盤角(ASIS推定) ②胸郭回旋 ③頭部位置 ④タイミング(最大前傾の瞬間) を追加して精度を上げる。");

  return lines.join("\n");
}