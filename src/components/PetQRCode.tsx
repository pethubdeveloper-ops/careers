import { useEffect, useRef } from "react";
import QR from "qrcode";
import type { Pet } from "@/types";

/**
 * Real, scannable QR encoding the pet's membership number.
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
    QR.toCanvas(canvas, value, {
      width: size,
      margin: 0,
      errorCorrectionLevel: "H",
      color: { dark: "#0f172a", light: "#ffffff" },
    }).catch(() => {
      if (!cancelled) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
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
      <canvas ref={canvasRef} width={size} height={size} />
    </div>
  );
}
