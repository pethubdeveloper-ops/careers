import { describe, expect, it } from "vitest";
import { dataUrlToBlob, fileToDataUrl, peso } from "./files";

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

describe("dataUrlToBlob", () => {
  it("recovers the bytes and type from a base64 data URL", async () => {
    // "hi" base64-encoded
    const blob = dataUrlToBlob("data:image/png;base64,aGk=");
    expect(blob.type).toBe("image/png");
    expect(await blob.text()).toBe("hi");
  });

  it("handles a plain, unencoded data URL", async () => {
    const blob = dataUrlToBlob("data:text/plain,hello%20there");
    expect(blob.type).toBe("text/plain");
    expect(await blob.text()).toBe("hello there");
  });

  it("falls back to a generic type when none is declared", () => {
    expect(dataUrlToBlob("data:,anything").type).toBe(
      "application/octet-stream",
    );
  });
});
