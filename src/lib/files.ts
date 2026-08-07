/**
 * Reads a picked file into a data URL.
 *
 * The prototype stores these straight into localStorage. Replace this with an
 * upload to real object storage when a backend lands — the call sites only
 * need the resulting URL.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Longest edge kept when storing a photographed document. */
const MAX_DOCUMENT_EDGE = 1600;

/**
 * Reads an uploaded document, shrinking photographs on the way in.
 *
 * A phone camera produces 3–8 MB images. Stored raw as base64 that is roughly a
 * third larger again, which overruns the ~5 MB localStorage budget and loses
 * the upload silently. Resizing to a long edge of 1600px keeps an ID easily
 * readable at a fraction of the size. PDFs and anything non-image pass through
 * untouched.
 */
export async function readDocumentFile(
  file: File,
): Promise<{ data: string; name: string; type: string }> {
  const raw = await fileToDataUrl(file);
  if (!file.type.startsWith("image/")) {
    return { data: raw, name: file.name, type: file.type };
  }

  // Check for canvas support before touching the image: without it there is no
  // resizing to do, and environments that lack it (jsdom) never settle an
  // image load either.
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { data: raw, name: file.name, type: file.type };

  try {
    const img = await loadImage(raw);
    const scale = Math.min(
      1,
      MAX_DOCUMENT_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
    );
    if (scale === 1) return { data: raw, name: file.name, type: file.type };

    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL("image/jpeg", 0.85),
      name: file.name,
      type: "image/jpeg",
    };
  } catch {
    // An unreadable or exotic image still gets stored as uploaded.
    return { data: raw, name: file.name, type: file.type };
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // An image that neither loads nor errors must not stall the upload.
    const bail = setTimeout(
      () => reject(new Error("Image took too long to decode")),
      10_000,
    );
    img.onload = () => {
      clearTimeout(bail);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(bail);
      reject(new Error("Image could not be decoded"));
    };
    img.src = src;
  });
}

/** Philippine peso formatting used across the KPI strips and tables. */
export function peso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

/** Triggers a client-side download of a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
