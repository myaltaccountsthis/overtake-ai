import React from "react";

export default function ChartsPlaceholder({
  title = "Charts",
  data = [1, 3, 2, 5, 4],
}: {
  title?: string;
  data?: number[];
}) {
  // Simple sparkline-like SVG chart. Detects "temp" or "pressure" in the title
  // and uses sensible fixed ranges so points never render outside the SVG.
  const w = 400,
    h = 100,
    padding = 6;

  // Determine y-range based on title (case-insensitive). These are sensible defaults.
  const t = (title || "").toLowerCase();
  let yMin = Math.min(...data, 0);
  let yMax = Math.max(...data, 1);
  if (t.includes("temp")) {
    yMin = 60;
    yMax = 110;
  } else if (t.includes("press")) {
    yMin = 20;
    yMax = 26;
  } else {
    // small padding so flat lines still show
    if (yMin === yMax) {
      yMin = yMin - 1;
      yMax = yMax + 1;
    }
    const pad = (yMax - yMin) * 0.1;
    yMin = yMin - pad;
    yMax = yMax + pad;
  }

  // helper to clamp a value into [yMin, yMax]
  const clamp = (v: number) => Math.max(yMin, Math.min(yMax, v));

  const count = Math.max(1, data.length - 1);
  const points = data
    .map((raw, i) => {
      const v = clamp(raw);
      const x = padding + (i / count) * (w - padding * 2);
      // invert y because SVG origin is top-left
      const y =
        padding + (1 - (v - yMin) / (yMax - yMin)) * (h - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Colors tuned for dark backgrounds
  const strokeColor = "#a78bfa"; // violet-300
  const dotColor = "#a78bfa";
  const gridColor = "rgba(255,255,255,0.03)";

  return (
    <div className="card bg-slate-800 border border-slate-700 rounded p-3">
      <h3 className="text-lg font-semibold mb-2 text-slate-100">{title}</h3>

      {/* responsive SVG: use viewBox and width=100% so it fits the tooltip/card width */}
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className="block"
        role="img"
        aria-label={`${title} — placeholder chart`}
      >
        {/* subtle background rect to make the chart area distinct on dark */}
        <rect
          x="0"
          y="0"
          width={w}
          height={h}
          fill="transparent"
          rx="4"
        />

        {/* subtle horizontal grid lines */}
        <g stroke={gridColor} strokeWidth={1}>
          {[0.0, 0.25, 0.5, 0.75, 1.0].map((p, idx) => {
            const y = padding + p * (h - padding * 2);
            return <line key={idx} x1={padding} x2={w - padding} y1={y} y2={y} />;
          })}
        </g>

        {/* polyline */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.5}
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.98}
        />

        {/* area glow (soft, very subtle) */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.04}
        />

        {/* data points */}
        {data.map((raw, i) => {
          const v = clamp(raw);
          const x = padding + (i / count) * (w - padding * 2);
          const y =
            padding + (1 - (v - yMin) / (yMax - yMin)) * (h - padding * 2);
          return <circle key={i} cx={x} cy={y} r={3.25} fill={dotColor} />;
        })}
      </svg>

      <div className="text-sm text-slate-400 mt-2">
        Placeholder chart — replace with real data from backend
      </div>
    </div>
  );
}
