import QR from "qrcode";
import type { Pet } from "@/types";

/**
 * How much of the code's width the centre logo occupies.
 *
 * Error-correction level H recovers roughly 30% of a damaged code; keeping the
 * logo near a fifth of the width leaves comfortable margin above what scanners
 * need, which is what makes the overlay safe.
 */
const LOGO_RATIO = 0.24;

/**
 * The value a pet's code encodes. The Loyalty Scanner looks pets up by
 * membership no. or id, so it is whichever of those is available.
 */
export function petQrValue(pet: Pet | null | undefined): string {
  return pet?.membershipNo || String(pet?.id ?? "");
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadLogo(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const logo = new Image();
    logo.onload = () => resolve(logo);
    logo.onerror = () => reject(new Error("Logo could not be loaded"));
    logo.src = "/logo.png";
  });
}

/**
 * Draws the badged code onto a canvas at `px` pixels square.
 *
 * Shared by the on-screen component and the export, so a downloaded code is
 * the same artwork staff are looking at — just bigger.
 */
export async function drawPetQr(
  canvas: HTMLCanvasElement,
  value: string,
  px: number,
): Promise<void> {
  await QR.toCanvas(canvas, value, {
    width: px,
    // One module of quiet zone, on top of the white frame around the canvas.
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const logo = await loadLogo();
  const box = px * LOGO_RATIO;
  const pad = box * 0.14;
  const origin = (px - box) / 2;

  // Punch a white tile out of the code so the mark reads cleanly and scanners
  // treat the area as a single light region.
  ctx.fillStyle = "#ffffff";
  roundedRect(
    ctx,
    origin - pad,
    origin - pad,
    box + pad * 2,
    box + pad * 2,
    box * 0.24,
  );
  ctx.fill();
  ctx.drawImage(logo, origin, origin, box, box);
}

/**
 * Renders a pet's code off-screen at print resolution and returns it as a PNG.
 *
 * Deliberately larger than anything shown on screen: a code that is printed on
 * a card or pasted into a chat should still scan after being scaled around.
 */
export async function petQrPng(
  pet: Pet | null | undefined,
  px = 1024,
): Promise<string> {
  const value = petQrValue(pet);
  if (!value) throw new Error("This pet has no membership number yet.");

  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  await drawPetQr(canvas, value, px);
  return canvas.toDataURL("image/png");
}

/** File name a saved code carries, so a folder of them stays sortable. */
export function petQrFilename(pet: Pet): string {
  const who = (pet.name || "pet").replace(/\s+/g, "-");
  return `QR-${who}-${pet.membershipNo || pet.id}.png`;
}
