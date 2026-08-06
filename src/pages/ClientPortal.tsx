import { useRef, useState, type ReactNode } from "react";
import {
  Badge,
  Field,
  Icon,
  Icons,
  Modal,
  PageHeader,
  StatCard,
} from "@/components";
import { BranchesPage } from "./BranchesPage";
import { T, css } from "@/theme";
import { TODAY } from "@/lib/constants";
import { branchLabel } from "@/lib/branch";
import { fileToDataUrl } from "@/lib/files";
import { pointsForPet } from "@/lib/loyalty";
import type { AuthUser, Client, Db, Pet } from "@/types";

type ClientPage = "dashboard" | "branches" | "pets";

const NAV: Array<[ClientPage, string, string]> = [
  ["dashboard", "Dashboard", Icons.dashboard],
  ["branches", "Branches", Icons.branch],
  ["pets", "My Pets", Icons.paw],
];

function Info({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div style={{ paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
      <p style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>
        {value || "—"}
      </p>
    </div>
  );
}

export function ClientPortal({
  user,
  db,
  onLogout,
}: {
  user: AuthUser;
  db: Db;
  onLogout: () => void;
}) {
  const { clients, setClients, pets, setPets, transactions, appointments } = db;

  const coverInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState<ClientPage>("dashboard");
  const [petModal, setPetModal] = useState(false);
  const [petForm, setPetForm] = useState<Partial<Pet>>({});

  const me: Client = clients.find((c) => c.id === user.clientId) || {
    id: user.clientId ?? -1,
    name: user.name,
    email: user.email,
    branch: "",
    contact: "",
    status: "Active",
  };

  const myPets = pets.filter((p) => p.clientId === user.clientId);
  const petPoints = (pid: number) => pointsForPet(pid, transactions);
  const myAppts = appointments
    .filter((a) => a.clientId === user.clientId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  function savePet() {
    if (!petForm.name || !petForm.species) return;
    setPets((prev) => [
      ...prev,
      {
        id: Date.now(),
        clientId: user.clientId ?? -1,
        name: petForm.name!,
        species: petForm.species!,
        breed: petForm.breed || "",
        gender: petForm.gender || "Male",
        age: petForm.age || "",
        weight: petForm.weight || "",
        color: petForm.color || "",
        birthday: petForm.birthday || "",
        notes: petForm.notes || "",
        photo: petForm.photo || null,
        membershipNo: "",
        membershipDate: "",
        hasCard: false,
        branch: me.branch || "",
        email: me.email || "",
        printStatus: "N/A",
      },
    ]);
    setPetModal(false);
    setPetForm({});
  }

  async function uploadPhoto(field: "cover" | "avatar", file: File | undefined) {
    if (!file) return;
    const data = await fileToDataUrl(file);
    setClients((p) =>
      p.map((c) => (c.id === user.clientId ? { ...c, [field]: data } : c)),
    );
  }

  /** Raises a pending card request the admin releases from Card Requests. */
  function availCard(petId: number) {
    setPets((prev) =>
      prev.map((p) => {
        if (p.id !== petId) return p;
        const seq = String(p.id).slice(-4);
        return {
          ...p,
          hasCard: true,
          membershipNo: p.membershipNo || `PH-${seq}`,
          membershipDate:
            p.membershipDate || new Date().toLocaleDateString("en-US"),
          printStatus: "Pending",
        };
      }),
    );
  }

  const PetCard = ({ p }: { p: Pet }) => (
    <div className="ph-lift" style={{ ...css.card, padding: "18px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${T.accent}30, ${T.accent}0d)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `1px solid ${T.accent}25`,
          }}
        >
          <Icon d={Icons.paw} size={22} color={T.accent} stroke />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
            {p.name}
          </p>
          <p style={{ fontSize: 12.5, color: T.muted }}>
            {p.breed || p.species} · {p.gender}
          </p>
        </div>
        {p.hasCard ? (
          <span style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: T.accent,
                lineHeight: 1,
              }}
            >
              {petPoints(p.id)}
            </p>
            <p
              style={{
                fontSize: 10.5,
                color: T.muted,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              Points
            </p>
          </span>
        ) : (
          <Badge label="No Card" color={T.warn} />
        )}
      </div>

      {!p.hasCard && (
        <button
          onClick={() => availCard(p.id)}
          style={{
            ...css.btnPrimary,
            width: "100%",
            justifyContent: "center",
            marginBottom: 14,
            gap: 7,
          }}
        >
          <Icon d={Icons.transaction} size={15} color="#fff" stroke /> Avail
          Loyalty Card
        </button>
      )}

      {p.hasCard && p.printStatus === "Pending" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 9,
            background: `${T.warn}18`,
            border: `1px solid ${T.warn}33`,
            marginBottom: 14,
          }}
        >
          <Icon d={Icons.clock} size={14} color={T.warn} stroke />
          <p style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
            Card requested — pending release at your branch.
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 18px",
        }}
      >
        <Info label="Species" value={p.species} />
        <Info label="Age" value={p.age ? `${p.age} yr` : "—"} />
        <Info label="Weight" value={p.weight} />
        <Info label="Color" value={p.color} />
        <Info label="Birthday" value={p.birthday} />
        <Info label="Membership No." value={p.membershipNo} />
      </div>

      {p.notes && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: 9,
            background: T.bg,
            fontSize: 12.5,
            color: T.muted,
          }}
        >
          <strong style={{ color: T.text }}>Notes: </strong>
          {p.notes}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Inter',system-ui,sans-serif",
        background: T.bg,
      }}
    >
      {petModal && (
        <Modal title="Add a Pet" onClose={() => setPetModal(false)} width={520}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Pet Name">
              <input
                value={petForm.name || ""}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Koohii"
                style={css.input}
                autoFocus
              />
            </Field>
            <Field label="Species">
              <select
                value={petForm.species || "Dog"}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, species: e.target.value }))
                }
                style={css.input}
              >
                {["Dog", "Cat", "Bird", "Rabbit", "Other"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Breed">
              <input
                value={petForm.breed || ""}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, breed: e.target.value }))
                }
                placeholder="e.g. Shiba Inu"
                style={css.input}
              />
            </Field>
            <Field label="Gender">
              <select
                value={petForm.gender || "Male"}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, gender: e.target.value }))
                }
                style={css.input}
              >
                {["Male", "Female"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Age (years)">
              <input
                value={petForm.age || ""}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, age: e.target.value }))
                }
                placeholder="e.g. 3"
                style={css.input}
              />
            </Field>
            <Field label="Weight">
              <input
                value={petForm.weight || ""}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, weight: e.target.value }))
                }
                placeholder="e.g. 8 kg"
                style={css.input}
              />
            </Field>
            <Field label="Color">
              <input
                value={petForm.color || ""}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, color: e.target.value }))
                }
                placeholder="e.g. Brown"
                style={css.input}
              />
            </Field>
            <Field label="Birthday">
              <input
                type="date"
                value={petForm.birthday || ""}
                onChange={(e) =>
                  setPetForm((f) => ({ ...f, birthday: e.target.value }))
                }
                style={css.input}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              value={petForm.notes || ""}
              onChange={(e) =>
                setPetForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Allergies, reminders…"
              style={{ ...css.input, height: 64, resize: "vertical" }}
            />
          </Field>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderRadius: 9,
              background: `${T.accent}12`,
              border: `1px solid ${T.accent}22`,
              marginBottom: 8,
            }}
          >
            <Icon d={Icons.alert} size={14} color={T.accent} stroke />
            <p style={{ fontSize: 12, color: T.muted }}>
              A loyalty card will be issued by your branch on your next visit.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setPetModal(false)}
              style={{ ...css.btnSecondary, flex: 1, justifyContent: "center" }}
            >
              Cancel
            </button>
            <button
              onClick={savePet}
              disabled={!petForm.name}
              style={{
                ...css.btnPrimary,
                flex: 1,
                justifyContent: "center",
                opacity: petForm.name ? 1 : 0.5,
              }}
            >
              Add Pet
            </button>
          </div>
        </Modal>
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 210,
          background: T.sidebar,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 50,
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 11,
            borderBottom: "1px solid rgba(255,255,255,.07)",
            minHeight: 72,
          }}
        >
          <img
            src="/logo.png"
            alt="Pet Hub"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              objectFit: "contain",
              background: "#fff",
              padding: 5,
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,.55)",
            }}
          />
          <div>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 14.5 }}>
              PetHub
            </p>
            <p
              style={{
                color: "rgba(255,255,255,.4)",
                fontSize: 10.5,
                fontWeight: 500,
              }}
            >
              Client Portal
            </p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "14px 0" }}>
          {NAV.map(([id, label, ic]) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => setPage(id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 18px",
                  background: active ? "rgba(16,185,129,.15)" : "transparent",
                  border: "none",
                  borderLeft: active
                    ? `3px solid ${T.accent}`
                    : "3px solid transparent",
                  cursor: "pointer",
                  color: active ? "#fff" : "rgba(255,255,255,.55)",
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon
                  d={ic}
                  size={17}
                  color={active ? T.accent : "rgba(255,255,255,.45)"}
                  stroke
                />
                {label}
              </button>
            );
          })}
        </nav>

        <div
          style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,.07)" }}
        >
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 0",
              borderRadius: 8,
              background: "rgba(255,255,255,.06)",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,.7)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Icon
              d={Icons.logout}
              size={15}
              color="rgba(255,255,255,.7)"
              stroke
            />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <header
          style={{
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            height: 60,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: `${T.accent}18`,
                border: `1.5px solid ${T.accent}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={Icons.account} size={17} color={T.accent} stroke />
            </div>
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.text,
                  lineHeight: 1.2,
                }}
              >
                {me.name}
              </p>
              <p style={{ fontSize: 11, color: T.muted }}>Client</p>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {page === "branches" ? (
            <BranchesPage db={db} readOnly />
          ) : page === "pets" ? (
            <div>
              <PageHeader title="My Pets">
                <button
                  onClick={() => {
                    setPetForm({ gender: "Male", species: "Dog" });
                    setPetModal(true);
                  }}
                  style={css.btnPrimary}
                >
                  <Icon d={Icons.plus} size={15} color="#fff" stroke /> Add Pet
                </button>
              </PageHeader>

              {myPets.length === 0 ? (
                <div
                  style={{
                    ...css.card,
                    padding: "50px",
                    textAlign: "center",
                    color: T.subtle,
                  }}
                >
                  No pets registered under your account yet. Click{" "}
                  <strong style={{ color: T.text }}>Add Pet</strong> to register
                  your first one.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill,minmax(320px,1fr))",
                    gap: 16,
                  }}
                >
                  {myPets.map((p) => (
                    <PetCard key={p.id} p={p} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* ── Cover + avatar ── */}
              <div
                style={{
                  borderRadius: 16,
                  marginBottom: 20,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,.18)",
                  minHeight: 230,
                  display: "flex",
                  alignItems: "flex-end",
                  background: me.cover
                    ? `center/cover no-repeat url(${me.cover})`
                    : `linear-gradient(120deg, ${T.sidebar} 0%, #0d5b40 70%, ${T.accent} 135%)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.62) 100%)",
                  }}
                />
                <input
                  ref={coverInput}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    void uploadPhoto("cover", e.target.files?.[0])
                  }
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => coverInput.current?.click()}
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,.4)",
                    background: "rgba(0,0,0,.4)",
                    backdropFilter: "blur(6px)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  <Icon d={Icons.camera} size={14} color="#fff" stroke />{" "}
                  {me.cover ? "Change cover" : "Add cover photo"}
                </button>

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 18,
                    flexWrap: "wrap",
                    padding: "0 30px 24px",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 86,
                        height: 86,
                        borderRadius: "50%",
                        background: "#fff",
                        padding: 4,
                        boxShadow: "0 6px 18px rgba(0,0,0,.35)",
                        overflow: "hidden",
                      }}
                    >
                      {me.avatar ? (
                        <img
                          src={me.avatar}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            background: `${T.accent}22`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon
                            d={Icons.account}
                            size={38}
                            color={T.accentDark}
                            stroke
                          />
                        </div>
                      )}
                    </div>
                    <input
                      ref={avatarInput}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        void uploadPhoto("avatar", e.target.files?.[0])
                      }
                      style={{ display: "none" }}
                    />
                    <button
                      onClick={() => avatarInput.current?.click()}
                      title="Upload profile photo"
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "2px solid #fff",
                        background: T.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Icon d={Icons.camera} size={13} color="#fff" stroke />
                    </button>
                  </div>

                  <div
                    style={{
                      paddingBottom: 4,
                      textShadow: "0 1px 10px rgba(0,0,0,.6)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "rgba(255,255,255,.75)",
                        textTransform: "uppercase",
                        letterSpacing: ".1em",
                        marginBottom: 4,
                      }}
                    >
                      Client Portal
                    </p>
                    <h1
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        letterSpacing: "-.02em",
                        color: "#fff",
                      }}
                    >
                      Welcome back, {me.name.split(" ")[0]}!
                    </h1>
                    <p
                      style={{
                        fontSize: 13.5,
                        color: "rgba(255,255,255,.85)",
                        marginTop: 4,
                      }}
                    >
                      Here's how your furry family is doing today.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── KPIs ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 12,
                  marginBottom: 18,
                }}
              >
                <StatCard
                  label="My Pets"
                  value={myPets.length}
                  iconD={Icons.paw}
                  accent={T.accent}
                  sublabel="Registered pets"
                />
                <StatCard
                  label="Total Points"
                  value={myPets.reduce((s, p) => s + petPoints(p.id), 0)}
                  iconD={Icons.check}
                  accent={T.info}
                  sublabel="Across all cards"
                />
                <StatCard
                  label="Loyalty Cards"
                  value={
                    myPets.filter(
                      (p) => p.hasCard && p.printStatus !== "Pending",
                    ).length
                  }
                  iconD={Icons.transaction}
                  accent={T.accent}
                  sublabel="Active cards"
                />
                <StatCard
                  label="Upcoming Visits"
                  value={
                    myAppts.filter(
                      (a) => a.status === "Scheduled" && a.date >= TODAY,
                    ).length
                  }
                  iconD={Icons.calendar}
                  accent={T.warn}
                  sublabel="Appointments"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    ...css.card,
                    padding: "22px 24px",
                    flex: "1 1 300px",
                    minWidth: 280,
                  }}
                >
                  <p style={css.sectionLabel}>My Details</p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px 18px",
                    }}
                  >
                    <Info label="Full Name" value={me.name} />
                    <Info label="Status" value={me.status} />
                    <Info label="Email" value={me.email} />
                    <Info label="Contact" value={me.contact} />
                    <Info
                      label="Home Branch"
                      value={branchLabel(me.branch)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    ...css.card,
                    padding: "22px 24px",
                    flex: "1 1 320px",
                    minWidth: 280,
                  }}
                >
                  <p style={css.sectionLabel}>My Pets</p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {myPets.length === 0 ? (
                      <p style={{ fontSize: 13, color: T.subtle }}>
                        No pets yet.
                      </p>
                    ) : (
                      myPets.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: `1px solid ${T.border}`,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              background: `${T.accent}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon
                              d={Icons.paw}
                              size={16}
                              color={T.accent}
                              stroke
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13.5,
                                fontWeight: 700,
                                color: T.text,
                              }}
                            >
                              {p.name}
                            </p>
                            <p style={{ fontSize: 11.5, color: T.muted }}>
                              {p.breed || p.species}
                            </p>
                          </div>
                          {p.hasCard ? (
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: T.accent,
                              }}
                            >
                              {petPoints(p.id)} pts
                            </span>
                          ) : (
                            <Badge label="No Card" color={T.warn} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
