import { useMemo, useRef, useState } from "react";
import {
  Badge,
  BarChart,
  DataTable,
  DonutChart,
  Icon,
  Icons,
  Modal,
  PageHeader,
  PetQRCode,
  StatCard,
  Toast,
  type Column,
} from "@/components";
import { T, css } from "@/theme";
import { NEAR_EXPIRY_DAYS, SUPER_ADMIN, TODAY } from "@/lib/constants";
import { cardExpiry, daysUntilExpiry } from "@/lib/loyalty";
import { fileToDataUrl } from "@/lib/files";
import { branchLabel, shortBranch } from "@/lib/branch";
import type { Client, Db, Pet, Registration } from "@/types";

type Tone = "danger" | "warn" | "info" | "accent";

interface Reminder {
  type: "reg" | "account" | "print" | "appt";
  tone: Tone;
  title: string;
  sub: string;
}

interface PostMedia {
  type: "image" | "video";
  url: string;
  name: string;
}

interface Post {
  id: number;
  text: string;
  media: PostMedia[];
  author: string;
  date: string;
  likes: number;
  liked: boolean;
}

type ListKey =
  | "pets"
  | "clients"
  | "withcard"
  | "nocard"
  | "active"
  | "inactive"
  | "approved";

interface ListConfig {
  title: string;
  kind: "pet" | "client";
  items: Array<Pet | Client | Registration>;
}

const TONE_COLOR: Record<Tone, string> = {
  danger: T.danger,
  warn: T.warn,
  info: T.info,
  accent: T.accent,
};

