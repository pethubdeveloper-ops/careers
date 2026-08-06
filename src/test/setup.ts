import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom has no canvas, which the QR component and card export rely on.
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => null,
) as unknown as HTMLCanvasElement["getContext"];
