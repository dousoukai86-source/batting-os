"use client";

type Zone = {
  from: number;
  to: number;
  color: string;
};

export default function AngleChart({
  title,
  data,
  avg,
  peak,
  zones,
}: {
  title: string;
  data: number[];
  avg: number;
  peak: number;
  zones?: Zone[];
}) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: 20,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>

      <div
        style={{
          position: "relative",
          height: 120,
          background: "#081018",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {zones &&
          zones.map((z, i) => {
            const top = ((max - z.to) / range) * 100;
            const height = ((z.to - z.from) / range) * 100;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${top}%`,
                  height: `${height}%`,
                  background: z.color,
                  opacity: 0.15,
                }}
              />
            );
          })}

        <svg width="100%" height="100%">
          <polyline
            fill="none"
            stroke="#32e6e2"
            strokeWidth="2"
            points={data
              .map((v, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = ((max - v) / range) * 100;
                return `${x}%,${y}%`;
              })
              .join(" ")}
          />
        </svg>
      </div>

      <div style={{ marginTop: 10 }}>
        平均: {avg.toFixed(1)}° / ピーク: {peak.toFixed(1)}°
      </div>
    </div>
  );
}