import { useEffect, useRef } from "react";
import { drawPetQr, petQrValue } from "@/lib/petQr";
import type { Pet } from "@/types";

/**
 * Pixel density the code is rendered at, independent of its display size.
 *
 * A canvas drawn at its CSS size looks soft on retina screens and worse again
 * when printed, so the code is drawn large and scaled down for display.
 */
const RENDER_SCALE = 4;

/**
 * Real, scannable QR encoding the pet's membership number, badged with the Pet
 * Hub logo.
 */
export function PetQRCode({
  pet,
  size = 120,
}: {
  pet: Pet | null | undefined;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const value = petQrValue(pet);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    let cancelled = false;

    drawPetQr(canvas, value, size * RENDER_SCALE)
      .then(() => {
        if (cancelled) return;
        // qrcode sizes the element to the render resolution; show it at the
        // requested size so the extra pixels become sharpness.
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      })
      .catch(() => {
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
