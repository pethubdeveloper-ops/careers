import type { IdDocumentFields } from "@/types";

/** Anything carrying an ID document — a registration or a client. */
export interface IdHolder extends IdDocumentFields {
  name: string;
}

export const isPdfId = (doc: IdHolder) =>
  String(doc.idType || "").includes("pdf");

/**
 * A saved ID keeps its original filename where there is one, and otherwise gets
 * a name that identifies whose document it is.
 */
export function idFilename(doc: IdHolder): string {
  if (doc.idName) return doc.idName;
  return `ID-${doc.name.replace(/\s+/g, "-")}.${isPdfId(doc) ? "pdf" : "png"}`;
}
