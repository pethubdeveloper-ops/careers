import { useEffect, useRef } from "react";

/**
 * Only the topmost dialog reacts to Escape, so pressing it with one dialog
 * open on top of another dismisses them one at a time rather than both at once.
 */
const escapeStack: (() => void)[] = [];

/**
 * Closes a dialog when Escape is pressed.
 *
 * Every dialog needs a way out that does not depend on finding a button: a
 * dialog taller than the window can put its close button out of reach.
 */
export function useCloseOnEscape(onClose: () => void) {
  // Callers pass a fresh arrow each render; keep the latest in a ref so the
  // listener is bound once and never fires a stale callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const close = () => onCloseRef.current();
    escapeStack.push(close);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (escapeStack.at(-1) !== close) return;
      e.stopPropagation();
      close();
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      escapeStack.splice(escapeStack.indexOf(close), 1);
    };
  }, []);
}
