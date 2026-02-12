"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL, saveVideo } from "@/lib/videoStore";

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
  return type === 1
    ? "Ⅰ 前伸傾向"
    : type === 2
    ? "Ⅱ 前沈傾向"
    : type === 3
    ? "Ⅲ 後伸傾向"
    : "Ⅳ 後沈傾向";
}

function pickMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const t of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported?.(t)
    )
      return t;
  }
  return "";
}

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryRaw = sp.get("category");
  const category = useMemo(() => toCatNum(categoryRaw), [categoryRaw]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const previewUrlRef = useRef<string | null>(null);

  const [savedId, setSavedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useBackCam, setUseBackCam] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function setPreview(url: string | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  async function startCamera() {
    setErrMsg("");
    setSavedId(null);
    setPreview(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: useBackCam ? { ideal: "environment" } : { ideal: "user" },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setErrMsg("カメラ起動失敗");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function startRec() {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = pickMimeType();
    const mr = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    recorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: mr.mimeType || "video/mp4",
      });

      const id = await saveVideo(blob, blob.type);
      setSavedId(id);
      localStorage.setItem("batting_os:lastVideoId", id);

      // ★★★★★ 超重要 ★★★★★
      // 最後の動画を localStorage に保存
      

      const url = await getVideoObjectURL(id);
      if (url) setPreview(url);
    };

    mr.start();
  }

  function stopRec() {
    recorderRef.current?.stop();
  }

  function goAnalyze() {
    if (!category) return;
    if (!savedId) return;

    router.push(
      `/analyze/${category}?movie=${encodeURIComponent(
        `video:${savedId}`
      )}`
    );
  }

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
        <div className="desc">
          {category ? `カテゴリ：${typeLabel(category)}` : "カテゴリ未選択"}
        </div>

        <button className="cta" onClick={startCamera}>
          カメラを起動（外カメラ）
        </button>

        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: 220 }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button className="cta" onClick={startRec}>
            録画開始
          </button>
          <button onClick={stopRec}>録画停止</button>
        </div>

        <button onClick={() => setUseBackCam(!useBackCam)}>
          カメラ切替
        </button>

        <div>
          <h3>録画プレビュー</h3>
          <video
            src={previewUrl ?? ""}
            controls
            playsInline
            style={{ width: "100%" }}
          />
        </div>

        {savedId && <div>✅ 保存完了（id: {savedId}）</div>}

        <button className="cta" onClick={goAnalyze}>
          この動画で解析へ進む
        </button>
      </div>
    </main>
  );
}