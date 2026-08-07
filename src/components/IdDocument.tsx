import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Icons } from "./icons";
import { Modal } from "./primitives";
import { T, css } from "@/theme";
import { downloadDataUrl } from "@/lib/files";
import { idFilename, isPdfId as isPdf, type IdHolder } from "@/lib/idDocument";

/**
 * Small preview of a submitted ID. Renders a button when it can be opened,
 * and a plain marker when the record has no document.
 */
export function IdThumbnail({
  doc,
  size = 38,
  onOpen,
  onMissing,
}: {
  doc: IdHolder;
  size?: number;
  onOpen?: () => void;
  /** Offered when there is no document — e.g. open the record to upload one. */
  onMissing?: () => void;
}) {
  // No document: say so in words rather than showing an icon that looks like a
  // picture failing to load, and offer the way to fix it where there is one.
  if (!doc.idImage) {
    const label = (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          background: `${T.danger}12`,
          color: T.danger,
          whiteSpace: "nowrap",
        }}
      >
        <Icon d={Icons.alert} size={13} color={T.danger} stroke />
        No ID
      </span>
    );

    if (!onMissing) return <span title="No ID on file">{label}</span>;

    return (
      <button
        onClick={onMissing}
        aria-label={`Add an ID for ${doc.name}`}
        title={`No ID on file — add one for ${doc.name}`}
        style={{
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  const inner = isPdf(doc) ? (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 9,
        background: `${T.accent}18`,
      }}
    >
      <Icon d={Icons.edit} size={size * 0.45} color={T.accent} stroke />
    </span>
  ) : (
    <img
      src={doc.idImage}
      alt={`ID submitted by ${doc.name}`}
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        objectFit: "cover",
        display: "block",
        background: "#fff",
      }}
    />
  );

  if (!onOpen) return inner;

  return (
    <button
      onClick={onOpen}
      // Without this the button inherits its name from the image's alt text.
      // Deliberately not "View ID" — that is the adjacent text button, and two
      // controls with the same name are ambiguous to screen readers.
      aria-label={`Open ${doc.name}'s ID`}
      title={`Open ${doc.name}'s ID`}
      style={{
        padding: 0,
        border: `1px solid ${T.borderMid}`,
        borderRadius: 10,
        background: "none",
        cursor: "pointer",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      {inner}
    </button>
  );
}

/**
 * Full-size ID viewer with a download. `actions` lets a caller add decisions
 * (approve/deny) so a reviewer can act while looking at the document.
 */
export function IdViewerModal({
  doc,
  subtitle,
  onClose,
  actions,
}: {
  doc: IdHolder;
  subtitle?: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  const [saveError, setSaveError] = useState<string | null>(null);

  function save() {
    if (!doc.idImage) return;
    setSaveError(null);
    downloadDataUrl(doc.idImage, idFilename(doc)).catch((err: Error) =>
      setSaveError(err.message),
    );
  }

  return (
    <Modal title={`ID — ${doc.name}`} onClose={onClose} width={560}>
      {subtitle && (
        <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>
          {subtitle}
        </p>
      )}

      {isPdf(doc) ? (
        <iframe
          src={doc.idImage ?? undefined}
          title={`ID submitted by ${doc.name}`}
          style={{
            width: "100%",
            height: 420,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            background: "#fff",
          }}
        />
      ) : (
        <img
          src={doc.idImage ?? undefined}
          alt={`ID submitted by ${doc.name}`}
          style={{
            width: "100%",
            maxHeight: 460,
            objectFit: "contain",
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bg,
          }}
        />
      )}

      <button
        type="button"
        onClick={save}
        style={{
          ...css.btnSecondary,
          width: "100%",
          justifyContent: "center",
          marginTop: 14,
          gap: 8,
        }}
      >
        <Icon
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
          size={15}
          color={T.muted}
          stroke
        />
        Download {idFilename(doc)}
      </button>

      {saveError && (
        <p
          role="alert"
          style={{
            fontSize: 12,
            color: T.danger,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          {saveError}
        </p>
      )}

      {actions}
    </Modal>
  );
}
