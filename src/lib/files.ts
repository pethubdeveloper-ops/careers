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

/** Converts a stored data URL back into a Blob. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",");
  const type = header.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";

  if (!header.includes(";base64")) {
    return new Blob([decodeURIComponent(encoded ?? "")], { type });
  }

  const binary = atob(encoded ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

/**
 * A host that saves files on the page's behalf.
 *
 * The shared demo runs inside the claude.ai artifact viewer, which frames the
 * page with a sandbox that forbids downloads — a link click there is dropped
 * without a word. That viewer hands the page a save prompt instead. Nothing
 * else provides this, so the real app never takes the branch.
 */
interface SaveHost {
  save(request: { filename: string; data: Blob }): Promise<unknown>;
}

function saveHost(): SaveHost | undefined {
  return (window as Window & { claude?: { downloads?: SaveHost } }).claude
    ?.downloads;
}

/** Turns a host rejection into something worth showing a member of staff. */
function saveHostMessage(err: unknown): string | null {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "declined":
      // The viewer said no. That is an answer, not a failure.
      return null;
    case "rejected_extension":
    case "extension_not_enabled":
      return "The shared preview can only save images. Run the app to save this file.";
    case "too_large":
      return "That file is too large to save from the shared preview.";
    case "rate_limited":
      return "A save is already in progress — try again in a moment.";
    default:
      return "Could not save the file.";
  }
}

/**
 * Saves a stored data URL to disk. Resolves once the file is on its way, and
 * rejects with a message fit to show when it could not be saved.
 *
 * Goes via a Blob rather than putting the data URL straight on the link:
 * browsers cap and in places refuse very long data: URLs, and an object URL
 * downloads reliably at any size.
 */
export async function downloadDataUrl(
  dataUrl: string,
  filename: string,
): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);

  const host = saveHost();
  if (host) {
    try {
      await host.save({ filename, data: blob });
    } catch (err) {
      const message = saveHostMessage(err);
      if (message) throw new Error(message);
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the download a tick to start before the URL is reclaimed.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
