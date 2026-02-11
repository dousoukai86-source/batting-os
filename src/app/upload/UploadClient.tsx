"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveVideo } from "@/lib/videoStore";

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

function pickMimeType() {
  const candidates = [
    // iOS Safari だと mp4 が最優先（対応してれば）
    "video/mp4",
    // webm は iOS でプレビュー死にやすいので最後の最後
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return "";
}

export default function UploadClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryRaw = sp.get("category");
  const category = useMemo(() => toCatNum(categoryRaw), [categoryRaw]);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const previewRef = useRef<HTMLVideoElement | null>(null);
  const previewUrlRef = useRef<string | null>(null); // revoke用

  const [errMsg, setErrMsg] = useState("");
  const [camState, setCamState] = useState<"off" | "on">("off");
  const [recState, setRecState] = useState<"idle" | "rec" | "saving">("idle");

  const [useBackCam, setUseBackCam] = useState(true);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // previewUrlが変わったら load して確実に反映（iOS対策）
  useEffect(() => {
    const v = previewRef.current;
    if (!v) return;
    if (!previewUrl) return;
    try {
      v.load();
    } catch {}
  }, [previewUrl]);

  function setPreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  async function startCamera() {
    setErrMsg("");
    setSavedId(null);
    setPreview(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErrMsg("このブラウザ/端末ではカメラAPIが使えません。");
      return;
    }

    await stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: {
          facingMode: useBackCam ? { ideal: "environment" } : { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const v = liveVideoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }

      setCamState("on");
    } catch (e: any) {
      setCamState("off");
      setErrMsg(e?.message ?? "カメラ起動に失敗しました。");
    }
  }

  async function stopCamera() {
    try {
      recorderRef.current?.state === "recording" && recorderRef.current?.stop();
    } catch {}

    recorderRef.current = null;
    chunksRef.current = [];

    const s = streamRef.current;
    if (s) s.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const v = liveVideoRef.current;
    if (v) v.srcObject = null;

    setCamState("off");
    setRecState("idle");
  }

  function startRec() {
    setErrMsg("");
    setSavedId(null);
    setPreview(null);

    const stream = streamRef.current;
    if (!stream) {
      setErrMsg("先にカメラを起動してください。");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setErrMsg("このブラウザは録画(MediaRecorder)に未対応です。");
      return;
    }

    chunksRef.current = [];
    const mimeType = pickMimeType();

    let mr: MediaRecorder;
    try {
      mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (e: any) {
      setErrMsg(e?.message ?? "MediaRecorder の初期化に失敗しました。");
      return;
    }

    recorderRef.current = mr;

    mr.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    mr.onstop = async () => {
      setRecState("saving");
      try {
        const type = mr.mimeType || mimeType || "video/mp4";
        const blob = new Blob(chunksRef.current, { type });

        // ✅ 重要：プレビューは「保存から取り直さない」。blob直でURL作る
        const localUrl = URL.createObjectURL(blob);
        setPreview(localUrl);

        // ✅ 保存は別でやる（保存はできてる前提なのでOK）
        const id = await saveVideo(blob, blob.type || type);
        setSavedId(id);

        setRecState("idle");
      } catch (e: any) {
        setRecState("idle");
        setErrMsg(e?.message ?? "保存に失敗しました。");
      }
    };

    try {
      mr.start(250); // 細かめに切る方が安定しがち
      setRecState("rec");
    } catch (e: any) {
      setErrMsg(e?.message ?? "録画開始に失敗しました。");
    }
  }

  function stopRec() {
    const mr = recorderRef.current;
    if (!mr) return;
    if (mr.state === "recording") {
      try {
        mr.stop();
      } catch (e: any) {
        setErrMsg(e?.message ?? "録画停止に失敗しました。");
      }
    }
  }

  function goAnalyze() {
    if (!category) {
      alert("カテゴリが未選択です。マトリクスから入り直してください。");
      router.push("/matrix");
      return;
    }
    if (!savedId) {
      alert("先に録画して保存してください。");
      return;
    }
    router.push(`/analyze/${category}?movie=${encodeURIComponent(`video:${savedId}`)}`);
  }

  const title = category ? `カテゴリ：${typeLabel(category)}` : "カテゴリ：未選択";

  return (
    <main>
      <div className="page">
        <div className="title">アップロード</div>
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
          <div style={{ fontWeight: 900, marginBottom: 10 }}>カメラ</div>

          <button type="button" className="cta" onClick={startCamera} disabled={camState === "on" || recState !== "idle"}>
            {useBackCam ? "カメラを起動（外カメラ）" : "カメラを起動（インカメラ）"}
          </button>

          <div
            style={{
              marginTop: 12,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.35)",
            }}
          >
            <video
              ref={liveVideoRef}
              muted
              playsInline
              style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="cta"
              onClick={startRec}
              disabled={camState !== "on" || recState !== "idle"}
              style={{ flex: 1 }}
            >
              録画開始
            </button>

            <button
              type="button"
              onClick={stopRec}
              disabled={recState !== "rec"}
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
              録画停止
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                const next = !useBackCam;
                setUseBackCam(next);
                stopCamera();
                setErrMsg("");
              }}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff",
                padding: "12px",
                borderRadius: 14,
                fontWeight: 800,
              }}
              disabled={recState !== "idle"}
            >
              {useBackCam ? "インカメラに切替" : "外カメラに切替"}
            </button>

            <button
              type="button"
              onClick={stopCamera}
              style={{
                flex: 1,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff",
                padding: "12px",
                borderRadius: 14,
                fontWeight: 800,
              }}
            >
              カメラ停止
            </button>
          </div>

          {errMsg && <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>⚠️ {errMsg}</div>}

          <div style={{ marginTop: 14, fontWeight: 900, opacity: 0.95 }}>録画プレビュー</div>

          <div
            style={{
              marginTop: 10,
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "#000",
            }}
          >
            <video
              ref={previewRef}
              key={previewUrl ?? "none"}   // ✅ iOS反映用
              src={previewUrl ?? undefined}
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", height: 200, objectFit: "contain", display: "block" }}
            />
          </div>

          {savedId && <div style={{ marginTop: 10, opacity: 0.95 }}>✅ 保存完了（id: {savedId}）</div>}
        </div>

        <button
          type="button"
          className="cta"
          onClick={goAnalyze}
          disabled={!savedId || recState !== "idle"}
          style={{ marginTop: 14 }}
        >
          この動画で解析へ進む
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