export function Dashboard({ db }: { db: Db }) {
  const {
    pets,
    setPets,
    clients,
    transactions,
    appointments,
    branches,
    registrations,
    user,
  } = db;

  const [toast, setToast] = useState<string | null>(null);
  const [fBranch, setFBranch] = useState("All");
  const [acctModal, setAcctModal] = useState<"near" | "expired" | null>(null);
  const [listModal, setListModal] = useState<ListKey | null>(null);

  /* ── Client & card counts ── */
  const activeClients = clients.filter((c) => c.status === "Active").length;
  const inactiveClients = clients.filter((c) => c.status !== "Active").length;

  const cardPets = pets.filter((p) => p.hasCard);
  const nearExpiring = cardPets.filter((p) => {
    const d = daysUntilExpiry(p);
    return d !== null && d > 0 && d <= NEAR_EXPIRY_DAYS;
  }).length;
  const expiredAccts = cardPets.filter((p) => {
    const d = daysUntilExpiry(p);
    return d !== null && d <= 0;
  }).length;

  const approvedClientRegs = registrations.filter(
    (r) => r.status === "Approved" && r.accountType === "Client",
  );
  const approvedClients = approvedClientRegs.length;

  const listConfig: Record<ListKey, ListConfig> = {
    pets: { title: "All Pets", kind: "pet", items: pets },
    clients: { title: "All Clients", kind: "client", items: clients },
    withcard: {
      title: "Clients With Loyalty Card",
      kind: "client",
      items: clients.filter((c) =>
        pets.some((p) => p.clientId === c.id && p.hasCard),
      ),
    },
    nocard: {
      title: "Clients With Pets Missing a Card",
      kind: "client",
      items: clients.filter((c) =>
        pets.some((p) => p.clientId === c.id && !p.hasCard),
      ),
    },
    active: {
      title: "Active Clients",
      kind: "client",
      items: clients.filter((c) => c.status === "Active"),
    },
    inactive: {
      title: "Inactive Clients",
      kind: "client",
      items: clients.filter((c) => c.status !== "Active"),
    },
    approved: {
      title: "Approved Client Accounts",
      kind: "client",
      items: approvedClientRegs,
    },
  };
  const lc = listModal ? listConfig[listModal] : null;

  const acctList =
    acctModal === "near"
      ? cardPets.filter((p) => {
          const d = daysUntilExpiry(p);
          return d !== null && d > 0 && d <= NEAR_EXPIRY_DAYS;
        })
      : acctModal === "expired"
        ? cardPets.filter((p) => {
            const d = daysUntilExpiry(p);
            return d !== null && d <= 0;
          })
        : [];

  const clientsWithCard = clients.filter((c) =>
    pets.some((p) => p.clientId === c.id && p.hasCard),
  ).length;
  const clientsWithoutCard = clients.filter(
    (c) => !pets.some((p) => p.clientId === c.id && p.hasCard),
  ).length;
  const withCard = pets.filter((p) => p.hasCard).length;
  const withoutCard = pets.filter((p) => !p.hasCard).length;

  /* ── Analytics (respect the branch filter) ── */
  const fTxns = useMemo(() => {
    const inBranch = (b: string) => fBranch === "All" || b === fBranch;
    return transactions.filter((t) => {
      const pet = pets.find((p) => p.id === t.petId);
      return pet && inBranch(pet.branch);
    });
  }, [transactions, pets, fBranch]);

  const revenue = fTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const pointsIssued = fTxns.reduce((s, t) => s + (t.pointsGained || 0), 0);
  const pointsUsed = fTxns.reduce((s, t) => s + (t.pointsUsed || 0), 0);
  const apptUpcoming = appointments.filter(
    (a) =>
      a.status === "Scheduled" &&
      a.date >= TODAY &&
      (fBranch === "All" || a.branch === fBranch),
  ).length;

  const MONTHS = [
    { label: "Feb", key: "2026-02" },
    { label: "Mar", key: "2026-03" },
    { label: "Apr", key: "2026-04" },
    { label: "May", key: "2026-05" },
    { label: "Jun", key: "2026-06" },
    { label: "Jul", key: "2026-07" },
  ];
  const revTrend = MONTHS.map((m) => ({
    label: m.label,
    value: fTxns
      .filter((t) => String(t.date).startsWith(m.key))
      .reduce((s, t) => s + (t.amount || 0), 0),
  }));

  const branchRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      const pet = pets.find((p) => p.id === t.petId);
      if (!pet) return;
      map[pet.branch] = (map[pet.branch] || 0) + (t.amount || 0);
    });
    return Object.entries(map)
      .map(([branch, value]) => ({ branch, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, pets]);
  const maxBranchRev = Math.max(1, ...branchRevenue.map((b) => b.value));

  /* ── Reminders / alerts ── */
  const reminders = useMemo<Reminder[]>(() => {
    const list: Reminder[] = [];

    const pendingRegs = registrations.filter((r) => r.status === "Pending");
    if (pendingRegs.length > 0 && user?.email === SUPER_ADMIN) {
      list.push({
        type: "reg",
        tone: "danger",
        title: `${pendingRegs.length} new account request${pendingRegs.length !== 1 ? "s" : ""}`,
        sub: "Review & approve in Accounts",
      });
    }

    pets
      .filter((p) => p.hasCard)
      .forEach((p) => {
        const d = daysUntilExpiry(p);
        if (d === null) return;
        const owner = clients.find((c) => c.id === p.clientId);
        if (d <= 0) {
          list.push({
            type: "account",
            tone: "danger",
            title: `${p.name}'s loyalty card expired`,
            sub: `${owner?.name || ""} · expired ${Math.abs(d)}d ago`,
          });
        } else if (d <= NEAR_EXPIRY_DAYS) {
          list.push({
            type: "account",
            tone: "warn",
            title: `${p.name}'s card expiring soon`,
            sub: `${owner?.name || ""} · ${d} day${d !== 1 ? "s" : ""} left`,
          });
        }
      });

    const pendingPrints = pets.filter(
      (p) => p.printStatus === "Pending",
    ).length;
    if (pendingPrints > 0) {
      list.unshift({
        type: "print",
        tone: "warn",
        title: `${pendingPrints} loyalty card${pendingPrints !== 1 ? "s" : ""} to print`,
        sub: "Physical card printing queue",
      });
    }

    return list;
  }, [pets, clients, registrations, user]);

  /* ── Posts feed ── */
  const [posts, setPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState("");
  const [postMedia, setPostMedia] = useState<PostMedia[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addMedia(files: FileList | null) {
    if (!files || files.length === 0) return;
    const added = await Promise.all(
      Array.from(files).map(async (file) => ({
        type: file.type.startsWith("video")
          ? ("video" as const)
          : ("image" as const),
        url: await fileToDataUrl(file),
        name: file.name,
      })),
    );
    setPostMedia((prev) => [...prev, ...added]);
  }

  function submitPost() {
    if (!postText.trim() && postMedia.length === 0) return;
    setPosts((prev) => [
      {
        id: Date.now(),
        text: postText.trim(),
        media: [...postMedia],
        author: user?.name || "Jeremiah Munoz",
        date: new Date().toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        likes: 0,
        liked: false,
      },
      ...prev,
    ]);
    setPostText("");
    setPostMedia([]);
    setToast("Post published!");
  }

  const toggleLike = (id: number) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    );
  const deletePost = (id: number) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));
  const removeMedia = (i: number) =>
    setPostMedia((prev) => prev.filter((_, j) => j !== i));

  function markPrinted(id: number) {
    setPets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, printStatus: "Printed" } : p)),
    );
    setToast("Card marked as printed.");
  }

  const cols: Column<Pet>[] = [
    { key: "branch", label: "Branch" },
    { key: "email", label: "Email", muted: true },
    {
      key: "client",
      label: "Client",
      render: (r) => clients.find((c) => c.id === r.clientId)?.name || "—",
    },
    { key: "name", label: "Pet" },
    { key: "membershipDate", label: "Membership Date" },
    {
      key: "qr",
      label: "QR Code",
      sortable: false,
      render: (r) => <PetQRCode size={52} pet={r} />,
    },
    {
      key: "printStatus",
      label: "Print Status",
      render: (r) => (
        <Badge
          label={r.printStatus}
          color={r.printStatus === "Printed" ? T.accent : T.warn}
        />
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {lc && (
        <Modal title={lc.title} onClose={() => setListModal(null)} width={520}>
          <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
            {lc.items.length} {lc.kind === "pet" ? "pet" : "client"}
            {lc.items.length !== 1 ? "s" : ""}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            {lc.items.map((it) => {
              const sub =
                lc.kind === "pet"
                  ? `${(it as Pet).breed || (it as Pet).species} · ${
                      clients.find((c) => c.id === (it as Pet).clientId)?.name ||
                      "—"
                    }`
                  : `${branchLabel(it.branch)} · ${it.email}`;
              const pet = it as Pet;
              const client = it as Client;
              return (
                <div
                  key={it.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1px solid ${T.border}`,
                    background: T.surfaceAlt,
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
                      d={lc.kind === "pet" ? Icons.paw : Icons.account}
                      size={16}
                      color={T.accent}
                      stroke
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}
                    >
                      {it.name}
                    </p>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: T.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sub}
                    </p>
                  </div>
                  {lc.kind === "pet" && (
                    <Badge
                      label={pet.hasCard ? "Has Card" : "No Card"}
                      color={pet.hasCard ? T.accent : T.warn}
                    />
                  )}
                  {lc.kind === "client" && (
                    <Badge
                      label={client.status}
                      color={client.status === "Active" ? T.accent : T.danger}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {acctModal && (
        <Modal
          title={
            acctModal === "near"
              ? "Near-Expiring Loyalty Cards"
              : "Expired Loyalty Cards"
          }
          onClose={() => setAcctModal(null)}
          width={520}
        >
          <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
            {acctList.length} loyalty card{acctList.length !== 1 ? "s" : ""} ·{" "}
            {acctModal === "near"
              ? "expiring within 60 days"
              : "past expiry — renew at the branch"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {acctList.map((p) => {
              const d = daysUntilExpiry(p) ?? 0;
              const e = cardExpiry(p);
              const owner = clients.find((c) => c.id === p.clientId);
              const tone = acctModal === "near" ? T.warn : T.danger;
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: `1px solid ${T.border}`,
                    background: T.surfaceAlt,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: `${tone}1f`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={Icons.paw} size={16} color={tone} stroke />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}
                    >
                      {p.name}{" "}
                      <span
                        style={{
                          color: T.muted,
                          fontWeight: 400,
                          fontSize: 12,
                        }}
                      >
                        · {p.membershipNo || ""}
                      </span>
                    </p>
                    <p style={{ fontSize: 11.5, color: T.muted }}>
                      {owner?.name || "—"} · {branchLabel(p.branch)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: tone }}>
                      {d <= 0 ? `Expired ${Math.abs(d)}d ago` : `${d}d left`}
                    </p>
                    <p style={{ fontSize: 11, color: T.muted }}>
                      Exp.{" "}
                      {e?.toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      <PageHeader title="Dashboard">
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

      {/* ── KPI strip ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <StatCard
          label="Total Revenue"
          value={`₱${revenue.toLocaleString()}`}
          iconD={Icons.peso}
          accent={T.accent}
          sublabel={fBranch === "All" ? "All branches" : "Filtered branch"}
        />
        <StatCard
          label="Points Issued"
          value={pointsIssued.toLocaleString()}
          iconD={Icons.check}
          accent={T.info}
          sublabel="Loyalty points earned"
        />
        <StatCard
          label="Points Redeemed"
          value={pointsUsed.toLocaleString()}
          iconD={Icons.transaction}
          accent={T.warn}
          sublabel="Points used by clients"
        />
        <StatCard
          label="Upcoming Visits"
          value={apptUpcoming}
          iconD={Icons.calendar}
          accent={T.accent}
          sublabel="Upcoming appointments"
        />
      </div>

      {/* ── Newly Approved Clients ── */}
      <div style={{ ...css.card, padding: "22px 24px", marginBottom: 16 }}>
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
              New client accounts — cards to prepare.
            </p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: approvedClientRegs.length ? T.accent : T.subtle,
              borderRadius: 99,
              padding: "3px 12px",
            }}
          >
            {approvedClientRegs.length} approved
          </span>
        </div>
        {approvedClientRegs.length === 0 ? (
          <div
            style={{ padding: "30px", textAlign: "center", color: T.subtle }}
          >
            No newly approved clients yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {approvedClientRegs.map((r) => {
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
                    <Icon
                      d={Icons.account}
                      size={19}
                      color={T.accent}
                      stroke
                    />
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

      {/* ── Revenue + Reminders ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            ...css.card,
            padding: "22px 24px",
            flex: "1 1 460px",
            minWidth: 340,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 4,
            }}
          >
            <p style={{ ...css.sectionLabel, marginBottom: 0 }}>
              Revenue — Last 6 Months
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, color: T.text }}>
              ₱{revenue.toLocaleString()}
            </p>
          </div>
          <BarChart data={revTrend} prefix="₱" color={T.accent} />
          <div
            style={{
              borderTop: `1px solid ${T.border}`,
              marginTop: 18,
              paddingTop: 16,
            }}
          >
            <p style={{ ...css.sectionLabel, marginBottom: 12 }}>
              Revenue by Branch (Top 5)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {branchRevenue.map((b) => (
                <div
                  key={b.branch}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      color: T.muted,
                      width: 110,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {shortBranch(b.branch)}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 99,
                      background: T.bg,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round((b.value / maxBranchRev) * 100)}%`,
                        height: "100%",
                        borderRadius: 99,
                        background: T.accent,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: T.text,
                      width: 70,
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    ₱{b.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            ...css.card,
            padding: "22px 24px",
            flex: "1 1 320px",
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <p style={{ ...css.sectionLabel, marginBottom: 0 }}>
              Reminders &amp; Alerts
            </p>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                background: T.danger,
                borderRadius: 99,
                padding: "2px 9px",
              }}
            >
              {reminders.length}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              overflowY: "auto",
              maxHeight: 340,
            }}
          >
            {reminders.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: T.subtle,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                All caught up — no alerts.
              </p>
            ) : (
              reminders.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 11,
                    alignItems: "flex-start",
                    padding: "11px 13px",
                    borderRadius: 10,
                    background: `${TONE_COLOR[r.tone]}0d`,
                    border: `1px solid ${TONE_COLOR[r.tone]}22`,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: `${TONE_COLOR[r.tone]}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      d={
                        r.type === "appt"
                          ? Icons.calendar
                          : r.type === "print"
                            ? Icons.transaction
                            : r.type === "reg"
                              ? Icons.account
                              : Icons.alert
                      }
                      size={15}
                      color={TONE_COLOR[r.tone]}
                      stroke
                    />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.text,
                        lineHeight: 1.3,
                      }}
                    >
                      {r.title}
                    </p>
                    <p
                      style={{
                        fontSize: 11.5,
                        color: T.muted,
                        marginTop: 2,
                      }}
                    >
                      {r.sub}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Loyalty overview + stat grid ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ ...css.card, padding: "22px 24px", flex: "0 0 auto" }}>
          <p style={css.sectionLabel}>Loyalty Card Overview</p>
          <DonutChart
            segments={[
              {
                label: "With Loyalty Card",
                value: clientsWithCard,
                color: T.accent,
              },
              {
                label: "Without Loyalty Card",
                value: clientsWithoutCard,
                color: "#93c5fd",
              },
            ]}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 12,
            flex: 1,
            minWidth: 280,
            alignContent: "start",
          }}
        >
          <StatCard
            label="Total Pets"
            value={pets.length}
            iconD={Icons.paw}
            accent={T.accent}
            sublabel="All registered pets"
            onClick={() => setListModal("pets")}
          />
          <StatCard
            label="Total Clients"
            value={clients.length}
            iconD={Icons.clients}
            accent={T.info}
            sublabel="Registered clients"
            onClick={() => setListModal("clients")}
          />
          <StatCard
            label="Approved Accounts"
            value={approvedClients}
            iconD={Icons.check}
            accent={T.accent}
            sublabel="Approved client sign-ups"
            onClick={
              approvedClients ? () => setListModal("approved") : undefined
            }
          />
          <StatCard
            label="With Loyalty Card"
            value={withCard}
            iconD={Icons.check}
            accent={T.accent}
            sublabel="Pets with card"
            onClick={withCard ? () => setListModal("withcard") : undefined}
          />
          <StatCard
            label="Without Loyalty Card"
            value={withoutCard}
            iconD={Icons.account}
            accent={T.warn}
            sublabel="Pets pending card"
            onClick={withoutCard ? () => setListModal("nocard") : undefined}
          />
          <StatCard
            label="Active Clients"
            value={activeClients}
            iconD={Icons.account}
            accent={T.accent}
            sublabel="Currently active"
            onClick={activeClients ? () => setListModal("active") : undefined}
          />
          <StatCard
            label="Inactive Clients"
            value={inactiveClients}
            iconD={Icons.bell}
            accent={T.danger}
            sublabel="Inactive accounts"
            onClick={
              inactiveClients ? () => setListModal("inactive") : undefined
            }
          />
          <StatCard
            label="Near Expiring"
            value={nearExpiring}
            iconD={Icons.clock}
            accent={T.warn}
            sublabel="Cards ≤ 60 days left"
            onClick={nearExpiring ? () => setAcctModal("near") : undefined}
          />
          <StatCard
            label="Expired Cards"
            value={expiredAccts}
            iconD={Icons.alert}
            accent={T.danger}
            sublabel="Loyalty cards to renew"
            onClick={expiredAccts ? () => setAcctModal("expired") : undefined}
          />
        </div>
      </div>

      {/* ── Composer + feed + print queue ── */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ ...css.card, padding: "20px 22px", marginBottom: 16 }}>
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
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: `${T.accent}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon d={Icons.account} size={19} color={T.accent} stroke />
              </div>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind? Share updates, announcements..."
                style={{
                  ...css.input,
                  flex: 1,
                  height: 72,
                  resize: "none",
                  borderRadius: 20,
                  padding: "10px 16px",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                }}
              />
            </div>

            {postMedia.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    postMedia.length === 1 ? "1fr" : "1fr 1fr",
                  gap: 8,
                  marginBottom: 14,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1px solid ${T.border}`,
                }}
              >
                {postMedia
                  .slice(0, postMedia.length > 4 ? 4 : postMedia.length)
                  .map((m, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        background: "#000",
                        aspectRatio: postMedia.length === 1 ? "16/9" : "1",
                      }}
                    >
                      {m.type === "video" ? (
                        <video
                          src={m.url}
                          controls
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <img
                          src={m.url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,.6)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon d={Icons.x} size={12} color="#fff" stroke />
                      </button>
                      {postMedia.length > 3 && i === 3 && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: 22,
                              fontWeight: 800,
                            }}
                          >
                            +{postMedia.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void addMedia(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? T.accent : T.border}`,
                borderRadius: 12,
                padding: "14px 0",
                textAlign: "center",
                marginBottom: 14,
                background: dragging ? `${T.accent}06` : "transparent",
                transition: "all .15s",
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: dragging ? T.accent : T.muted,
                  fontWeight: 500,
                }}
              >
                {dragging
                  ? "Drop files here"
                  : "Drag & drop photos/videos or click to browse"}
              </p>
              <p style={{ fontSize: 11.5, color: T.subtle, marginTop: 3 }}>
                Supports JPG, PNG, GIF, MP4, MOV
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => void addMedia(e.target.files)}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    ...css.btnSecondary,
                    padding: "7px 14px",
                    fontSize: 12.5,
                    gap: 6,
                    borderColor: T.border,
                  }}
                >
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={T.accent}
                    strokeWidth={2}
                    strokeLinecap="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Photo
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    ...css.btnSecondary,
                    padding: "7px 14px",
                    fontSize: 12.5,
                    gap: 6,
                    borderColor: T.border,
                  }}
                >
                  <svg
                    width={15}
                    height={15}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeLinecap="round"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  Video
                </button>
              </div>
              <button
                onClick={submitPost}
                disabled={!postText.trim() && postMedia.length === 0}
                style={{
                  ...css.btnPrimary,
                  padding: "8px 22px",
                  fontSize: 13.5,
                  opacity:
                    !postText.trim() && postMedia.length === 0 ? 0.4 : 1,
                }}
              >
                Post
              </button>
            </div>
          </div>

          {posts.length === 0 && (
            <div
              style={{
                ...css.card,
                padding: "40px 24px",
                textAlign: "center",
                color: T.subtle,
              }}
            >
              <svg
                width={40}
                height={40}
                viewBox="0 0 24 24"
                fill="none"
                stroke={T.subtle}
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{ marginBottom: 10 }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p
                style={{ fontSize: 13.5, marginBottom: 4, fontWeight: 500 }}
              >
                No posts yet
              </p>
              <p style={{ fontSize: 12.5 }}>
                Share updates, announcements or photos above
              </p>
            </div>
          )}

          {posts.map((post) => (
            <div
              key={post.id}
              style={{ ...css.card, marginBottom: 14, overflow: "hidden" }}
            >
              <div
                style={{
                  padding: "16px 20px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{ display: "flex", gap: 11, alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `${T.accent}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon
                      d={Icons.account}
                      size={18}
                      color={T.accent}
                      stroke
                    />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                      {post.author}
                    </p>
                    <p style={{ fontSize: 12, color: T.subtle }}>{post.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => deletePost(post.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.subtle,
                    padding: 4,
                    borderRadius: 6,
                  }}
                >
                  <Icon d={Icons.x} size={15} color={T.subtle} stroke />
                </button>
              </div>

              {post.text && (
                <p
                  style={{
                    padding: "0 20px 14px",
                    fontSize: 14,
                    color: T.text,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {post.text}
                </p>
              )}

              {post.media.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      post.media.length === 1 ? "1fr" : "1fr 1fr",
                    gap: 2,
                  }}
                >
                  {post.media.slice(0, 4).map((m, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        background: "#000",
                        aspectRatio: post.media.length === 1 ? "16/9" : "1",
                        overflow: "hidden",
                      }}
                    >
                      {m.type === "video" ? (
                        <video
                          src={m.url}
                          controls
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <img
                          src={m.url}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      )}
                      {post.media.length > 4 && i === 3 && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,.55)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: 26,
                              fontWeight: 800,
                            }}
                          >
                            +{post.media.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  padding: "10px 20px 12px",
                  borderTop: `1px solid ${T.border}`,
                  display: "flex",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: post.liked ? T.danger : T.muted,
                    fontSize: 13.5,
                    fontWeight: post.liked ? 600 : 400,
                    padding: 0,
                  }}
                >
                  <svg
                    width={17}
                    height={17}
                    viewBox="0 0 24 24"
                    fill={post.liked ? "#ef4444" : "none"}
                    stroke={post.liked ? "#ef4444" : T.muted}
                    strokeWidth={2}
                    strokeLinecap="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  {post.likes > 0 && <span>{post.likes}</span>} Like
                </button>
                <span style={{ fontSize: 12, color: T.subtle }}>
                  {post.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: 440, flexShrink: 0 }}>
          <div style={{ ...css.card, padding: "22px 24px" }}>
            <p style={css.sectionLabel}>Physical Card Printing Queue</p>
            <DataTable
              data={pets}
              columns={cols}
              actions={(row) =>
                row.printStatus === "Printed" ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: T.accent,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon d={Icons.check} size={13} color={T.accent} stroke />
                    Done
                  </span>
                ) : (
                  <button
                    onClick={() => markPrinted(row.id)}
                    style={{ ...css.btnSmall }}
                  >
                    Set as Printed
                  </button>
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
