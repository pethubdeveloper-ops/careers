import { useEffect, type ReactNode } from "react";
import { Icon, Icons } from "./Icon";
import { T, css } from "@/theme";

export function Field({
  label,
  children,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 600,
          color: T.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11.5, color: T.subtle, marginTop: 4 }}>{hint}</p>
      )}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  width = 480,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,32,23,.55)",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(6px)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          ...css.card,
          width: "100%",
          maxWidth: width,
          margin: "auto",
          padding: 28,
          background: "rgba(255,255,255,.14)",
          boxShadow:
            "0 24px 70px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.muted,
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon d={Icons.x} size={18} color={T.muted} stroke />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Badge({
  label,
  color = T.accent,
}: {
  label: ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: `${color}18`,
        color,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
    // Fire-and-forget: the toast owns a single 2.5s lifetime from mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        background: T.text,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 500,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,.25)",
        animation: "slideUp .2s ease",
      }}
    >
      <Icon d={Icons.check} size={16} color={T.accent} stroke /> {msg}
    </div>
  );
}

export function PageHeader({
  title,
  children,
}: {
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 4,
            height: 38,
            borderRadius: 99,
            background: `linear-gradient(180deg, ${T.accent}, ${T.info})`,
            flexShrink: 0,
          }}
        />
        <div>
          <p
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 3,
            }}
          >
            Management
          </p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: T.text,
              letterSpacing: "-.02em",
            }}
          >
            {title}
          </h1>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>{children}</div>
    </div>
  );
}
