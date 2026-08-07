import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dataUrlToBlob,
  downloadDataUrl,
  fileToDataUrl,
  peso,
} from "./files";

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

describe("downloadDataUrl", () => {
  const PHOTO = "data:image/jpeg;base64,aGk=";

  /** Stands in for the claude.ai artifact viewer's save prompt. */
  function withSaveHost(save: (r: unknown) => Promise<unknown>) {
    (window as unknown as { claude: unknown }).claude = { downloads: { save } };
  }

  afterEach(() => {
    delete (window as unknown as { claude?: unknown }).claude;
  });

  it("hands the file to the host when the page is framed by one", async () => {
    const save = vi.fn().mockResolvedValue({ status: "saved" });
    withSaveHost(save);

    await downloadDataUrl(PHOTO, "PetPhoto-Koohii.jpg");

    expect(save).toHaveBeenCalledOnce();
    const request = save.mock.calls[0][0] as { filename: string; data: Blob };
    expect(request.filename).toBe("PetPhoto-Koohii.jpg");
    expect(await request.data.text()).toBe("hi");
  });

  it("stays quiet when the viewer declines — that is an answer", async () => {
    withSaveHost(vi.fn().mockRejectedValue({ code: "declined" }));
    await expect(downloadDataUrl(PHOTO, "photo.jpg")).resolves.toBeUndefined();
  });

  it("explains a refused file type rather than failing silently", async () => {
    withSaveHost(vi.fn().mockRejectedValue({ code: "rejected_extension" }));
    await expect(downloadDataUrl(PHOTO, "id.pdf")).rejects.toThrow(
      /can only save images/i,
    );
  });

  it("reports an unrecognised failure instead of swallowing it", async () => {
    withSaveHost(vi.fn().mockRejectedValue({ code: "something_new" }));
    await expect(downloadDataUrl(PHOTO, "photo.jpg")).rejects.toThrow(
      /Could not save/i,
    );
  });

  it("falls back to a download link when no host is present", async () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    // jsdom has no object URLs of its own.
    URL.createObjectURL = vi.fn(() => "blob:stub");
    URL.revokeObjectURL = vi.fn();

    await downloadDataUrl(PHOTO, "photo.jpg");

    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});
