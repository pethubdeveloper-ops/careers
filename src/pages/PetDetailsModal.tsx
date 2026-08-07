import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Badge,
  Field,
  Icon,
  Icons,
  PetQRCode,
  Toast,
  petQrFilename,
  petQrPng,
} from "@/components";
import { T, css } from "@/theme";
import {
  copyImageToClipboard,
  downloadDataUrl,
  fileToDataUrl,
} from "@/lib/files";
import type { Client, Pet } from "@/types";

const SPECIES = [
  "Dog",
  "Cat",
  "Bird",
  "Rabbit",
  "Fish",
  "Hamster",
  "Guinea Pig",
  "Reptile",
  "Other",
];
const GENDERS = ["Male", "Female"];

const inpSm: CSSProperties = { ...css.input, fontSize: 13, padding: "7px 10px" };

type NewPetDraft = Pick<
  Pet,
  | "name"
  | "species"
  | "breed"
  | "gender"
  | "age"
  | "weight"
  | "color"
  | "birthday"
  | "notes"
  | "hasCard"
>;

const EMPTY_PET: NewPetDraft = {
  name: "",
  species: "Dog",
  breed: "",
  gender: "Male",
  age: "",
  weight: "",
  color: "",
  birthday: "",
  notes: "",
  hasCard: false,
};

