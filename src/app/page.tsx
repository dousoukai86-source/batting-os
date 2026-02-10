"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CatNum = 1 | 2 | 3 | 4;

function toCatNum(v: string | null): CatNum | null {
  if (!v) return null;

  // 数字（1-4）
  const n = Number(v);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;

  // ローマ（I/II/III/IV）
  const s = v.toUpperCase();
  if (s === "I") return 1;
  if (s === "II") return 2;
  if (s === "III") return 3;
  if (s === "IV") return 4;

  return null;
}

export default function AnalyzeEntry() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    // ✅ type でも category でも拾う（どっちで来てもOK）
    const typeRaw = sp.get("type") ?? sp.get("category");
    const type = toCatNum(typeRaw);

    const movie = sp.get("movie") ?? "/uploads/demo.mov";
    const q = `?movie=${encodeURIComponent(movie)}`;

    if (type) {
      router.replace(`/analyze/${type}${q}`);
    } else {
      router.replace(`/`);
    }
  }, [router, sp]);

  return (
    <main>
      <div className="page">
        <div className="title">解析</div>
        <div className="desc">遷移中...</div>
      </div>
    </main>
  );
}