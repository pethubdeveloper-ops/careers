import { Icon } from "./Icon";
import { useCountUp } from "@/lib/useCountUp";
import { T, css } from "@/theme";

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
