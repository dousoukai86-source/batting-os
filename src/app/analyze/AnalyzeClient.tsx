"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL } from "@/lib/videoStore";
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

function vec(a: any, b: any) {
  return { x: b.x - a.x, y: b.y - a.y };
}

function dot(u: any, v: any) {
  return u.x * v.x + u.y * v.y;
}

function norm(u: any) {
  return Math.sqrt(u.x * u.x + u.y * u.y);
}

function angleABC(a: any, b: any, c: any) {
  const u = vec(b, a);
  const v = vec(b, c);
  const nu = norm(u);
  const nv = norm(v);
  if (nu === 0 || nv === 0) return NaN;
  const cos = clamp(dot(u, v) / (nu * nv), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

function trunkLeanDeg(shoulderMid: any, hipMid: any) {
  const v = vec(hipMid, shoulderMid);
  const nv = norm(v);
  if (nv === 0) return NaN;
  const cos = clamp((v.y * -1) / nv, -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

type PoseMetrics = {
  trunkLeanDeg: number;
  hipAngleDeg: number;
  kneeAngleDeg: number;
  visScore: number;
};

type AnalysisResult = {
  frames: number;
  usedFrames: number;
  avg: PoseMetrics;
  peak: PoseMetrics;
  message: string;
  series: { t: number; trunk: number; hip: number; knee: number }[];
};

export default function AnalyzeClient({ type }: { type: CatNum }) {
  const router = useRouter();
  const sp = useSearchParams();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [movieUrl, setMovieUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "analyzing" | "done"
  >("idle");
  const [errMsg, setErrMsg] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const movieParam = useMemo(() => sp.get("movie"), [sp]);

  useEffect(() => {
    async function resolveMovie() {
      setStatus("loading");
      let m = movieParam;

      if (!m) {
        const last = localStorage.getItem(LS_LAST_VIDEO_ID);
        if (last) m = `video:${last}`;
      }

      if (!m) {
        setStatus("idle");
        setErrMsg("動画がありません");
        return;
      }

      if (m.startsWith("video:")) {
        const id = m.slice(6);
        const url = await getVideoObjectURL(id);
        if (!url) {
          setStatus("idle");
          setErrMsg("保存動画が見つかりません");
          return;
        }
        setMovieUrl(url);
      } else {
        setMovieUrl(m);
      }

      setStatus("ready");
    }

    resolveMovie();
  }, [movieParam]);

  async function runAnalysis() {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    setStatus("analyzing");
    setResult(null);

    await video.play().catch(() => {});
    video.pause();

    const duration = video.duration;
    const sampleFps = 5;
    const totalFrames = Math.floor(duration * sampleFps);
    const step = duration / totalFrames;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

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

    const metrics: PoseMetrics[] = [];
    const series: { t: number; trunk: number; hip: number; knee: number }[] =
      [];

    for (let i = 0; i < totalFrames; i++) {
      const t = i * step;
      await seekVideo(video, t);
      ctx.drawImage(video, 0, 0);
      const res = landmarker.detectForVideo(canvas, t * 1000);
      const pose = res.landmarks?.[0];
      if (!pose) continue;

      const shoulderMid = {
        x: (pose[11].x + pose[12].x) / 2,
        y: (pose[11].y + pose[12].y) / 2,
      };
      const hipMid = {
        x: (pose[23].x + pose[24].x) / 2,
        y: (pose[23].y + pose[24].y) / 2,
      };

      const trunk = trunkLeanDeg(shoulderMid, hipMid);
      const hipAng = angleABC(pose[11], pose[23], pose[25]);
      const kneeAng = angleABC(pose[23], pose[25], pose[27]);

      if (!isFinite(trunk) || !isFinite(hipAng) || !isFinite(kneeAng))
        continue;

      metrics.push({
        trunkLeanDeg: trunk,
        hipAngleDeg: hipAng,
        kneeAngleDeg: kneeAng,
        visScore: 1,
      });

      series.push({ t, trunk, hip: hipAng, knee: kneeAng });
    }

    landmarker.close();

    if (!metrics.length) {
      setStatus("ready");
      setErrMsg("姿勢推定失敗");
      return;
    }

    const avg = avgMetrics(metrics);
    const peak = metrics.reduce((a, b) =>
      b.trunkLeanDeg > a.trunkLeanDeg ? b : a
    );

    setResult({
      frames: totalFrames,
      usedFrames: metrics.length,
      avg,
      peak,
      message: buildMessage(type, avg),
      series,
    });

    setStatus("done");
  }

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">カテゴリ：{typeLabel(type)}</div>

        <video
          ref={videoRef}
          src={movieUrl ?? ""}
          controls
          style={{ width: "100%", height: 300, objectFit: "contain" }}
        />

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <button
          className="cta"
          onClick={runAnalysis}
          disabled={!movieUrl || status === "analyzing"}
        >
          解析開始（本気）
        </button>

        {result && (
          <div style={{ marginTop: 20 }}>
            <div>サンプル：{result.frames}</div>
            <div>平均 体幹前傾：{result.avg.trunkLeanDeg.toFixed(1)}°</div>
            <MiniLineChart
              title="体幹前傾"
              data={result.series.map((d) => d.trunk)}
            />
            <MiniLineChart
              title="股関節角"
              data={result.series.map((d) => d.hip)}
            />
            <MiniLineChart
              title="膝角"
              data={result.series.map((d) => d.knee)}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function MiniLineChart({ title, data }: { title: string; data: number[] }) {
  if (data.length < 2) return null;
  const W = 320;
  const H = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;

  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / span) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ marginTop: 10 }}>
      <div>{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <polyline
          points={pts}
          fill="none"
          stroke="cyan"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function avgMetrics(list: PoseMetrics[]) {
  const n = list.length;
  return {
    trunkLeanDeg:
      list.reduce((a, b) => a + b.trunkLeanDeg, 0) / n,
    hipAngleDeg:
      list.reduce((a, b) => a + b.hipAngleDeg, 0) / n,
    kneeAngleDeg:
      list.reduce((a, b) => a + b.kneeAngleDeg, 0) / n,
    visScore: 1,
  };
}

function buildMessage(type: CatNum, avg: PoseMetrics) {
  return `平均体幹前傾 ${avg.trunkLeanDeg.toFixed(1)}°`;
}

async function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    video.currentTime = time;
    video.onseeked = () => resolve();
  });
}