import type { CSSProperties } from "react";

/* ─── DESIGN TOKENS ──────────────────────────────────────────────────────── */
export const T = {
  sidebar: "#155f45",
  sidebarHov: "#1d7a58",
  accent: "#1eb87f",
  accentDark: "#149a6a",
  accentLite: "#8ef0c8",
  bg: "#2a7d5f",
  surface: "#328b6a",
  surfaceAlt: "#2e8464",
  border: "#47a380",
  borderMid: "#5cb896",
  text: "#f8fffb",
  muted: "#d3f0e4",
  subtle: "#a5d3c1",
  danger: "#fca5a5",
  warn: "#fcd34d",
  info: "#93c5fd",
} as const;

/** Gold accents used by the VIP loyalty card and the logo treatment. */
export const GOLD = {
  champagne: "#f4e2a1",
  gold: "#d4af37",
} as const;

export const BASE_STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: ${T.bg}; color: ${T.text}; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #26775b; border-radius: 99px; }
  input, select, textarea { font-family: inherit; }
  input::placeholder, textarea::placeholder { color: ${T.subtle}; }
  option { background: ${T.surface}; color: ${T.text}; }
  @keyframes ph-fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes ph-pop { 0% { transform:scale(.92); opacity:0; } 100% { transform:scale(1); opacity:1; } }
  @keyframes ph-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  main > div { animation: ph-fadeUp .35s ease both; }
  button { transition: transform .12s ease, box-shadow .15s ease, background .15s ease, opacity .15s ease; }
  button:active { transform: scale(.97); }
  tbody tr { transition: background .15s ease; }
  tbody tr:hover { background: rgba(34,197,138,.10) !important; }
  .ph-stat { transition: transform .18s ease, box-shadow .18s ease; position: relative; overflow: hidden; }
  .ph-stat:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(15,23,42,.10); }
  .ph-lift { transition: transform .18s ease, box-shadow .18s ease; }
  .ph-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,.09); }
  input:focus, select:focus, textarea:focus { outline: none; border-color: ${T.accent} !important; box-shadow: 0 0 0 3px ${T.accent}22; }
`;

/** Injects the base stylesheet, the Inter webfont, and Leaflet's CSS once. */
export function installGlobalStyles(): void {
  if (document.getElementById("ph-base-style")) return;

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(fontLink);

  const styleEl = document.createElement("style");
  styleEl.id = "ph-base-style";
  styleEl.textContent = BASE_STYLE;
  document.head.appendChild(styleEl);
}

/* ─── SHARED INLINE STYLE PRESETS ────────────────────────────────────────── */
export const css = {
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1.5px solid ${T.border}`,
    fontSize: 13.5,
    outline: "none",
    color: T.text,
    background: T.surface,
    transition: "border-color .15s",
  } satisfies CSSProperties,

  btnPrimary: {
    padding: "9px 18px",
    borderRadius: 8,
    border: "none",
    background: T.accent,
    color: "#fff",
    fontWeight: 600,
    fontSize: 13.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    transition: "background .15s",
  } satisfies CSSProperties,

  btnSecondary: {
    padding: "9px 18px",
    borderRadius: 8,
    border: `1.5px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    fontWeight: 600,
    fontSize: 13.5,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    transition: "all .15s",
  } satisfies CSSProperties,

  btnSmall: {
    padding: "5px 12px",
    borderRadius: 6,
    border: "none",
    background: T.accent,
    color: "#fff",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,

  card: {
    background: "rgba(255,255,255,.10)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.22)",
    boxShadow:
      "0 8px 32px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.18)",
    overflow: "hidden",
  } satisfies CSSProperties,

  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: T.muted,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    marginBottom: 16,
  } satisfies CSSProperties,
};
