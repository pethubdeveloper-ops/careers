import { useMemo, useState, type CSSProperties } from "react";
import {
  Icon,
  Icons,
  Modal,
  PageHeader,
  StatCard,
  Toast,
} from "@/components";
import { T, css } from "@/theme";
import { shortBranch } from "@/lib/branch";
import type { Db, Transaction } from "@/types";

/** A transaction joined with its pet, owner and branch for display. */
interface EnrichedTxn extends Transaction {
  petLabel: string;
  clientLabel: string;
  branch: string;
  type: "Earned" | "Redeemed";
}

interface PetGroup {
  petId: number;
  petLabel: string;
  clientLabel: string;
  branch: string;
  txns: EnrichedTxn[];
  count: number;
  spent: number;
  points: number;
}

const selWrap: CSSProperties = {
  ...css.input,
  width: "auto",
  padding: "7px 12px",
  fontSize: 13,
};

const monthLabel = (m: string) =>
  new Date(`${m}-01`).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

export function TransactionHistory({ db }: { db: Db }) {
  const { transactions, setTransactions, pets, clients, branches } = db;

  const [toast, setToast] = useState<string | null>(null);
  const [fBranch, setFBranch] = useState("All");
  const [fType, setFType] = useState("All");
  const [fMonth, setFMonth] = useState("All");
  const [fSearch, setFSearch] = useState("");
  const [viewReceipt, setViewReceipt] = useState<Transaction | null>(null);
  const [groupMode, setGroupMode] = useState<"pet" | "list">("pet");
  const [openGroup, setOpenGroup] = useState<number | null>(null);

  const enriched = useMemo<EnrichedTxn[]>(
    () =>
      transactions.map((t) => {
        const p = pets.find((x) => x.id === t.petId);
        const c = p ? clients.find((x) => x.id === p.clientId) : undefined;
        return {
          ...t,
          petLabel: p?.name || "—",
          clientLabel: c?.name || "—",
          branch: p?.branch || "—",
          type: (t.pointsUsed || 0) > 0 ? "Redeemed" : "Earned",
        };
      }),
    [transactions, pets, clients],
  );

  const filtered = useMemo(() => {
    const q = fSearch.toLowerCase();
    return enriched
      .filter(
        (t) =>
          (fBranch === "All" || t.branch === fBranch) &&
          (fType === "All" || t.type === fType) &&
          (fMonth === "All" || String(t.date).slice(0, 7) === fMonth) &&
          (!q ||
            t.petLabel.toLowerCase().includes(q) ||
            t.clientLabel.toLowerCase().includes(q) ||
            String(t.transactionId).includes(q) ||
            (t.transactBy || "").toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [enriched, fBranch, fType, fMonth, fSearch]);

  const groups = useMemo<PetGroup[]>(() => {
    const m = new Map<number, Omit<PetGroup, "count" | "spent" | "points">>();
    filtered.forEach((t) => {
      if (!m.has(t.petId)) {
        m.set(t.petId, {
          petId: t.petId,
          petLabel: t.petLabel,
          clientLabel: t.clientLabel,
          branch: t.branch,
          txns: [],
        });
      }
      m.get(t.petId)!.txns.push(t);
    });
    return [...m.values()]
      .map((g) => ({
        ...g,
        count: g.txns.length,
        spent: g.txns.reduce((s, t) => s + (t.amount || 0), 0),
        points: g.txns.reduce(
          (s, t) => s + (t.pointsGained || 0) - (t.pointsUsed || 0),
          0,
        ),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const monthOptions = useMemo(() => {
    const set = new Set(
      transactions.map((t) => String(t.date).slice(0, 7)).filter(Boolean),
    );
    return [...set].sort().reverse();
  }, [transactions]);

  const totalRevenue = filtered.reduce((s, t) => s + (t.amount || 0), 0);
  const totalEarned = filtered.reduce((s, t) => s + (t.pointsGained || 0), 0);
  const totalRedeemed = filtered.reduce((s, t) => s + (t.pointsUsed || 0), 0);

  function removeTxn(id: number) {
    setTransactions((p) => p.filter((t) => t.id !== id));
    setToast("Transaction deleted.");
  }

  /** Exports whatever the filters currently show, in the active view's shape. */
  function exportCSV() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const scope =
      (fBranch === "All"
        ? "All-Branches"
        : shortBranch(fBranch).replace(/\s+/g, "-")) +
      (fMonth === "All" ? "" : `-${fMonth}`) +
      (groupMode === "pet" ? "-ByPet" : "");

    const header = [
      "PetHub Transaction Report",
      `View:,${groupMode === "pet" ? "Grouped by Pet / Client" : "All Transactions (List)"}`,
      `Branch:,${fBranch === "All" ? "All Branches" : shortBranch(fBranch)}`,
      `Month:,${fMonth === "All" ? "All Months" : monthLabel(fMonth)}`,
      `Generated:,${new Date().toLocaleString("en-PH")}`,
      "",
    ];

    let lines: string[];

    if (groupMode === "pet") {
      const cols = [
        "Pet",
        "Client",
        "Branch",
        "Date",
        "Transaction ID",
        "Amount",
        "Points Gained",
        "Points Used",
        "Type",
        "Handled By",
      ];
      lines = [...header, cols.map(esc).join(",")];
      groups.forEach((g) => {
        g.txns.forEach((t) => {
          lines.push(
            [
              g.petLabel,
              g.clientLabel,
              shortBranch(g.branch),
              t.date,
              t.transactionId,
              t.amount || 0,
              t.pointsGained || 0,
              t.pointsUsed || 0,
              t.type,
              t.transactBy,
            ]
              .map(esc)
              .join(","),
          );
        });
        lines.push(
          [
            `${g.petLabel} — Subtotal`,
            g.clientLabel,
            shortBranch(g.branch),
            "",
            `${g.count} txns`,
            g.spent,
            g.txns.reduce((s, t) => s + (t.pointsGained || 0), 0),
            g.txns.reduce((s, t) => s + (t.pointsUsed || 0), 0),
            `${g.points} pts balance`,
            "",
          ]
            .map(esc)
            .join(","),
        );
        lines.push("");
      });
      lines.push(
        [
          "GRAND TOTAL",
          "",
          fBranch === "All" ? "All Branches" : shortBranch(fBranch),
          "",
          `${filtered.length} txns · ${groups.length} pets`,
          totalRevenue,
          totalEarned,
          totalRedeemed,
          "",
          "",
        ]
          .map(esc)
          .join(","),
      );
    } else {
      const cols = [
        "Date",
        "Transaction ID",
        "Pet",
        "Client",
        "Branch",
        "Amount",
        "Points Gained",
        "Points Used",
        "Type",
        "Handled By",
      ];
      const rows = filtered.map((t) =>
        [
          t.date,
          t.transactionId,
          t.petLabel,
          t.clientLabel,
          shortBranch(t.branch),
          t.amount || 0,
          t.pointsGained || 0,
          t.pointsUsed || 0,
          t.type,
          t.transactBy,
        ]
          .map(esc)
          .join(","),
      );
      lines = [
        ...header,
        cols.map(esc).join(","),
        ...rows,
        "",
        [
          "TOTAL",
          "",
          `${filtered.length} txns`,
          "",
          fBranch === "All" ? "All Branches" : shortBranch(fBranch),
          totalRevenue,
          totalEarned,
          totalRedeemed,
          "",
          "",
        ]
          .map(esc)
          .join(","),
      ];
    }

    // The BOM keeps Excel happy with the ₱ sign and en dashes.
    const blob = new Blob(["﻿" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PetHub-Transactions-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setToast(
      `Exported ${filtered.length} transaction${filtered.length !== 1 ? "s" : ""} (${groupMode === "pet" ? "grouped by pet" : "list"}) to CSV.`,
    );
  }

  const pointsCell = (t: EnrichedTxn) => (
    <>
      {(t.pointsGained || 0) > 0 && (
        <span style={{ color: T.accent, fontWeight: 700 }}>
          +{t.pointsGained}
        </span>
      )}
      {(t.pointsUsed || 0) > 0 && (
        <span style={{ color: T.danger, fontWeight: 700, marginLeft: 6 }}>
          −{t.pointsUsed}
        </span>
      )}
      {!(t.pointsGained || 0) && !(t.pointsUsed || 0) && (
        <span style={{ color: T.subtle }}>—</span>
      )}
    </>
  );

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {viewReceipt && (
        <Modal
          title={`Receipt — Transaction #${viewReceipt.transactionId}`}
          onClose={() => setViewReceipt(null)}
          width={560}
        >
          <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>
            {viewReceipt.receipt} ·{" "}
            {new Date(viewReceipt.date).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · ₱{(viewReceipt.amount || 0).toLocaleString()}
          </p>
          {String(viewReceipt.receiptType || "").includes("pdf") ? (
            <iframe
              src={viewReceipt.receiptData ?? undefined}
              title="Receipt PDF"
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
              src={viewReceipt.receiptData ?? undefined}
              alt="Receipt"
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
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <a
              href={viewReceipt.receiptData ?? undefined}
              download={viewReceipt.receipt ?? undefined}
              style={{
                ...css.btnSecondary,
                flex: 1,
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Download
            </a>
            <button
              onClick={() => setViewReceipt(null)}
              style={{ ...css.btnPrimary, flex: 1, justifyContent: "center" }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      <PageHeader title="Transaction History">
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          style={{ ...css.btnPrimary, opacity: filtered.length === 0 ? 0.5 : 1 }}
        >
          <Icon
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
            size={15}
            color="#fff"
            stroke
          />{" "}
          Export CSV
          {fBranch !== "All" ? ` — ${shortBranch(fBranch)}` : ""}
        </button>
      </PageHeader>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Total Transactions"
          value={filtered.length}
          iconD={Icons.transaction}
          accent={T.info}
          sublabel={
            fMonth === "All" && fBranch === "All"
              ? "All recorded"
              : "Matching filters"
          }
        />
        <StatCard
          label="Total Revenue"
          value={`₱${totalRevenue.toLocaleString()}`}
          iconD={Icons.peso}
          accent={T.accent}
          sublabel={
            fBranch === "All" ? "Across all branches" : shortBranch(fBranch)
          }
        />
        <StatCard
          label="Points Earned"
          value={totalEarned}
          iconD={Icons.check}
          accent={T.accent}
          sublabel="Loyalty points issued"
        />
        <StatCard
          label="Points Redeemed"
          value={totalRedeemed}
          iconD={Icons.promo}
          accent={T.warn}
          sublabel="Points used"
        />
      </div>

      <div style={{ ...css.card, padding: "22px 24px" }}>
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <p style={{ ...css.sectionLabel, margin: 0, marginRight: "auto" }}>
            {groupMode === "pet"
              ? "Grouped by Pet / Client"
              : "All Transactions"}
          </p>
          <div
            style={{
              display: "flex",
              borderRadius: 9,
              border: `1px solid ${T.border}`,
              overflow: "hidden",
            }}
          >
            {(
              [
                ["pet", "By Pet"],
                ["list", "List"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setGroupMode(v)}
                style={{
                  padding: "7px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: groupMode === v ? T.accent : "transparent",
                  color: groupMode === v ? "#fff" : T.muted,
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <input
              value={fSearch}
              onChange={(e) => setFSearch(e.target.value)}
              placeholder="Search pet, client, ID…"
              style={{
                ...css.input,
                width: 220,
                paddingLeft: 34,
                fontSize: 13,
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <Icon d={Icons.search} size={14} color={T.subtle} stroke />
            </span>
          </div>
          <select
            value={fBranch}
            onChange={(e) => setFBranch(e.target.value)}
            style={selWrap}
          >
            <option value="All">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {shortBranch(b.name)}
              </option>
            ))}
          </select>
          <select
            value={fType}
            onChange={(e) => setFType(e.target.value)}
            style={selWrap}
          >
            {["All", "Earned", "Redeemed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={fMonth}
            onChange={(e) => setFMonth(e.target.value)}
            style={selWrap}
          >
            <option value="All">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        {groupMode === "pet" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.length === 0 ? (
              <p style={{ padding: 40, textAlign: "center", color: T.subtle }}>
                No transactions match your filters.
              </p>
            ) : (
              groups.map((g) => {
                const open = openGroup === g.petId;
                return (
                  <div
                    key={g.petId}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${T.border}`,
                      overflow: "hidden",
                      background: T.surface,
                    }}
                  >
                    <button
                      onClick={() => setOpenGroup(open ? null : g.petId)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 16px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: `${T.accent}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon d={Icons.paw} size={17} color={T.accent} stroke />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {g.petLabel}
                        </p>
                        <p style={{ fontSize: 12, color: T.muted }}>
                          {g.clientLabel} · {shortBranch(g.branch)}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 18,
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: T.text,
                            }}
                          >
                            ₱{g.spent.toLocaleString()}
                          </p>
                          <p style={{ fontSize: 10.5, color: T.muted }}>
                            {g.count} txn{g.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: T.accent,
                            }}
                          >
                            {g.points} pts
                          </p>
                          <p style={{ fontSize: 10.5, color: T.muted }}>
                            balance
                          </p>
                        </div>
                        <Icon
                          d={open ? Icons.chevronD : Icons.chevronR}
                          size={16}
                          color={T.muted}
                          stroke
                        />
                      </div>
                    </button>

                    {open && (
                      <div
                        style={{
                          borderTop: `1px solid ${T.border}`,
                          overflowX: "auto",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 13,
                          }}
                        >
                          <thead>
                            <tr style={{ background: T.surfaceAlt }}>
                              {[
                                "Date",
                                "Txn ID",
                                "Amount",
                                "Points",
                                "Handled By",
                                "Receipt",
                                "",
                              ].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    padding: "9px 14px",
                                    textAlign: "left",
                                    fontWeight: 600,
                                    color: T.muted,
                                    fontSize: 11.5,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {g.txns.map((t, i) => (
                              <tr
                                key={t.id}
                                style={{
                                  borderTop: `1px solid ${T.border}`,
                                  background:
                                    i % 2 === 0 ? T.surface : T.surfaceAlt,
                                }}
                              >
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    whiteSpace: "nowrap",
                                    color: T.text,
                                    fontWeight: 600,
                                  }}
                                >
                                  {new Date(t.date).toLocaleDateString(
                                    "en-PH",
                                    {
                                      year: "2-digit",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    color: T.muted,
                                  }}
                                >
                                  #{t.transactionId}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    color: T.text,
                                    fontWeight: 700,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  ₱{(t.amount || 0).toLocaleString()}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {pointsCell(t)}
                                </td>
                                <td
                                  style={{
                                    padding: "9px 14px",
                                    color: T.muted,
                                    fontSize: 12,
                                  }}
                                >
                                  {t.transactBy}
                                </td>
                                <td style={{ padding: "9px 14px" }}>
                                  {t.receiptData ? (
                                    <span
                                      onClick={() => setViewReceipt(t)}
                                      style={{
                                        color: T.accent,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      View
                                    </span>
                                  ) : (
                                    <span style={{ color: T.subtle }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: "9px 14px" }}>
                                  <button
                                    onClick={() => removeTxn(t.id)}
                                    title="Delete"
                                    style={{
                                      ...css.btnSecondary,
                                      padding: "4px 8px",
                                      fontSize: 11.5,
                                      borderColor: T.border,
                                      color: T.muted,
                                    }}
                                  >
                                    <Icon
                                      d={Icons.x}
                                      size={12}
                                      color={T.muted}
                                      stroke
                                    />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div
            style={{
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              overflow: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: T.surfaceAlt,
                    borderBottom: `2px solid ${T.border}`,
                  }}
                >
                  {[
                    "Date",
                    "Txn ID",
                    "Pet",
                    "Client",
                    "Branch",
                    "Amount",
                    "Points",
                    "Handled By",
                    "Receipt",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 16px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: T.muted,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        padding: 40,
                        textAlign: "center",
                        color: T.subtle,
                      }}
                    >
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: i % 2 === 0 ? T.surface : T.surfaceAlt,
                      }}
                    >
                      <td
                        style={{
                          padding: "11px 16px",
                          whiteSpace: "nowrap",
                          color: T.text,
                          fontWeight: 600,
                        }}
                      >
                        {new Date(t.date).toLocaleDateString("en-PH", {
                          year: "2-digit",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "11px 16px", color: T.muted }}>
                        #{t.transactionId}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <span
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              background: `${T.accent}18`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon
                              d={Icons.paw}
                              size={12}
                              color={T.accent}
                              stroke
                            />
                          </span>
                          <span style={{ fontWeight: 600, color: T.text }}>
                            {t.petLabel}
                          </span>
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px", color: T.muted }}>
                        {t.clientLabel}
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          color: T.muted,
                          fontSize: 12.5,
                        }}
                      >
                        {shortBranch(t.branch)}
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          color: T.text,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        ₱{(t.amount || 0).toLocaleString()}
                      </td>
                      <td
                        style={{ padding: "11px 16px", whiteSpace: "nowrap" }}
                      >
                        {pointsCell(t)}
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          color: T.muted,
                          fontSize: 12.5,
                        }}
                      >
                        {t.transactBy}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        {t.receiptData ? (
                          <span
                            onClick={() => setViewReceipt(t)}
                            style={{
                              color: T.accent,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: 13,
                              textDecoration: "underline",
                            }}
                          >
                            View
                          </span>
                        ) : (
                          <span style={{ color: T.subtle, fontSize: 12.5 }}>
                            —
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <button
                          onClick={() => removeTxn(t.id)}
                          title="Delete"
                          style={{
                            ...css.btnSecondary,
                            padding: "5px 9px",
                            fontSize: 12,
                            borderColor: T.border,
                            color: T.muted,
                          }}
                        >
                          <Icon
                            d={Icons.x}
                            size={13}
                            color={T.muted}
                            stroke
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: 12.5, color: T.muted, marginTop: 12 }}>
          Showing <strong style={{ color: T.text }}>{filtered.length}</strong> of{" "}
          {transactions.length} transactions
          {groupMode === "pet"
            ? ` across ${groups.length} pet${groups.length !== 1 ? "s" : ""}`
            : ""}
        </p>
      </div>
    </div>
  );
}
