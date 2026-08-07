import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { Icons } from "./icons";
import { T, css } from "@/theme";
import { useCloseOnEscape } from "@/lib/dialog";

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

/** Base stacking level for dialogs; nested ones sit above it. */
export const MODAL_Z = 300;

/**
 * The backdrop every dialog sits on.
 *
 * Two things it deliberately does not do:
 *
 * It is not pinned to the viewport. A pinned overlay can only ever be as tall
 * as the viewport, and the viewport is not always what the reader can see —
 * the shared demo runs in a frame grown to the height of the whole app, where
 * a pinned dialog taller than the frame is simply cut off with nothing to
 * scroll. Growing with its content instead lets the page scroll, which works
 * the same in a window and in a frame.
 *
 * And it renders into the body rather than in place. Anchored to whichever
 * positioned ancestor happened to be above it, the overlay would start partway
 * down the page and end up that much taller than it — enough, in a frame that
 * resizes to its content, to make the page grow a little on every round.
 */
export function DialogOverlay({
  onClose,
  background,
  blur,
  zIndex = MODAL_Z,
  children,
}: {
  onClose: () => void;
  background: string;
  blur: string;
  zIndex?: number;
  children: ReactNode;
}) {
  useCloseOnEscape(onClose);

  return createPortal(
    <div
      // A click that starts and ends on the backdrop is a click past the
      // dialog, so it dismisses. Anything inside the dialog is not.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-dialog-backdrop=""
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        minHeight: "100%",
        background,
        backdropFilter: blur,
        zIndex,
        padding: 20,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function Modal({
  title,
  onClose,
  children,
  width = 480,
  zIndex = MODAL_Z,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  /** Raise above another dialog when one opens on top of it. */
  zIndex?: number;
}) {
  return (
    <DialogOverlay
      onClose={onClose}
      zIndex={zIndex}
      background="rgba(6,32,23,.55)"
      blur="blur(6px)"
    >
      <div
        style={{
          ...css.card,
          width: "100%",
          maxWidth: width,
          margin: "0 auto",
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
    </DialogOverlay>
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
  // The toast owns a single 2.5s lifetime from mount, but callers pass a fresh
  // arrow each render — keep the latest in a ref so the timer never restarts
  // and never fires a stale callback.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 2500);
    return () => clearTimeout(t);
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
