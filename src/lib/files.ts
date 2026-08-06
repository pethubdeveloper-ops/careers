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
