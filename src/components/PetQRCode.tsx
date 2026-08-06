import { useEffect, useRef } from "react";
import QR from "qrcode";
import type { Pet } from "@/types";

/**
 * Pixel density the code is rendered at, independent of its display size.
 *
 * A canvas drawn at its CSS size looks soft on retina screens and worse again
 * when printed, so the code is drawn large and scaled down for display.
 */
const RENDER_SCALE = 4;

/**
 * How much of the code's width the centre logo occupies.
 *
 * Error-correction level H recovers roughly 30% of a damaged code; keeping the
 * logo near a fifth of the width leaves comfortable margin above what scanners
 * need, which is what makes the overlay safe.
 */
const LOGO_RATIO = 0.24;

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

/**
 * Real, scannable QR encoding the pet's membership number, badged with the Pet
 * Hub logo.
 *
 * The Loyalty Scanner looks pets up by membership no. or id, so the encoded
 * value is whichever of those is available.
 */
export function PetQRCode({
  pet,
  size = 120,
}: {
  pet: Pet | null | undefined;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const value = pet?.membershipNo || String(pet?.id ?? "");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    let cancelled = false;
    const px = size * RENDER_SCALE;

    const draw = async () => {
      await QR.toCanvas(canvas, value, {
        width: px,
        // One module of quiet zone, on top of the white frame around the canvas.
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      if (cancelled) return;

      // qrcode sizes the element to the render resolution; show it at the
      // requested size so the extra pixels become sharpness.
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const logo = new Image();
      logo.onload = () => {
        if (cancelled) return;

        const box = px * LOGO_RATIO;
        const pad = box * 0.14;
        const origin = (px - box) / 2;

        // Punch a white tile out of the code so the mark reads cleanly and
        // scanners treat the area as a single light region.
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
      };
      logo.src = "/logo.png";
    };

    draw().catch(() => {
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!pet) return null;

  return (
    <div
      style={{
        display: "inline-block",
        padding: 6,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        lineHeight: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        width={size * RENDER_SCALE}
        height={size * RENDER_SCALE}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
