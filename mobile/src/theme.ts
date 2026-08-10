/**
 * Design tokens, carried over from the web app so both surfaces stay the same
 * product. The values are identical; only the shape differs — React Native has
 * no cascade, so shared style objects take the place of CSS classes.
 */
export const T = {
  bg: "#0f3d2e",
  surface: "#17513c",
  surfaceAlt: "#1c5f46",
  card: "#1a5941",
  border: "rgba(255,255,255,.12)",
  borderMid: "rgba(255,255,255,.2)",
  text: "#f2fbf6",
  muted: "#a5d3c1",
  subtle: "#7fb8a1",
  accent: "#1eb87f",
  accentDeep: "#159c69",
  info: "#4cc9f0",
  warn: "#f7b955",
  danger: "#f87171",
  gold: "#e9d9a0",
} as const;

/** Spacing scale — every gap in the app is one of these. */
export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const TYPE = {
  h1: { fontSize: 24, fontWeight: "800" },
  h2: { fontSize: 18, fontWeight: "700" },
  h3: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "400" },
  label: { fontSize: 12, fontWeight: "600" },
  tiny: { fontSize: 11, fontWeight: "600" },
} as const;
