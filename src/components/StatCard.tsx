import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { T, css } from "@/theme";

/**
 * Animates a numeric display from 0 to its target on change.
 * Non-numeric values pass straight through.
 */
export function useCountUp(target: string | number): string | number {
  const [val, setVal] = useState<string | number>(target);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const str = String(target);
    const num = parseFloat(str.replace(/[^0-9.]/g, ""));

    if (isNaN(num) || prev.current === str) {
      setVal(target);
      return;
    }
    prev.current = str;

    const prefix = str.match(/^[^0-9]*/)?.[0] ?? "";
    const hasComma = str.includes(",") || num >= 1000;
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const n = Math.round(num * e);
      setVal(prefix + (hasComma ? n.toLocaleString() : n));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return val;
}

export function StatCard({
  label,
  value,
  iconD,
  accent,
  sublabel,
  onClick,
}: {
  label: string;
  value: string | number;
  iconD: string;
  accent: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  const shown = useCountUp(value);

  return (
    <div
      className="ph-stat"
      onClick={onClick}
      style={{
        ...css.card,
        padding: "20px 22px",
        borderTop: `3px solid ${accent}`,
        flex: 1,
        minWidth: 160,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -34,
          right: -34,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: `${accent}0a`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: T.muted,
            textTransform: "uppercase",
            letterSpacing: ".07em",
            lineHeight: 1.3,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}25, ${accent}0d)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1px solid ${accent}25`,
          }}
        >
          <Icon d={iconD} size={17} color={accent} stroke />
        </div>
      </div>
      <p
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: T.text,
          letterSpacing: "-.02em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {shown}
      </p>
      {sublabel && (
        <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{sublabel}</p>
      )}
      {onClick && (
        <p
          style={{ fontSize: 11, color: accent, fontWeight: 700, marginTop: 6 }}
        >
          View →
        </p>
      )}
    </div>
  );
}
