"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVideoObjectURL, saveVideo } from "@/lib/videoStore";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string | null): CatNum | null {
  if (!v) return null;

  // 数字(1-4)
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  // ローマ(I/II/III/IV)
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

// iPhone Safariでプレビューが真っ黒になりがち → mp4 優先で選ぶ
function pickMimeType() {
  const candidates = [
    // Safari(対応していれば) mp4(H.264) が最強
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    // だめなら webm
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return ""; // 未指定で作る(最後の手段)
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
  const previewUrlRef = useRef<string | null>(null); // revoke用

  const [errMsg, setErrMsg] = useState<string>("");
  const [camState, setCamState] = useState<"off" | "on">("off");
  const [recState, setRecState] = useState<"idle" | "rec" | "saving">("idle");

  const [useBackCam, setUseBackCam] = useState(true); // 外カメラ優先
  const [savedId, setSavedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // 既に起動中なら止めてから
    await stopCamera();

    try {
      // iPhoneは environment が外カメラ
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
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
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
        const type = mr.mimeType || (mimeType || "");
        const blob = new Blob(chunksRef.current, { type: type || "video/mp4" });

        // 保存
        const id = await saveVideo(blob, blob.type || type || "video/mp4");
        setSavedId(id);

        // ✅ 追加：最後に保存した動画IDを記憶（解析で拾えるように）
        try {
          localStorage.setItem("batting_os_last_movie", `video:${id}`);
        } catch {}

        // プレビューURL（Safariが読める形式なら再生可能）
        const url = await getVideoObjectURL(id);
        if (url) setPreview(url);

        setRecState("idle");
      } catch (e: any) {
        setRecState("idle");
        setErrMsg(e?.message ?? "保存に失敗しました。");
      }
    };

    try {
      mr.start(1000); // 1秒ごとにdataavailable（安定）
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
    // Analyze側で movie=video:<id> を解決する
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

          <button
            type="button"
            className="cta"
            onClick={startCamera}
            disabled={camState === "on" || recState !== "idle"}
          >
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
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: 220,
                objectFit: "cover",
                display: "block",
              }}
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
                // 切替 → 一旦停止してから
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

          {errMsg && (
            <div style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.6 }}>
              ⚠️ {errMsg}
            </div>
          )}

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
              src={previewUrl ?? ""}
              controls
              playsInline
              preload="metadata"
              style={{
                width: "100%",
                height: 200,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {savedId && (
            <div style={{ marginTop: 10, opacity: 0.95 }}>
              ✅ 保存完了（id: {savedId}）
            </div>
          )}
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