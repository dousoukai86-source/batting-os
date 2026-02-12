"use client";

import React from "react";

type Zone = {
  from: number;
  to: number;
  color: string; // 例: "rgba(90,160,255,0.15)"
  label?: string;
};

export default function AngleChart({
  title,
  data,
  avg,
  peak,
  zones = [],
}: {
  title: string;
  data: number[];
  avg: number;
  peak: number;
  zones?: Zone[];
}) {
  if (!data?.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const W = 320;
  const H = 120;
  const PAD = 12;

  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => PAD + (H - PAD * 2) * (1 - (v - min) / range);

  const path = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");

  const avgY = y(avg);
  const peakIndex = data.indexOf(peak);
  const peakX = peakIndex >= 0 ? x(peakIndex) : x(data.length - 1);
  const peakY = y(peak);

  // ゾーンは data の min/max に合わせて正規化して描画
  const zoneRects = zones
    .map((z, idx) => {
      const top = y(z.to);
      const bottom = y(z.from);
      const h = Math.max(0, bottom - top);
      return (
        <g key={idx}>
          <rect x={0} y={top} width={W} height={h} fill={z.color} />
        </g>
      );
    })
    .reverse(); // 上のゾーンが上に来るように

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.20)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ opacity: 0.85, fontSize: 12 }}>
          min {min.toFixed(1)}° / max {max.toFixed(1)}°
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* 背景 */}
          <rect x={0} y={0} width={W} height={H} fill="rgba(255,255,255,0.03)" rx={14} />

          {/* ゾーン */}
          {zoneRects}

          {/* 目安ライン（平均） */}
          <line x1={0} y1={avgY} x2={W} y2={avgY} stroke="rgba(255,255,255,0.25)" strokeDasharray="6 6" />

          {/* 折れ線 */}
          <path d={path} fill="none" stroke="rgba(90,220,220,0.95)" strokeWidth={2.6} />

          {/* Peak marker */}
          <line x1={peakX} y1={0} x2={peakX} y2={H} stroke="rgba(255,255,255,0.12)" />
          <circle cx={peakX} cy={peakY} r={4.8} fill="rgba(90,220,220,1)" stroke="rgba(0,0,0,0.4)" />
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 900 }}>
        <div>平均: {avg.toFixed(1)}°</div>
        <div>ピーク: {peak.toFixed(1)}°</div>
      </div>
    </div>
  );
}