function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid ${T.border}`,
        fontSize: 13.5,
      }}
    >
      <span style={{ color: T.muted, fontWeight: 500, minWidth: 120 }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, color: T.text, textAlign: "right" }}>
        {value || <span style={{ color: T.subtle }}>—</span>}
      </span>
    </div>
  );
}

/**
 * Declared at module scope on purpose: defining it inside the modal would
 * remount every input on each keystroke and steal focus, since edits save
 * as you type.
 */
function EditField({
  label,
  field,
  type = "text",
  options,
  value,
  onChange,
}: {
  label: string;
  field: keyof Pet;
  type?: string;
  options?: string[];
  value: string;
  onChange: (field: keyof Pet, val: string) => void;
}) {
  return (
    <Field label={label}>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          style={inpSm}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          style={inpSm}
        />
      )}
    </Field>
  );
}

export function PetDetailsModal({
  client,
  pets,
  setPets,
  onClose,
}: {
  client: Client;
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  onClose: () => void;
}) {
  const currentPets = pets.filter((p) => p.clientId === client.id);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(
    currentPets[0] || null,
  );
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Pet>>({});
  const [addingPet, setAddingPet] = useState(false);
  const [newPet, setNewPet] = useState<NewPetDraft>(EMPTY_PET);
  const [toast, setToast] = useState<string | null>(null);

  function startEdit() {
    if (!selectedPet) return;
    setEditForm({ ...selectedPet });
    setEditing(true);
  }

  async function saveQr(pet: Pet) {
    try {
      await downloadDataUrl(await petQrPng(pet), petQrFilename(pet));
      setToast("QR code saved.");
    } catch (err) {
      setToast((err as Error).message);
    }
  }

  async function copyQr(pet: Pet) {
    try {
      await copyImageToClipboard(await petQrPng(pet));
      setToast("QR code copied.");
    } catch (err) {
      setToast((err as Error).message);
    }
  }

  function deletePet(id: number) {
    setPets((prev) => prev.filter((p) => p.id !== id));
    setSelectedPet(currentPets.filter((p) => p.id !== id)[0] || null);
    setToast("Pet removed.");
  }

  function saveNewPet() {
    if (!newPet.name.trim()) return;
    const created: Pet = {
      ...newPet,
      id: Date.now(),
      clientId: client.id,
      branch: client.branch,
      email: client.email,
      membershipNo: "",
      photo: null,
      membershipDate: new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }),
      printStatus: newPet.hasCard ? "Pending" : "N/A",
    };
    setPets((prev) => [...prev, created]);
    setSelectedPet(created);
    setAddingPet(false);
    setNewPet(EMPTY_PET);
    setToast("Pet registered.");
  }

  /** Edits persist on every keystroke — there is no explicit save. */
  function applyEdit(field: keyof Pet, val: string) {
    const updated = { ...editForm, [field]: val } as Pet;
    setEditForm(updated);
    if (updated.name) {
      setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPet(updated);
    }
  }

  async function uploadPhoto(file: File | undefined) {
    if (!file || !selectedPet) return;
    const photo = await fileToDataUrl(file);
    const updated = { ...selectedPet, photo };
    setSelectedPet(updated);
    setPets((prev) => prev.map((p) => (p.id === selectedPet.id ? updated : p)));
  }

  function setMembershipNo(val: string) {
    if (!selectedPet) return;
    setPets((prev) =>
      prev.map((p) =>
        p.id === selectedPet.id ? { ...p, membershipNo: val } : p,
      ),
    );
    setSelectedPet((prev) => (prev ? { ...prev, membershipNo: val } : prev));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.55)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(2px)",
      }}
    >
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <div
        style={{
          ...css.card,
          width: "100%",
          maxWidth: 720,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Client
            </p>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: T.text,
                marginTop: 2,
              }}
            >
              {client.name}
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setAddingPet(true);
                setSelectedPet(null);
                setEditing(false);
              }}
              style={{
                ...css.btnPrimary,
                padding: "7px 14px",
                fontSize: 12.5,
                gap: 6,
              }}
            >
              <Icon d={Icons.plus} size={13} color="#fff" stroke /> Add Pet
            </button>
            <button
              onClick={onClose}
              style={{ ...css.btnSecondary, padding: "7px 10px" }}
            >
              <Icon d={Icons.x} size={15} color={T.muted} stroke />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* ── Pet list ── */}
          <div
            style={{
              width: 180,
              borderRight: `1px solid ${T.border}`,
              overflowY: "auto",
              flexShrink: 0,
              padding: "12px 0",
            }}
          >
            {currentPets.length === 0 && !addingPet && (
              <p
                style={{
                  fontSize: 12.5,
                  color: T.subtle,
                  padding: "12px 16px",
                  lineHeight: 1.5,
                }}
              >
                No pets yet.
                <br />
                Click Add Pet.
              </p>
            )}
            {currentPets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPet(p);
                  setEditing(false);
                  setAddingPet(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  background:
                    selectedPet?.id === p.id ? `${T.accent}12` : "transparent",
                  borderLeft:
                    selectedPet?.id === p.id
                      ? `3px solid ${T.accent}`
                      : "3px solid transparent",
                  transition: "all .1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${T.accent}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={Icons.paw} size={14} color={T.accent} stroke />
                  </div>
                  <div>
                    <p
                      style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}
                    >
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: T.muted }}>
                      {p.species || "Pet"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Detail panel ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {addingPet && (
              <div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.text,
                    marginBottom: 16,
                  }}
                >
                  Register New Pet
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <Field label="Pet Name *">
                    <input
                      value={newPet.name}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. Buddy"
                      style={inpSm}
                      autoFocus
                    />
                  </Field>
                  <Field label="Species">
                    <select
                      value={newPet.species}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, species: e.target.value }))
                      }
                      style={inpSm}
                    >
                      {SPECIES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Breed">
                    <input
                      value={newPet.breed}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, breed: e.target.value }))
                      }
                      placeholder="e.g. Golden Retriever"
                      style={inpSm}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      value={newPet.gender}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, gender: e.target.value }))
                      }
                      style={inpSm}
                    >
                      {GENDERS.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Age">
                    <input
                      value={newPet.age}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, age: e.target.value }))
                      }
                      placeholder="e.g. 2"
                      style={inpSm}
                    />
                  </Field>
                  <Field label="Weight">
                    <input
                      value={newPet.weight}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, weight: e.target.value }))
                      }
                      placeholder="e.g. 8 kg"
                      style={inpSm}
                    />
                  </Field>
                  <Field label="Color / Markings">
                    <input
                      value={newPet.color}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, color: e.target.value }))
                      }
                      placeholder="e.g. Brown & White"
                      style={inpSm}
                    />
                  </Field>
                  <Field label="Birthday">
                    <input
                      type="date"
                      value={newPet.birthday}
                      onChange={(e) =>
                        setNewPet((p) => ({ ...p, birthday: e.target.value }))
                      }
                      style={inpSm}
                    />
                  </Field>
                </div>
                <Field label="Notes / Medical History">
                  <textarea
                    value={newPet.notes}
                    onChange={(e) =>
                      setNewPet((p) => ({ ...p, notes: e.target.value }))
                    }
                    placeholder="Allergies, medications, special conditions…"
                    style={{ ...inpSm, height: 70, resize: "vertical" }}
                  />
                </Field>
                <Field label="Loyalty Card">
                  <select
                    value={newPet.hasCard ? "yes" : "no"}
                    onChange={(e) =>
                      setNewPet((p) => ({
                        ...p,
                        hasCard: e.target.value === "yes",
                      }))
                    }
                    style={inpSm}
                  >
                    <option value="no">No Loyalty Card</option>
                    <option value="yes">With Loyalty Card</option>
                  </select>
                </Field>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={() => setAddingPet(false)}
                    style={{
                      ...css.btnSecondary,
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNewPet}
                    style={{
                      ...css.btnPrimary,
                      flex: 1,
                      justifyContent: "center",
                      opacity: newPet.name.trim() ? 1 : 0.5,
                    }}
                  >
                    Register Pet
                  </button>
                </div>
              </div>
            )}

            {!addingPet && !selectedPet && (
              <div
                style={{
                  padding: "48px 0",
                  textAlign: "center",
                  color: T.subtle,
                }}
              >
                <Icon d={Icons.paw} size={40} color={T.subtle} stroke />
                <p style={{ marginTop: 14, fontSize: 13.5 }}>
                  Select a pet from the list to view details.
                </p>
              </div>
            )}

            {/* ── Detail view ── */}
            {!addingPet && selectedPet && !editing && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <label
                      style={{
                        cursor: "pointer",
                        position: "relative",
                        flexShrink: 0,
                      }}
                      title="Click to upload pet photo"
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 14,
                          overflow: "hidden",
                          background: `${T.accent}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `2px solid ${selectedPet.photo ? T.accent : T.border}`,
                        }}
                      >
                        {selectedPet.photo ? (
                          <img
                            src={selectedPet.photo}
                            alt={selectedPet.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Icon
                            d={Icons.paw}
                            size={26}
                            color={T.accent}
                            stroke
                          />
                        )}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: T.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                        }}
                      >
                        <Icon d={Icons.plus} size={11} color="#fff" stroke />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          void uploadPhoto(e.target.files?.[0])
                        }
                      />
                    </label>
                    <div>
                      <h4
                        style={{
                          fontSize: 19,
                          fontWeight: 800,
                          color: T.text,
                        }}
                      >
                        {selectedPet.name}
                      </h4>
                      <p
                        style={{
                          fontSize: 13,
                          color: T.muted,
                          marginTop: 2,
                        }}
                      >
                        {selectedPet.species}
                        {selectedPet.breed ? ` · ${selectedPet.breed}` : ""}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: selectedPet.photo ? T.accent : T.subtle,
                          marginTop: 3,
                        }}
                      >
                        {selectedPet.photo
                          ? "Photo uploaded"
                          : "Click photo to upload"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={startEdit}
                      style={{
                        ...css.btnSecondary,
                        padding: "6px 14px",
                        fontSize: 12.5,
                        gap: 6,
                      }}
                    >
                      <Icon d={Icons.edit} size={13} color={T.muted} stroke />{" "}
                      Edit
                    </button>
                    <button
                      onClick={() => deletePet(selectedPet.id)}
                      style={{
                        ...css.btnSecondary,
                        padding: "6px 10px",
                        borderColor: "rgba(248,113,113,.4)",
                        color: T.danger,
                      }}
                    >
                      <Icon d={Icons.x} size={13} color={T.danger} stroke />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <Badge
                    label={
                      selectedPet.hasCard
                        ? "Has Loyalty Card"
                        : "No Loyalty Card"
                    }
                    color={selectedPet.hasCard ? T.accent : T.warn}
                  />
                  <Badge
                    label={`Print: ${selectedPet.printStatus}`}
                    color={
                      selectedPet.printStatus === "Printed" ? T.accent : T.warn
                    }
                  />
                </div>

                {/* QR */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 20,
                    marginBottom: 20,
                    padding: "16px 20px",
                    background: T.bg,
                    borderRadius: 12,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: "uppercase",
                        letterSpacing: ".07em",
                        marginBottom: 10,
                      }}
                    >
                      Scannable QR Code
                    </p>
                    <PetQRCode pet={selectedPet} size={130} />
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 10,
                        // Matches the framed code above. Wrapping keeps the
                        // pair inside this column instead of running under the
                        // membership field beside it.
                        width: 142,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => void saveQr(selectedPet)}
                        title="Save the code as a PNG for printing"
                        style={{
                          ...inpSm,
                          ...css.btnSecondary,
                          flex: "1 1 60px",
                          minWidth: 0,
                          padding: "7px 6px",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <Icon
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                          size={14}
                          color={T.muted}
                          stroke
                        />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyQr(selectedPet)}
                        title="Copy the code to paste into a chat or document"
                        style={{
                          ...inpSm,
                          ...css.btnSecondary,
                          flex: "1 1 60px",
                          minWidth: 0,
                          padding: "7px 6px",
                          justifyContent: "center",
                          gap: 5,
                        }}
                      >
                        <Icon
                          d="M8 4h10a2 2 0 012 2v10M16 8H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2z"
                          size={14}
                          color={T.muted}
                          stroke
                        />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.muted,
                        textTransform: "uppercase",
                        letterSpacing: ".07em",
                        marginBottom: 8,
                      }}
                    >
                      How to use
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: T.muted,
                        lineHeight: 1.7,
                      }}
                    >
                      Print or show this QR code to staff.
                      <br />
                      Scan it on the{" "}
                      <strong style={{ color: T.text }}>Transaction</strong>{" "}
                      page using a USB scanner or camera to instantly pull up
                      this pet's loyalty card and process points.
                    </p>
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Badge
                        label={`No: ${selectedPet.membershipNo || selectedPet.id}`}
                        color={T.info}
                      />
                      <Badge
                        label={selectedPet.hasCard ? "Has Card" : "No Card"}
                        color={selectedPet.hasCard ? T.accent : T.warn}
                      />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          marginBottom: 6,
                        }}
                      >
                        Membership Number
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          value={selectedPet.membershipNo || ""}
                          onChange={(e) => setMembershipNo(e.target.value)}
                          placeholder="e.g. PH-0001"
                          style={{
                            ...css.input,
                            fontSize: 13,
                            padding: "7px 10px",
                            maxWidth: 160,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            letterSpacing: ".05em",
                          }}
                        />
                        <span style={{ fontSize: 12, color: T.muted }}>
                          ← QR updates as you type
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: T.bg,
                    borderRadius: 10,
                    padding: "4px 16px",
                    marginBottom: 16,
                  }}
                >
                  <p style={{ ...css.sectionLabel, paddingTop: 14 }}>
                    Basic Information
                  </p>
                  <InfoRow label="Gender" value={selectedPet.gender} />
                  <InfoRow
                    label="Age"
                    value={selectedPet.age ? `${selectedPet.age} year(s)` : null}
                  />
                  <InfoRow label="Birthday" value={selectedPet.birthday} />
                  <InfoRow label="Weight" value={selectedPet.weight} />
                  <InfoRow
                    label="Color / Markings"
                    value={selectedPet.color}
                  />
                </div>

                <div
                  style={{
                    background: T.bg,
                    borderRadius: 10,
                    padding: "4px 16px",
                    marginBottom: 16,
                  }}
                >
                  <p style={{ ...css.sectionLabel, paddingTop: 14 }}>
                    Membership
                  </p>
                  <InfoRow
                    label="Membership No."
                    value={selectedPet.membershipNo}
                  />
                  <InfoRow label="Branch" value={selectedPet.branch} />
                  <InfoRow
                    label="Membership Date"
                    value={selectedPet.membershipDate}
                  />
                </div>

                {selectedPet.notes && (
                  <div
                    style={{
                      background: "#fffbeb",
                      borderRadius: 10,
                      padding: "14px 16px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#92400e",
                        textTransform: "uppercase",
                        letterSpacing: ".07em",
                        marginBottom: 6,
                      }}
                    >
                      Notes / Medical History
                    </p>
                    <p
                      style={{
                        fontSize: 13.5,
                        color: "#78350f",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedPet.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Edit form ── */}
            {!addingPet && selectedPet && editing && (
              <div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: T.text,
                    marginBottom: 16,
                  }}
                >
                  Edit — {selectedPet.name}
                </p>
                <div
                  style={{
                    background: `${T.accent}08`,
                    borderRadius: 9,
                    padding: "12px 14px",
                    marginBottom: 14,
                    border: `1px solid ${T.accent}22`,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.accent,
                      textTransform: "uppercase",
                      letterSpacing: ".07em",
                      marginBottom: 8,
                    }}
                  >
                    QR / Membership Number
                  </p>
                  <div
                    style={{ display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <input
                      value={editForm.membershipNo || ""}
                      onChange={(e) =>
                        applyEdit("membershipNo", e.target.value)
                      }
                      placeholder="e.g. PH-0001"
                      style={{
                        ...css.input,
                        fontSize: 13,
                        padding: "7px 10px",
                        maxWidth: 180,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        letterSpacing: ".05em",
                      }}
                    />
                    <span style={{ fontSize: 12, color: T.muted }}>
                      This number is encoded in the QR code
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {(
                    [
                      ["Pet Name *", "name", "text", undefined],
                      ["Species", "species", "text", SPECIES],
                      ["Breed", "breed", "text", undefined],
                      ["Gender", "gender", "text", GENDERS],
                      ["Age", "age", "text", undefined],
                      ["Weight", "weight", "text", undefined],
                      ["Color", "color", "text", undefined],
                      ["Birthday", "birthday", "date", undefined],
                    ] as Array<
                      [string, keyof Pet, string, string[] | undefined]
                    >
                  ).map(([label, field, type, options]) => (
                    <EditField
                      key={field}
                      label={label}
                      field={field}
                      type={type}
                      options={options}
                      value={String(editForm[field] ?? "")}
                      onChange={applyEdit}
                    />
                  ))}
                </div>

                <Field label="Notes / Medical History">
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => applyEdit("notes", e.target.value)}
                    style={{ ...inpSm, height: 70, resize: "vertical" }}
                  />
                </Field>

                <Field label="Loyalty Card">
                  <select
                    value={editForm.hasCard ? "yes" : "no"}
                    onChange={(e) => {
                      const updated = {
                        ...editForm,
                        hasCard: e.target.value === "yes",
                      } as Pet;
                      setEditForm(updated);
                      if (updated.name) {
                        setPets((prev) =>
                          prev.map((p) => (p.id === updated.id ? updated : p)),
                        );
                        setSelectedPet(updated);
                      }
                    }}
                    style={inpSm}
                  >
                    <option value="no">No Loyalty Card</option>
                    <option value="yes">With Loyalty Card</option>
                  </select>
                </Field>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 8,
                    padding: "10px 14px",
                    background: "rgba(34,197,138,.12)",
                    borderRadius: 9,
                    border: `1px solid ${T.accent}30`,
                  }}
                >
                  <Icon d={Icons.check} size={14} color={T.accent} stroke />
                  <p
                    style={{
                      fontSize: 12.5,
                      color: T.accent,
                      fontWeight: 600,
                      flex: 1,
                    }}
                  >
                    Changes are saved automatically
                  </p>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      ...css.btnPrimary,
                      padding: "6px 16px",
                      fontSize: 12.5,
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
