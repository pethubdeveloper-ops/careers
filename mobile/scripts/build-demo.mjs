/**
 * Folds `expo export --platform web` into one self-contained HTML page, framed
 * as a phone, for publishing as a shareable demo.
 *
 * Everything has to be inlined: the page is served under a strict CSP that
 * blocks requests to any other host, and relative paths would not resolve.
 */
import fs from "node:fs";
import path from "node:path";

const EXPORT_DIR = process.argv[2];
const OUT = process.argv[3];

if (!EXPORT_DIR || !OUT) {
  console.error("usage: build-demo.mjs <expo-export-dir> <out.html>");
  process.exit(1);
}

const jsDir = path.join(EXPORT_DIR, "_expo/static/js/web");
const html = fs.readFileSync(path.join(EXPORT_DIR, "index.html"), "utf8");

// The entry is whichever bundle the export's own page boots, and it has to run
// first: it defines the module registry every other chunk registers into.
// Anything else is lazily imported (the barcode reader), so defining it after
// the app has started is harmless.
const entryName = html.match(/js\/web\/([^"']+\.js)/)?.[1];
if (!entryName) throw new Error("could not find the entry bundle in index.html");

const rest = fs.readdirSync(jsDir).filter((f) => f !== entryName);
const order = [entryName, ...rest];

let js = order
  .map((f) => fs.readFileSync(path.join(jsDir, f), "utf8"))
  .join("\n;\n");

// Assets are referenced by absolute URL; embed each one it actually asks for.
const assetRoot = path.join(EXPORT_DIR, "assets");
for (const asset of walk(assetRoot)) {
  const url = "/" + path.relative(EXPORT_DIR, asset).split(path.sep).join("/");
  if (!js.includes(url)) continue;
  const mime = asset.endsWith(".png") ? "image/png" : "application/octet-stream";
  const data = fs.readFileSync(asset).toString("base64");
  js = js.split(url).join(`data:${mime};base64,${data}`);
}

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const page = `<title>Pet Hub Rewards — mobile app</title>
<style>
  :root {
    color-scheme: light;
    /* A neutral pulled toward the app's green, so the device sits in a
       related world rather than on an unrelated grey. */
    --ground: #eaf1ed;
    --panel: #ffffff;
    --ink: #0f241c;
    --muted: #4e6c60;
    --hairline: #cfdfd7;
    --accent: #12805a;
    --bezel: #0a1712;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --ground: #0a1611;
      --panel: #12241c;
      --ink: #e6f2ec;
      --muted: #93b2a3;
      --hairline: #1e3a2e;
      --accent: #3ed9a0;
      --bezel: #05100c;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --ground: #0a1611;
    --panel: #12241c;
    --ink: #e6f2ec;
    --muted: #93b2a3;
    --hairline: #1e3a2e;
    --accent: #3ed9a0;
    --bezel: #05100c;
  }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font: 400 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 24px 64px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 48px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .wrap { grid-template-columns: minmax(0, 1fr); gap: 32px; justify-items: center; }
    .notes { justify-self: stretch; }
  }

  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 6px;
  }
  h1 {
    font-size: clamp(24px, 3vw, 32px);
    line-height: 1.15;
    letter-spacing: -.02em;
    margin: 0 0 12px;
    text-wrap: balance;
  }
  .lede { color: var(--muted); margin: 0 0 28px; max-width: 62ch; }

  /* ── device ── */
  .phone {
    width: 414px;
    padding: 12px;
    background: var(--bezel);
    border-radius: 52px;
    box-shadow: 0 30px 70px rgba(6, 30, 22, .28), 0 2px 0 rgba(255,255,255,.06) inset;
  }
  .screen {
    position: relative;
    width: 390px;
    height: 844px;
    border-radius: 40px;
    overflow: hidden;
    background: #0f3d2e;
  }
  .notch {
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 132px; height: 26px;
    background: var(--bezel);
    border-radius: 0 0 16px 16px;
    z-index: 10;
    pointer-events: none;
  }
  #root { display: flex; height: 100%; }

  /* ── notes ── */
  .notes { display: flex; flex-direction: column; gap: 24px; max-width: 46ch; }
  .card {
    background: var(--panel);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    padding: 20px 22px;
  }
  .card h2 {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 12px;
  }
  ol, ul { margin: 0; padding-left: 20px; }
  li { margin-bottom: 8px; }
  li:last-child { margin-bottom: 0; }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: .88em;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--accent);
    padding: 2px 6px;
    border-radius: 5px;
  }
  .caveat { border-left: 3px solid var(--accent); }
  .caveat p { margin: 0 0 10px; color: var(--muted); font-size: 14.5px; }
  .caveat p:last-child { margin-bottom: 0; }
  .caveat strong { color: var(--ink); font-weight: 600; }
</style>

<div class="wrap">
  <div>
    <div class="phone">
      <div class="screen">
        <div class="notch"></div>
        <div id="root"></div>
      </div>
    </div>
  </div>

  <div class="notes">
    <div>
      <p class="eyebrow">Live demo</p>
      <h1>Pet Hub Rewards, on a phone</h1>
      <p class="lede">
        The real Expo app running in a browser at phone size. Same code that
        builds for iOS and Android — and the same expiry, points and card rules
        as the web portal, because both import them from one place.
      </p>
    </div>

    <div class="card">
      <h2>Sign in as staff</h2>
      <ol>
        <li>Email <code>admin@pethub.ph</code>, any password</li>
        <li><strong>Clients</strong> → Add client, name them, pick a branch, give them a pet</li>
        <li><strong>Scan</strong> → type the pet's name → Look up, then record a sale</li>
      </ol>
    </div>

    <div class="card">
      <h2>Then as the pet owner</h2>
      <ol>
        <li>Sign out, then sign in with the email you gave that client</li>
        <li>Open their pet → <strong>Avail loyalty card</strong></li>
        <li>Sign back in as staff — the request is waiting under <strong>Requests</strong></li>
      </ol>
    </div>

    <div class="card caveat">
      <h2>What a browser can't show</h2>
      <p>
        <strong>Scan QR code</strong> and the pet-photo picker need a real
        device. On a phone they open the camera and photo library; here they
        do nothing.
      </p>
      <p>
        Records live in this browser only. Clearing site data starts it over,
        and nothing here reaches the web portal's demo.
      </p>
    </div>
  </div>
</div>

<script>${js}</script>
`;

fs.writeFileSync(OUT, page);
console.log("wrote", OUT, (fs.statSync(OUT).size / 1024 / 1024).toFixed(2), "MB");
