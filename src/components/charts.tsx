import { useState } from "react";
import { T } from "@/theme";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  hoverColor?: string;
}

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const r = 56,
    cx = 70,
    cy = 70,
    sw = 18,
    circ = 2 * Math.PI * r;

  const total = segments.reduce((s, sg) => s + sg.value, 0);

  let offset = 0;
  const arcs = segments.map((sg) => {
    const pct = total ? sg.value / total : 0;
    const arc = { ...sg, pct, offset, dash: pct * circ, gap: (1 - pct) * circ };
    offset += pct * circ;
    return arc;
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={140} height={140} style={{ overflow: "visible" }}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={T.border}
            strokeWidth={sw}
          />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={hov === i ? a.hoverColor || a.color : a.color}
              strokeWidth={hov === i ? sw + 3 : sw}
              strokeDasharray={`${a.dash} ${circ}`}
              strokeDashoffset={-a.offset}
              opacity={hov !== null && hov !== i ? 0.4 : 1}
              style={{
                cursor: "pointer",
                transform: "rotate(-90deg)",
                transformOrigin: `${cx}px ${cy}px`,
                transition: "all .2s",
              }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            />
          ))}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fontSize={11}
            fill={T.muted}
            fontFamily="Inter,sans-serif"
          >
            Total
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize={26}
            fontWeight={800}
            fill={T.text}
            fontFamily="Inter,sans-serif"
          >
            {total}
          </text>
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {arcs.map((a, i) => (
          <div
            key={i}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "default",
              opacity: hov !== null && hov !== i ? 0.5 : 1,
              transition: "opacity .15s",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: a.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: T.muted }}>{a.label}</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: T.text,
                marginLeft: 4,
              }}
            >
              {a.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface BarDatum {
  label: string;
  value: number;
}

export function BarChart({
  data,
  height = 150,
  color = T.accent,
  prefix = "",
  valueFmt,
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  prefix?: string;
  valueFmt?: (v: number) => string;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          height,
          paddingTop: 20,
        }}
      >
        {data.map((d, i) => {
          const h = Math.max(3, Math.round((d.value / max) * (height - 24)));
          const active = hov === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
                cursor: "default",
                position: "relative",
              }}
            >
              {active && (
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    background: T.text,
                    color: "#fff",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    zIndex: 2,
                  }}
                >
                  {valueFmt
                    ? valueFmt(d.value)
                    : `${prefix}${d.value.toLocaleString()}`}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  maxWidth: 34,
                  height: h,
                  borderRadius: "6px 6px 2px 2px",
                  background: active ? color : `${color}bb`,
                  transition: "all .15s",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 11,
              color: T.muted,
              fontWeight: 500,
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
