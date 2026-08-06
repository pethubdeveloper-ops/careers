import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric display from 0 to its target whenever the target changes.
 * Any leading non-numeric prefix (e.g. "₱") is preserved and non-numeric values
 * pass straight through.
 */
export function useCountUp(target: string | number): string | number {
  const [val, setVal] = useState<string | number>(target);
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const str = String(target);
    const num = parseFloat(str.replace(/[^0-9.]/g, ""));

    if (isNaN(num) || prev.current === str) {
      setVal(target);
      return;
    }
    prev.current = str;

    const prefix = str.match(/^[^0-9]*/)?.[0] ?? "";
    const hasComma = str.includes(",") || num >= 1000;
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;

    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = Math.round(num * eased);
      setVal(prefix + (hasComma ? n.toLocaleString() : n));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return val;
}
