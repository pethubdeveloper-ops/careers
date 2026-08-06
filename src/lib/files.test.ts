import { describe, expect, it } from "vitest";
import { fileToDataUrl, peso } from "./files";

describe("peso", () => {
  it("formats with the peso sign and thousands separators", () => {
    expect(peso(97015)).toBe("₱97,015");
    expect(peso(0)).toBe("₱0");
  });

  it("rounds to whole pesos", () => {
    expect(peso(1234.4)).toBe("₱1,234");
    expect(peso(1234.6)).toBe("₱1,235");
  });
});

describe("fileToDataUrl", () => {
  it("resolves a data URL for the uploaded file", async () => {
    const file = new File(["hello"], "receipt.txt", { type: "text/plain" });
    await expect(fileToDataUrl(file)).resolves.toMatch(/^data:text\/plain/);
  });
});
