import { useRef, useState, type CSSProperties } from "react";
import {
  Badge,
  DataTable,
  Field,
  Icon,
  Icons,
  IdThumbnail,
  IdViewerModal,
  Modal,
  PageHeader,
  Toast,
  type Column,
} from "@/components";
import { PetDetailsModal } from "./PetDetailsModal";
import { T, css } from "@/theme";
import { branchLabel } from "@/lib/branch";
import { readDocumentFile } from "@/lib/files";
import type { Client, Db, Pet } from "@/types";

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

/** A pet being registered inline alongside a brand-new client. */
interface PetDraft {
  tempId: number;
  name: string;
  species: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  color: string;
  birthday: string;
  notes: string;
  hasCard: boolean;
  expanded: boolean;
}

interface ClientForm extends Partial<Client> {
  pets?: PetDraft[];
}

const newDraft = (): PetDraft => ({
  tempId: Date.now() + Math.random(),
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
  expanded: true,
});

const inpP: CSSProperties = {
  ...css.input,
  fontSize: 12.5,
  padding: "6px 9px",
};

export function ClientsPage({ db }: { db: Db }) {
  const { clients, setClients, pets, setPets, branches } = db;
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<ClientForm>({});
  const [petsFor, setPetsFor] = useState<Client | null>(null);
  const [viewId, setViewId] = useState<Client | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const idInput = useRef<HTMLInputElement>(null);

  /** Attaches an ID to the client being added or edited. */
  async function pickId(file: File | undefined) {
    if (!file) return;
    const doc = await readDocumentFile(file);
    const next = {
      ...form,
      idImage: doc.data,
      idName: doc.name,
      idType: doc.type,
    };
    setForm(next);
    if (modal === "edit" && next.name) {
      setClients((p) =>
        p.map((c) => (c.id === next.id ? ({ ...next } as Client) : c)),
      );
    }
  }

  /** Edits save as you type; Add waits for the Register button. */
  function setField<K extends keyof Client>(key: K, val: Client[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (modal === "edit" && updated.name) {
      setClients((p) =>
        p.map((c) => (c.id === updated.id ? ({ ...updated } as Client) : c)),
      );
    }
  }

  function save() {
    if (!form.name) return;

    if (modal === "add") {
      const newId = Date.now();
      const newClient: Client = {
        id: newId,
        branch: form.branch || "",
        email: form.email || "",
        contact: form.contact || "",
        name: form.name,
        status: form.status || "Active",
        idImage: form.idImage ?? null,
        idName: form.idName ?? null,
        idType: form.idType ?? null,
      };
      setClients((p) => [...p, newClient]);

      const membershipDate = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });

      const newPets: Pet[] = (form.pets || [])
        .filter((p) => p.name.trim())
        .map((p, i) => ({
          id: newId + i + 1,
          clientId: newId,
          name: p.name.trim(),
          membershipNo: "",
          photo: null,
          species: p.species,
          breed: p.breed,
          gender: p.gender,
          age: p.age,
          weight: p.weight,
          color: p.color,
          birthday: p.birthday,
          notes: p.notes,
          hasCard: p.hasCard,
          branch: form.branch || "",
          email: form.email || "",
          membershipDate,
          printStatus: p.hasCard ? "Pending" : "N/A",
        }));

      if (newPets.length > 0) setPets((p) => [...p, ...newPets]);
    } else {
      setClients((p) =>
        p.map((c) => (c.id === form.id ? ({ ...form } as Client) : c)),
      );
    }

    setModal(null);
    setToast(
      modal === "add" ? "Client registered successfully." : "Client updated.",
    );
  }

  function updateDraft<K extends keyof PetDraft>(
    i: number,
    field: K,
    val: PetDraft[K],
  ) {
    setForm((f) => ({
      ...f,
      pets: (f.pets || []).map((p, j) =>
        j === i ? { ...p, [field]: val } : p,
      ),
    }));
  }

  const columns: Column<Client>[] = [
    { key: "branch", label: "Branch" },
    { key: "email", label: "Email", muted: true },
    { key: "contact", label: "Contact", muted: true },
    { key: "name", label: "Client Name" },
    {
      key: "id",
      label: "ID",
      sortable: false,
      render: (r) => (
        <IdThumbnail
          doc={r}
          size={34}
          onOpen={() => setViewId(r)}
          onMissing={() => {
            setForm({ ...r });
            setModal("edit");
          }}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge
          label={r.status}
          color={r.status === "Active" ? T.accent : T.warn}
        />
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <PageHeader title="Clients">
        <button
          onClick={() => {
            setForm({
              branch: "",
              email: "",
              contact: "",
              name: "",
              status: "Active",
              pets: [],
            });
            setModal("add");
          }}
          style={css.btnPrimary}
        >
          <Icon d={Icons.plus} size={15} color="#fff" stroke /> Add Client
        </button>
      </PageHeader>

      <div style={{ ...css.card, padding: "22px 24px" }}>
        <p style={css.sectionLabel}>Client List</p>
        <DataTable
          data={clients}
          columns={columns}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPetsFor(row)}
                title="View Pets"
                style={{
                  ...css.btnSmall,
                  background: `${T.accent}18`,
                  color: T.accent,
                  border: `1px solid ${T.accent}30`,
                  padding: "5px 10px",
                }}
              >
                <Icon d={Icons.paw} size={13} color={T.accent} stroke />
              </button>
              <button
                onClick={() => {
                  setForm({ ...row });
                  setModal("edit");
                }}
                style={{
                  ...css.btnSecondary,
                  padding: "5px 12px",
                  fontSize: 12,
                  gap: 5,
                }}
              >
                <Icon d={Icons.edit} size={13} color={T.muted} stroke /> Edit
              </button>
              <button
                onClick={() => {
                  setClients((p) => p.filter((c) => c.id !== row.id));
                  setPets((p) => p.filter((x) => x.clientId !== row.id));
                  setToast("Client and their pets removed.");
                }}
                style={{
                  ...css.btnSecondary,
                  padding: "5px 10px",
                  fontSize: 12,
                  borderColor: "rgba(248,113,113,.4)",
                  color: T.danger,
                }}
              >
                <Icon d={Icons.x} size={13} color={T.danger} stroke />
              </button>
            </div>
          )}
        />
      </div>

      {modal && (
        <Modal
          title={modal === "add" ? "Add Client" : "Edit Client"}
          onClose={() => setModal(null)}
          width={520}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.muted,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            Client Information
          </p>

          <Field label="Branch">
            <select
              value={form.branch || ""}
              onChange={(e) => setField("branch", e.target.value)}
              style={css.input}
            >
              <option value="">Select branch…</option>
              {branches.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Full Name">
              <input
                value={form.name || ""}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                style={css.input}
              />
            </Field>
            <Field label="Contact Number">
              <input
                value={form.contact || ""}
                onChange={(e) => setField("contact", e.target.value)}
                placeholder="09XXXXXXXXX"
                style={css.input}
              />
            </Field>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Email Address">
              <input
                value={form.email || ""}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="email@example.com"
                style={css.input}
              />
            </Field>
            <Field label="Status">
              <select
                value={form.status || "Active"}
                onChange={(e) =>
                  setField("status", e.target.value as Client["status"])
                }
                style={css.input}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>
          </div>

          <Field
            label="Valid ID"
            hint="Attached automatically when a client is approved from a sign-up request."
          >
            <input
              ref={idInput}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => void pickId(e.target.files?.[0])}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IdThumbnail
                doc={{ ...form, name: form.name || "this client" }}
                size={44}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: form.idImage ? T.text : T.subtle,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {form.idImage ? form.idName || "ID on file" : "No ID on file"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => idInput.current?.click()}
                style={{
                  ...css.btnSecondary,
                  padding: "6px 14px",
                  fontSize: 12.5,
                }}
              >
                {form.idImage ? "Replace" : "Upload ID"}
              </button>
            </div>
          </Field>

          {/* ── Pet registration ── */}
          <div
            style={{
              marginTop: 8,
              marginBottom: 12,
              paddingTop: 16,
              borderTop: `1px solid ${T.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                Pet Registration
              </p>
              {modal === "add" && (
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      pets: [...(f.pets || []), newDraft()],
                    }))
                  }
                  style={{
                    ...css.btnPrimary,
                    padding: "4px 12px",
                    fontSize: 12,
                    gap: 5,
                  }}
                >
                  <Icon d={Icons.plus} size={12} color="#fff" stroke /> Add Pet
                </button>
              )}
            </div>

            {modal === "add" && (form.pets || []).length === 0 && (
              <div
                style={{
                  background: T.bg,
                  borderRadius: 8,
                  padding: "14px 16px",
                  textAlign: "center",
                  color: T.subtle,
                  fontSize: 13,
                }}
              >
                No pets added yet. Click <strong>Add Pet</strong> to register a
                pet for this client.
              </div>
            )}

            {modal === "add" &&
              (form.pets || []).map((pet, i) => (
                <div
                  key={pet.tempId}
                  style={{
                    background: T.bg,
                    borderRadius: 10,
                    marginBottom: 10,
                    border: `1px solid ${T.border}`,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                    }}
                  >
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
                    <input
                      value={pet.name}
                      onChange={(e) => updateDraft(i, "name", e.target.value)}
                      placeholder="Pet name *"
                      style={{ ...inpP, flex: 1, fontWeight: 600 }}
                    />
                    <select
                      value={pet.species}
                      onChange={(e) =>
                        updateDraft(i, "species", e.target.value)
                      }
                      style={{ ...inpP, width: 110 }}
                    >
                      {SPECIES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateDraft(i, "expanded", !pet.expanded)}
                      title={pet.expanded ? "Collapse" : "Expand details"}
                      style={{
                        ...css.btnSecondary,
                        padding: "5px 10px",
                        fontSize: 12,
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        d={pet.expanded ? Icons.chevronD : Icons.chevronR}
                        size={13}
                        color={T.muted}
                        stroke
                      />
                      {pet.expanded ? "Less" : "More"}
                    </button>
                    <button
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          pets: (f.pets || []).filter((_, j) => j !== i),
                        }))
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: T.danger,
                        padding: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Icon d={Icons.x} size={15} color={T.danger} stroke />
                    </button>
                  </div>

                  {pet.expanded && (
                    <div
                      style={{
                        padding: "12px 14px 14px",
                        borderTop: `1px solid ${T.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        {(
                          [
                            ["Breed", "breed", "e.g. Shiba Inu"],
                            ["Age", "age", "e.g. 2"],
                            ["Weight", "weight", "e.g. 8 kg"],
                            ["Color", "color", "e.g. Brown"],
                          ] as Array<[string, keyof PetDraft, string]>
                        ).map(([label, field, placeholder]) => (
                          <div key={field}>
                            <label
                              style={{
                                display: "block",
                                fontSize: 11,
                                fontWeight: 600,
                                color: T.muted,
                                marginBottom: 4,
                              }}
                            >
                              {label}
                            </label>
                            <input
                              value={String(pet[field] ?? "")}
                              onChange={(e) =>
                                updateDraft(
                                  i,
                                  field,
                                  e.target.value as PetDraft[typeof field],
                                )
                              }
                              placeholder={placeholder}
                              style={inpP}
                            />
                          </div>
                        ))}
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 600,
                              color: T.muted,
                              marginBottom: 4,
                            }}
                          >
                            Gender
                          </label>
                          <select
                            value={pet.gender}
                            onChange={(e) =>
                              updateDraft(i, "gender", e.target.value)
                            }
                            style={inpP}
                          >
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 600,
                              color: T.muted,
                              marginBottom: 4,
                            }}
                          >
                            Birthday
                          </label>
                          <input
                            type="date"
                            value={pet.birthday}
                            onChange={(e) =>
                              updateDraft(i, "birthday", e.target.value)
                            }
                            style={inpP}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 600,
                              color: T.muted,
                              marginBottom: 4,
                            }}
                          >
                            Loyalty Card
                          </label>
                          <select
                            value={pet.hasCard ? "yes" : "no"}
                            onChange={(e) =>
                              updateDraft(i, "hasCard", e.target.value === "yes")
                            }
                            style={inpP}
                          >
                            <option value="no">No Loyalty Card</option>
                            <option value="yes">With Loyalty Card</option>
                          </select>
                        </div>
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 600,
                              color: T.muted,
                              marginBottom: 4,
                            }}
                          >
                            Notes / Medical
                          </label>
                          <input
                            value={pet.notes}
                            onChange={(e) =>
                              updateDraft(i, "notes", e.target.value)
                            }
                            placeholder="Allergies, conditions…"
                            style={inpP}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {modal === "edit" && (
              <div
                style={{
                  background: T.bg,
                  borderRadius: 8,
                  padding: "12px 16px",
                  fontSize: 13,
                  color: T.muted,
                }}
              >
                {pets.filter((p) => p.clientId === form.id).length === 0
                  ? "No pets registered for this client."
                  : pets
                      .filter((p) => p.clientId === form.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "6px 0",
                            borderBottom: `1px solid ${T.border}`,
                          }}
                        >
                          <Icon
                            d={Icons.paw}
                            size={14}
                            color={T.accent}
                            stroke
                          />
                          <span style={{ fontWeight: 600, color: T.text }}>
                            {p.name}
                          </span>
                          <Badge
                            label={p.hasCard ? "Has Card" : "No Card"}
                            color={p.hasCard ? T.accent : T.warn}
                          />
                        </div>
                      ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {modal === "edit" ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "rgba(34,197,138,.12)",
                    borderRadius: 9,
                    border: `1px solid ${T.accent}30`,
                    flex: 1,
                  }}
                >
                  <Icon d={Icons.check} size={14} color={T.accent} stroke />
                  <p
                    style={{
                      fontSize: 12.5,
                      color: T.accent,
                      fontWeight: 600,
                    }}
                  >
                    Auto-saved
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    ...css.btnPrimary,
                    padding: "9px 20px",
                    justifyContent: "center",
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    ...css.btnSecondary,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  style={{
                    ...css.btnPrimary,
                    flex: 1,
                    justifyContent: "center",
                  }}
                >
                  Register Client
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {viewId && (
        <IdViewerModal
          doc={viewId}
          onClose={() => setViewId(null)}
          subtitle={`${viewId.email} · ${branchLabel(viewId.branch)}`}
        />
      )}

      {petsFor && (
        <PetDetailsModal
          client={petsFor}
          pets={pets}
          setPets={setPets}
          onClose={() => setPetsFor(null)}
        />
      )}
    </div>
  );
}
