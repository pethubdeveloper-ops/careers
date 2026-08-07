import { useMemo, useRef, useState } from "react";
import { Field, Icon, Icons, Modal, PageHeader, Toast } from "@/components";
import { T, css } from "@/theme";
import { shortBranch } from "@/lib/branch";
import { fileToDataUrl } from "@/lib/files";
import type { Db, Pet } from "@/types";

interface ReleaseForm {
  membershipNo: string;
  qr: string | null;
}

/** Names a saved pet photo after the pet, so print files stay identifiable. */
function petPhotoFilename(pet: Pet): string {
  const ext = String(pet.photo || "").includes("image/png") ? "png" : "jpg";
  return `PetPhoto-${pet.name.replace(/\s+/g, "-")}.${ext}`;
}

export function CardRequestsPage({ db }: { db: Db }) {
  const { pets, setPets, clients, branches, registrations } = db;

  const [toast, setToast] = useState<string | null>(null);
  const [fBranch, setFBranch] = useState("All");
  const [relModal, setRelModal] = useState<Pet | null>(null);
  const [relForm, setRelForm] = useState<ReleaseForm>({
    membershipNo: "",
    qr: null,
  });
  const qrInput = useRef<HTMLInputElement>(null);

  const clientOf = (id: number) => clients.find((c) => c.id === id);

  const pending = useMemo(
    () =>
      pets
        .filter((p) => p.hasCard && p.printStatus === "Pending")
        .filter((p) => fBranch === "All" || p.branch === fBranch)
        .map((p) => ({ ...p, owner: clients.find((c) => c.id === p.clientId) })),
    [pets, clients, fBranch],
  );

  const approvedClients = useMemo(
    () =>
      registrations
        .filter((r) => r.status === "Approved" && r.accountType === "Client")
        .filter((r) => fBranch === "All" || r.branch === fBranch),
    [registrations, fBranch],
  );

  function openRelease(p: Pet) {
    setRelForm({ membershipNo: p.membershipNo || "", qr: p.qr || null });
    setRelModal(p);
  }

  function confirmRelease() {
    if (!relModal) return;
    const id = relModal.id;
    setPets((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              printStatus: "Printed",
              membershipNo: relForm.membershipNo || p.membershipNo,
              qr: relForm.qr || p.qr,
            }
          : p,
      ),
    );
    setRelModal(null);
    setToast("Loyalty card released.");
  }

  async function uploadQR(file: File | undefined) {
    if (!file) return;
    const qr = await fileToDataUrl(file);
    setRelForm((f) => ({ ...f, qr }));
  }

  function decline(id: number) {
    setPets((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, hasCard: false, printStatus: "N/A", membershipNo: "" }
          : p,
      ),
    );
    setToast("Request declined.");
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <PageHeader title="Card Requests">
        <select
          value={fBranch}
          onChange={(e) => setFBranch(e.target.value)}
          style={{
            ...css.input,
            width: "auto",
            padding: "9px 14px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <option value="All">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.name}>
              {shortBranch(b.name)}
            </option>
          ))}
        </select>
      </PageHeader>

      {/* ── Pending requests ── */}
      <div style={{ ...css.card, padding: "22px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <p style={{ ...css.sectionLabel, marginBottom: 0 }}>
            Pending Loyalty Card Requests
          </p>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: pending.length ? T.warn : T.accent,
              borderRadius: 99,
              padding: "3px 12px",
            }}
          >
            {pending.length} pending
          </span>
        </div>

        {pending.length === 0 ? (
          <div
            style={{ padding: "48px", textAlign: "center", color: T.subtle }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `${T.accent}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Icon d={Icons.check} size={26} color={T.accent} stroke />
            </div>
            No pending card requests. When a client avails a loyalty card, it
            appears here for release.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pending.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: `1px solid ${T.warn}33`,
                  background: `${T.warn}0d`,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${T.accent}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={`Photo of ${p.name}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Icon d={Icons.paw} size={19} color={T.accent} stroke />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                    {p.name}{" "}
                    <span
                      style={{
                        color: T.muted,
                        fontWeight: 400,
                        fontSize: 12.5,
                      }}
                    >
                      · {p.breed || p.species} · {p.membershipNo || "—"}
                    </span>
                  </p>
                  <p style={{ fontSize: 12, color: T.muted }}>
                    {p.owner?.name || "—"} · {shortBranch(p.branch)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => openRelease(p)}
                    style={{
                      ...css.btnPrimary,
                      padding: "7px 16px",
                      fontSize: 12.5,
                      gap: 6,
                    }}
                  >
                    <Icon d={Icons.check} size={14} color="#fff" stroke />{" "}
                    Release Card
                  </button>
                  <button
                    onClick={() => decline(p.id)}
                    style={{
                      ...css.btnSecondary,
                      padding: "7px 14px",
                      fontSize: 12.5,
                      gap: 6,
                      borderColor: "rgba(248,113,113,.4)",
                      color: T.danger,
                    }}
                  >
                    <Icon d={Icons.x} size={14} color={T.danger} stroke />{" "}
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Newly approved clients ── */}
      <div style={{ ...css.card, padding: "22px 24px", marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <p style={{ ...css.sectionLabel, marginBottom: 2 }}>
              Newly Approved Clients
            </p>
            <p style={{ fontSize: 12.5, color: T.muted }}>
              New client accounts — prepare their loyalty cards.
            </p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: approvedClients.length ? T.accent : T.subtle,
              borderRadius: 99,
              padding: "3px 12px",
            }}
          >
            {approvedClients.length} approved
          </span>
        </div>

        {approvedClients.length === 0 ? (
          <div
            style={{ padding: "36px", textAlign: "center", color: T.subtle }}
          >
            No newly approved clients yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approvedClients.map((r) => {
              const rec = clients.find(
                (c) => (c.email || "").toLowerCase() === r.email.toLowerCase(),
              );
              const theirPets = rec
                ? pets.filter((p) => p.clientId === rec.id)
                : [];
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 16px",
                    borderRadius: 12,
                    border: `1px solid ${T.accent}33`,
                    background: `${T.accent}0d`,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${T.accent}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={Icons.account} size={19} color={T.accent} stroke />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                      {r.name}{" "}
                      <span
                        style={{
                          color: T.muted,
                          fontWeight: 400,
                          fontSize: 12.5,
                        }}
                      >
                        · {r.email}
                      </span>
                    </p>
                    <p style={{ fontSize: 12, color: T.muted }}>
                      {shortBranch(r.branch)}
                      {theirPets.length
                        ? ` · ${theirPets.length} pet${theirPets.length !== 1 ? "s" : ""}: ${theirPets
                            .map((p) => p.name)
                            .join(", ")}`
                        : " · no pets yet"}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.accentDark,
                      background: `${T.accent}18`,
                      borderRadius: 99,
                      padding: "4px 10px",
                      flexShrink: 0,
                    }}
                  >
                    {theirPets.filter((p) => p.hasCard).length}/
                    {theirPets.length} card{theirPets.length !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Release modal ── */}
      {relModal &&
        (() => {
          const owner = clientOf(relModal.clientId);
          return (
            <Modal
              title="Release Loyalty Card"
              onClose={() => setRelModal(null)}
              width={500}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: T.surfaceAlt,
                  border: `1px solid ${T.border}`,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 11,
                    background: `${T.accent}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {relModal.photo ? (
                    <img
                      src={relModal.photo}
                      alt={`Photo of ${relModal.name}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 11,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Icon d={Icons.paw} size={22} color={T.accent} stroke />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                    {relModal.name}
                  </p>
                  <p style={{ fontSize: 12.5, color: T.muted }}>
                    {relModal.breed || relModal.species} · {relModal.gender}
                    {relModal.age ? ` · ${relModal.age} yr` : ""}
                  </p>
                </div>
              </div>

              {/* The photo the owner submitted — this is what gets printed. */}
              <Field
                label="Pet Photo"
                hint={
                  relModal.photo
                    ? "Submitted by the owner. Save it to send to the printer."
                    : undefined
                }
              >
                {relModal.photo ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <img
                      src={relModal.photo}
                      alt={`Photo of ${relModal.name}`}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 12,
                        objectFit: "cover",
                        border: `1px solid ${T.border}`,
                        background: "#fff",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        flex: 1,
                      }}
                    >
                      <a
                        href={relModal.photo}
                        download={petPhotoFilename(relModal)}
                        style={{
                          ...css.btnSecondary,
                          justifyContent: "center",
                          textDecoration: "none",
                          gap: 8,
                        }}
                      >
                        <Icon
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                          size={15}
                          color={T.muted}
                          stroke
                        />
                        Download photo
                      </a>
                      <a
                        href={relModal.photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...css.btnSecondary,
                          justifyContent: "center",
                          textDecoration: "none",
                          gap: 8,
                        }}
                      >
                        <Icon
                          d={Icons.eye}
                          size={15}
                          color={T.muted}
                          stroke
                        />
                        Open full size
                      </a>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: 12.5,
                      color: T.danger,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <Icon d={Icons.alert} size={14} color={T.danger} stroke />
                    No photo submitted — ask the owner before printing.
                  </p>
                )}
              </Field>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px 18px",
                  marginBottom: 16,
                }}
              >
                {(
                  [
                    ["Owner", owner?.name || "—"],
                    ["Branch", shortBranch(relModal.branch)],
                    ["Contact", owner?.contact || "—"],
                    ["Requested", relModal.membershipDate || "—"],
                  ] as Array<[string, string]>
                ).map(([label, val]) => (
                  <div key={label}>
                    <p
                      style={{
                        fontSize: 11,
                        color: T.muted,
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{ fontSize: 13, fontWeight: 600, color: T.text }}
                    >
                      {val}
                    </p>
                  </div>
                ))}
              </div>

              <Field label="Membership Number">
                <input
                  value={relForm.membershipNo}
                  onChange={(e) =>
                    setRelForm((f) => ({ ...f, membershipNo: e.target.value }))
                  }
                  placeholder="e.g. PH-0027"
                  style={css.input}
                  // No autoFocus: focusing a field below the fold scrolls the
                  // dialog past the photo the reviewer is meant to check.
                />
              </Field>

              <Field label="QR Code">
                <input
                  ref={qrInput}
                  type="file"
                  accept="image/*"
                  onChange={(e) => void uploadQR(e.target.files?.[0])}
                  style={{ display: "none" }}
                />
                {relForm.qr ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <img
                      src={relForm.qr}
                      alt="QR"
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 9,
                        objectFit: "cover",
                        border: `1px solid ${T.border}`,
                        background: "#fff",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => qrInput.current?.click()}
                        style={{
                          ...css.btnSecondary,
                          padding: "7px 14px",
                          fontSize: 12.5,
                        }}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => setRelForm((f) => ({ ...f, qr: null }))}
                        style={{
                          ...css.btnSecondary,
                          padding: "7px 14px",
                          fontSize: 12.5,
                          borderColor: "rgba(248,113,113,.4)",
                          color: T.danger,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => qrInput.current?.click()}
                    style={{
                      ...css.btnSecondary,
                      width: "100%",
                      justifyContent: "center",
                      gap: 7,
                      padding: "14px 0",
                      borderStyle: "dashed",
                    }}
                  >
                    <Icon d={Icons.camera} size={16} color={T.muted} stroke />{" "}
                    Upload QR Code Image
                  </button>
                )}
              </Field>

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  onClick={() => setRelModal(null)}
                  style={{
                    ...css.btnSecondary,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRelease}
                  disabled={!relForm.membershipNo}
                  style={{
                    ...css.btnPrimary,
                    flex: 1,
                    justifyContent: "center",
                    gap: 6,
                    opacity: relForm.membershipNo ? 1 : 0.5,
                  }}
                >
                  <Icon d={Icons.check} size={14} color="#fff" stroke /> Release
                  Card
                </button>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}
