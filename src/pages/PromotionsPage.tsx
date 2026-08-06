import { useState } from "react";
import {
  Badge,
  DataTable,
  Field,
  Icon,
  Icons,
  Modal,
  PageHeader,
  Toast,
  type Column,
} from "@/components";
import { T, css } from "@/theme";
import { shortBranch } from "@/lib/branch";
import type { Db, Promotion } from "@/types";

/** How long the simulated send takes before the success modal appears. */
const SEND_DELAY_MS = 1500;

export function PromotionsPage({ db }: { db: Db }) {
  const {
    promotions: promos,
    setPromotions: setPromos,
    clients,
    branches,
  } = db;

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Promotion>>({});
  const [sendModal, setSendModal] = useState<Promotion | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [recipSearch, setRecipSearch] = useState("");
  const [recipBranch, setRecipBranch] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sentLog, setSentLog] = useState<{
    promo: Promotion;
    emails: string[];
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function setField<K extends keyof Promotion>(key: K, val: Promotion[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (modal === "edit" && updated.title) {
      setPromos((p) =>
        p.map((pr) => (pr.id === updated.id ? ({ ...updated } as Promotion) : pr)),
      );
    }
  }

  function save() {
    if (!form.title) return;
    if (modal === "add") {
      setPromos((p) => [
        ...p,
        { ...form, id: Date.now(), sendings: 0, logs: [] } as Promotion,
      ]);
    }
    setModal(null);
    setToast("Promotion saved.");
  }

  function handleSend(promo: Promotion) {
    setSelectedIds(clients.map((c) => c.id));
    setRecipSearch("");
    setRecipBranch([]);
    setSendModal(promo);
  }

  const toggleRecipient = (id: number) =>
    setSelectedIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  function confirmSend() {
    if (!sendModal) return;
    setSending(true);

    const emails = clients
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => c.email)
      .filter(Boolean);

    // Stands in for a real email API call.
    setTimeout(() => {
      setPromos((p) =>
        p.map((pr) =>
          pr.id !== sendModal.id
            ? pr
            : {
                ...pr,
                sendings: clients.length,
                logs: [
                  ...(pr.logs || []),
                  {
                    id: Date.now(),
                    date: new Date().toLocaleString(),
                    recipients: emails.length,
                    emails,
                  },
                ],
              },
        ),
      );
      setSentLog({ promo: sendModal, emails });
      setSendModal(null);
      setSending(false);
      setToast(
        `Promotion sent to ${emails.length} client${emails.length !== 1 ? "s" : ""}!`,
      );
    }, SEND_DELAY_MS);
  }

  const visibleRecipients = clients.filter((c) => {
    const q = recipSearch.toLowerCase();
    const branchOk =
      recipBranch.length === 0 || recipBranch.includes(c.branch);
    const searchOk =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    return branchOk && searchOk;
  });

  const columns: Column<Promotion>[] = [
    { key: "title", label: "Promotion Title" },
    {
      key: "details",
      label: "Details",
      render: (r) =>
        r.details ? (
          <span
            style={{
              color: T.text,
              fontSize: 13,
              maxWidth: 220,
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={r.details}
          >
            {r.details}
          </span>
        ) : (
          <span
            style={{ color: T.subtle, fontSize: 12, fontStyle: "italic" }}
          >
            No details
          </span>
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
    {
      key: "sendings",
      label: "Total Sent",
      render: (r) => (
        <span style={{ fontWeight: 700, color: T.text }}>
          {(r.sendings || 0).toLocaleString()}{" "}
          <span style={{ fontWeight: 400, color: T.muted, fontSize: 12 }}>
            / {clients.length} clients
          </span>
        </span>
      ),
    },
  ];

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <PageHeader title="Promotions">
        <button
          onClick={() => {
            setForm({ title: "", details: "", status: "Active" });
            setModal("add");
          }}
          style={css.btnPrimary}
        >
          <Icon d={Icons.plus} size={15} color="#fff" stroke /> New Promotion
        </button>
      </PageHeader>

      <div style={{ ...css.card, padding: "22px 24px" }}>
        <p style={css.sectionLabel}>All Promotions</p>
        <DataTable
          data={promos}
          columns={columns}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => handleSend(row)}
                disabled={row.status !== "Active"}
                style={{
                  ...css.btnPrimary,
                  padding: "5px 14px",
                  fontSize: 12,
                  gap: 6,
                  opacity: row.status === "Active" ? 1 : 0.4,
                }}
              >
                <Icon d={Icons.promo} size={13} color="#fff" stroke /> Send
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
                <Icon d={Icons.edit} size={13} color={T.muted} stroke />
              </button>
              <button
                onClick={() => {
                  setPromos((p) => p.filter((pr) => pr.id !== row.id));
                  setToast("Promotion removed.");
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

      {/* ── Add / edit ── */}
      {modal && (
        <Modal
          title={modal === "add" ? "New Promotion" : "Edit Promotion"}
          onClose={() => setModal(null)}
        >
          <Field label="Promotion Title">
            <input
              value={form.title || ""}
              onChange={(e) => setField("title", e.target.value)}
              style={css.input}
              placeholder="e.g. Free Grooming Month"
            />
          </Field>
          <Field
            label="Details"
            hint="This message will be included in the promotion email sent to clients."
          >
            <textarea
              value={form.details || ""}
              onChange={(e) => setField("details", e.target.value)}
              placeholder="e.g. Get 20% off on all grooming services this month! Valid until June 30, 2026."
              style={{ ...css.input, height: 90, resize: "vertical" }}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status || "Active"}
              onChange={(e) =>
                setField("status", e.target.value as Promotion["status"])
              }
              style={css.input}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>

          {modal === "edit" ? (
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
                onClick={() => setModal(null)}
                style={{
                  ...css.btnPrimary,
                  padding: "6px 16px",
                  fontSize: 12.5,
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
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
                style={{ ...css.btnPrimary, flex: 1, justifyContent: "center" }}
              >
                Add Promotion
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* ── Send ── */}
      {sendModal && (
        <Modal
          title="Send Promotion"
          onClose={() => !sending && setSendModal(null)}
          width={460}
        >
          <div
            style={{
              background: `${T.accent}0e`,
              borderRadius: 10,
              padding: "16px 18px",
              marginBottom: 18,
              border: `1px solid ${T.accent}20`,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.muted,
                textTransform: "uppercase",
                letterSpacing: ".07em",
                marginBottom: 4,
              }}
            >
              Promotion
            </p>
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: T.text,
                marginBottom: sendModal.details ? 10 : 0,
              }}
            >
              {sendModal.title}
            </p>
            {sendModal.details && (
              <div
                style={{
                  borderTop: `1px solid ${T.accent}20`,
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
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
                  Message / Details
                </p>
                <p
                  style={{
                    fontSize: 13.5,
                    color: T.text,
                    lineHeight: 1.6,
                    background: T.surface,
                    borderRadius: 8,
                    padding: "10px 12px",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  {sendModal.details}
                </p>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
              Sending to{" "}
              <strong style={{ color: T.text }}>
                {selectedIds.length} of {clients.length} client
                {clients.length !== 1 ? "s" : ""}
              </strong>
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() =>
                  setSelectedIds(
                    clients
                      .filter(
                        (c) =>
                          recipBranch.length === 0 ||
                          recipBranch.includes(c.branch),
                      )
                      .map((c) => c.id),
                  )
                }
                style={{
                  ...css.btnSecondary,
                  padding: "4px 10px",
                  fontSize: 12,
                }}
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedIds([])}
                style={{
                  ...css.btnSecondary,
                  padding: "4px 10px",
                  fontSize: 12,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              value={recipSearch}
              onChange={(e) => setRecipSearch(e.target.value)}
              placeholder="Search clients…"
              style={{ ...css.input, fontSize: 13, marginBottom: 8 }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button
                onClick={() => {
                  setRecipBranch([]);
                  setSelectedIds(clients.map((c) => c.id));
                }}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  borderRadius: 99,
                  padding: "5px 12px",
                  cursor: "pointer",
                  border: `1px solid ${recipBranch.length === 0 ? T.accent : T.border}`,
                  background:
                    recipBranch.length === 0 ? T.accent : "transparent",
                  color: recipBranch.length === 0 ? "#fff" : T.muted,
                }}
              >
                All Branches
              </button>
              {branches.map((b) => {
                const on = recipBranch.includes(b.name);
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      const next = on
                        ? recipBranch.filter((x) => x !== b.name)
                        : [...recipBranch, b.name];
                      setRecipBranch(next);
                      setSelectedIds(
                        clients
                          .filter(
                            (c) =>
                              next.length === 0 || next.includes(c.branch),
                          )
                          .map((c) => c.id),
                      );
                    }}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      borderRadius: 99,
                      padding: "5px 12px",
                      cursor: "pointer",
                      border: `1px solid ${on ? T.accent : T.border}`,
                      background: on ? T.accent : "transparent",
                      color: on ? "#fff" : T.muted,
                    }}
                  >
                    {shortBranch(b.name)}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              maxHeight: 180,
              overflowY: "auto",
              borderRadius: 9,
              border: `1px solid ${T.border}`,
              marginBottom: 18,
            }}
          >
            {clients.length === 0 ? (
              <p
                style={{
                  padding: "16px",
                  color: T.subtle,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                No registered clients found.
              </p>
            ) : (
              visibleRecipients.map((c, i, arr) => {
                const checked = selectedIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      borderBottom:
                        i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                      fontSize: 13,
                      cursor: "pointer",
                      background: checked ? "transparent" : T.surfaceAlt,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRecipient(c.id)}
                      style={{
                        accentColor: T.accent,
                        width: 16,
                        height: 16,
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    />
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: `${T.accent}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        opacity: checked ? 1 : 0.45,
                      }}
                    >
                      <Icon
                        d={Icons.account}
                        size={13}
                        color={T.accent}
                        stroke
                      />
                    </div>
                    <div style={{ opacity: checked ? 1 : 0.55 }}>
                      <p
                        style={{
                          fontWeight: 600,
                          color: T.text,
                          fontSize: 13,
                        }}
                      >
                        {c.name}
                      </p>
                      <p style={{ color: T.muted, fontSize: 11.5 }}>
                        {c.email}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setSendModal(null)}
              disabled={sending}
              style={{
                ...css.btnSecondary,
                flex: 1,
                justifyContent: "center",
                opacity: sending ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmSend}
              disabled={sending || selectedIds.length === 0}
              style={{
                ...css.btnPrimary,
                flex: 1,
                justifyContent: "center",
                gap: 8,
                opacity: sending || selectedIds.length === 0 ? 0.5 : 1,
              }}
            >
              {sending ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,.4)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "ph-spin .7s linear infinite",
                    }}
                  />{" "}
                  Sending…
                </>
              ) : (
                <>
                  <Icon d={Icons.promo} size={14} color="#fff" stroke />{" "}
                  {selectedIds.length === clients.length
                    ? "Send to All Clients"
                    : `Send to ${selectedIds.length} Selected`}
                </>
              )}
            </button>
          </div>
          <style>{`@keyframes ph-spin{to{transform:rotate(360deg)}}`}</style>
        </Modal>
      )}

      {/* ── Sent ── */}
      {sentLog && (
        <Modal
          title="Promotion Sent!"
          onClose={() => setSentLog(null)}
          width={460}
        >
          <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(34,197,138,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <Icon d={Icons.check} size={28} color={T.accent} stroke />
            </div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: T.text,
                marginBottom: 6,
              }}
            >
              Successfully Sent!
            </p>
            <p
              style={{
                fontSize: 13.5,
                color: T.muted,
                marginBottom: sentLog.promo.details ? 10 : 0,
              }}
            >
              <strong style={{ color: T.text }}>{sentLog.promo.title}</strong>{" "}
              was sent to{" "}
              <strong style={{ color: T.accent }}>
                {sentLog.emails.length}
              </strong>{" "}
              client{sentLog.emails.length !== 1 ? "s" : ""}.
            </p>
            {sentLog.promo.details && (
              <p
                style={{
                  fontSize: 12.5,
                  color: T.muted,
                  fontStyle: "italic",
                  background: T.bg,
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: `1px solid ${T.border}`,
                }}
              >
                "{sentLog.promo.details}"
              </p>
            )}
          </div>

          <div
            style={{
              background: T.bg,
              borderRadius: 9,
              padding: "12px 16px",
              marginBottom: 18,
              maxHeight: 160,
              overflowY: "auto",
            }}
          >
            {sentLog.emails.map((email, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  borderBottom:
                    i < sentLog.emails.length - 1
                      ? `1px solid ${T.border}`
                      : "none",
                  fontSize: 13,
                }}
              >
                <Icon d={Icons.check} size={12} color={T.accent} stroke />
                <span style={{ color: T.muted }}>{email}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSentLog(null)}
            style={{ ...css.btnPrimary, width: "100%", justifyContent: "center" }}
          >
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}
