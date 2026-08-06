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
import { SUPER_ADMIN } from "@/lib/constants";
import { branchLabel, shortBranch, vetsForBranch } from "@/lib/branch";
import type { Account, Db, Registration } from "@/types";

export function AccountsPage({ db }: { db: Db }) {
  const {
    accounts,
    setAccounts,
    registrations,
    setRegistrations,
    setClients,
    user,
    branchVets,
    setBranchVets,
    branches,
  } = db;

  const [newVet, setNewVet] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<Account>>({});
  const [toast, setToast] = useState<string | null>(null);

  const isSuperAdmin = user?.email === SUPER_ADMIN;
  const pendingRegs = registrations.filter((r) => r.status === "Pending");
  const reviewedRegs = registrations.filter((r) => r.status !== "Pending");

  function addVet(branch: string | undefined) {
    const name = newVet.trim();
    if (!name || !branch) return;
    const label = /^dr\.?\s/i.test(name)
      ? name.replace(/^dr\.?\s/i, "Dr. ")
      : `Dr. ${name}`;
    setBranchVets((p) => ({ ...p, [branch]: [...(p[branch] || []), label] }));
    setNewVet("");
    setToast(`${label} added to ${branchLabel(branch)}.`);
  }

  function removeVet(branch: string | undefined, v: string) {
    if (!branch) return;
    setBranchVets((p) => ({
      ...p,
      [branch]: (p[branch] || []).filter((x) => x !== v),
    }));
    setToast(`${v} removed.`);
  }

  function approveReg(reg: Registration) {
    setRegistrations((p) =>
      p.map((r) => (r.id === reg.id ? { ...r, status: "Approved" } : r)),
    );
    if (reg.accountType === "Client") {
      setClients((p) =>
        p.some((c) => (c.email || "").toLowerCase() === reg.email.toLowerCase())
          ? p
          : [
              ...p,
              {
                id: Date.now(),
                branch: reg.branch,
                email: reg.email,
                contact: reg.contact || "",
                name: reg.name,
                status: "Active",
              },
            ],
      );
      setToast("Client approved — added to Clients & Pets.");
    } else {
      setAccounts((p) =>
        p.some((a) => (a.email || "").toLowerCase() === reg.email.toLowerCase())
          ? p
          : [
              ...p,
              {
                id: Date.now(),
                branch: reg.branch,
                email: reg.email,
                accountName: reg.name.toUpperCase(),
                status: "Active",
                dateCreated: new Date().toISOString().slice(0, 10),
              },
            ],
      );
      setToast("Staff approved — added to Accounts and can now sign in.");
    }
  }

  function denyReg(id: number) {
    setRegistrations((p) =>
      p.map((r) => (r.id === id ? { ...r, status: "Denied" } : r)),
    );
    setToast("Account request denied.");
  }

  /** Edits save as you type; Add waits for the Save button. */
  function setField<K extends keyof Account>(key: K, val: Account[K]) {
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (modal === "edit" && updated.branch && updated.email) {
      setAccounts((p) =>
        p.map((a) => (a.id === updated.id ? ({ ...updated } as Account) : a)),
      );
    }
  }

  function save() {
    if (!form.branch || !form.email) return;
    if (modal === "add") {
      setAccounts((p) => [...p, { ...form, id: Date.now() } as Account]);
    } else {
      setAccounts((p) =>
        p.map((a) => (a.id === form.id ? ({ ...form } as Account) : a)),
      );
    }
    setModal(null);
    setToast(modal === "add" ? "Account added." : "Account saved.");
  }

  function del(id: number) {
    setAccounts((p) => p.filter((a) => a.id !== id));
    setToast("Account removed.");
  }

  const columns: Column<Account>[] = [
    { key: "branch", label: "Branch" },
    { key: "email", label: "Email", muted: true },
    { key: "accountName", label: "Account Name" },
    {
      key: "vets",
      label: "Veterinarians",
      sortable: false,
      render: (r) => (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            maxWidth: 220,
          }}
        >
          {vetsForBranch(r.branch, branchVets).map((v) => (
            <span
              key={v}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#fff",
                background: "rgba(255,255,255,.16)",
                border: "1px solid rgba(255,255,255,.35)",
                borderRadius: 99,
                padding: "3px 9px",
                whiteSpace: "nowrap",
              }}
            >
              {v}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "dateCreated",
      label: "Date Created",
      render: (r) =>
        r.dateCreated ? (
          <span style={{ color: T.muted, fontSize: 13 }}>
            {new Date(r.dateCreated).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span style={{ color: T.subtle }}>—</span>
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

      <PageHeader title="Accounts">
        <button
          onClick={() => {
            setForm({
              branch: "",
              email: "",
              accountName: "",
              status: "Active",
              dateCreated: new Date().toISOString().slice(0, 10),
            });
            setModal("add");
          }}
          style={css.btnPrimary}
        >
          <Icon d={Icons.plus} size={15} color="#fff" stroke /> Add Account
        </button>
      </PageHeader>

      {/* ── Account access requests (super-admin only) ── */}
      {isSuperAdmin && (
        <div
          style={{
            ...css.card,
            padding: "22px 24px",
            marginBottom: 16,
            borderTop: `3px solid ${pendingRegs.length ? T.warn : T.accent}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <p style={{ ...css.sectionLabel, marginBottom: 2 }}>
                Account Access Requests
              </p>
              <p style={{ fontSize: 12.5, color: T.muted }}>
                New sign-ups need your approval before they can access the
                portal.
              </p>
            </div>
            {pendingRegs.length > 0 ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: T.warn,
                  borderRadius: 99,
                  padding: "4px 12px",
                }}
              >
                {pendingRegs.length} pending
              </span>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.accent,
                  background: `${T.accent}15`,
                  borderRadius: 99,
                  padding: "4px 12px",
                }}
              >
                All reviewed
              </span>
            )}
          </div>

          {pendingRegs.length === 0 && reviewedRegs.length === 0 && (
            <div
              style={{
                background: T.bg,
                borderRadius: 10,
                padding: "22px",
                textAlign: "center",
                color: T.subtle,
                fontSize: 13,
              }}
            >
              No registration requests yet. When someone requests access from
              the login screen, they'll appear here.
            </div>
          )}

          {pendingRegs.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 16px",
                borderRadius: 10,
                border: `1px solid ${T.warn}33`,
                background: `${T.warn}0a`,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${T.warn}1f`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon d={Icons.account} size={18} color={T.warn} stroke />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  {r.name}
                </p>
                <p style={{ fontSize: 12.5, color: T.muted }}>{r.email}</p>
              </div>
              <div style={{ minWidth: 150 }}>
                <p style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>
                  {r.accountType === "Client" ? "Client" : r.role}
                </p>
                <p style={{ fontSize: 11.5, color: T.muted }}>
                  {shortBranch(r.branch)}
                </p>
              </div>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  borderRadius: 6,
                  padding: "4px 9px",
                  color: r.accountType === "Client" ? T.info : T.accentDark,
                  background:
                    r.accountType === "Client"
                      ? `${T.info}15`
                      : `${T.accent}15`,
                  flexShrink: 0,
                }}
              >
                {r.accountType === "Client" ? "→ Clients" : "→ Accounts"}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => approveReg(r)}
                  style={{
                    ...css.btnPrimary,
                    padding: "7px 16px",
                    fontSize: 12.5,
                    gap: 6,
                  }}
                >
                  <Icon d={Icons.check} size={14} color="#fff" stroke /> Approve
                </button>
                <button
                  onClick={() => denyReg(r.id)}
                  style={{
                    ...css.btnSecondary,
                    padding: "7px 14px",
                    fontSize: 12.5,
                    gap: 6,
                    borderColor: "rgba(248,113,113,.4)",
                    color: T.danger,
                  }}
                >
                  <Icon d={Icons.x} size={14} color={T.danger} stroke /> Deny
                </button>
              </div>
            </div>
          ))}

          {reviewedRegs.length > 0 && (
            <div style={{ marginTop: pendingRegs.length ? 8 : 0 }}>
              <p
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: T.subtle,
                  textTransform: "uppercase",
                  letterSpacing: ".06em",
                  margin: "6px 0 10px",
                }}
              >
                Reviewed
              </p>
              {reviewedRegs.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 9,
                    border: `1px solid ${T.border}`,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p
                      style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}
                    >
                      {r.name}{" "}
                      <span style={{ color: T.muted, fontWeight: 400 }}>
                        · {r.email}
                      </span>
                    </p>
                    <p style={{ fontSize: 11.5, color: T.muted }}>
                      {r.accountType === "Client" ? "Client" : r.role}
                    </p>
                  </div>
                  <Badge
                    label={r.status}
                    color={r.status === "Approved" ? T.accent : T.danger}
                  />
                  {r.status === "Denied" && (
                    <button
                      onClick={() => approveReg(r)}
                      style={{
                        ...css.btnSecondary,
                        padding: "5px 12px",
                        fontSize: 12,
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {r.status === "Approved" && (
                    <button
                      onClick={() => denyReg(r.id)}
                      style={{
                        ...css.btnSecondary,
                        padding: "5px 12px",
                        fontSize: 12,
                        borderColor: "rgba(248,113,113,.4)",
                        color: T.danger,
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ ...css.card, padding: "22px 24px" }}>
        <p style={css.sectionLabel}>Branch Accounts</p>
        <DataTable
          data={accounts}
          columns={columns}
          actions={(row) => (
            <div style={{ display: "flex", gap: 6 }}>
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
                onClick={() => del(row.id)}
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
          title={modal === "add" ? "Add Account" : "Edit Account"}
          onClose={() => setModal(null)}
        >
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

          <Field label="Email Address">
            <input
              value={form.email || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              style={css.input}
            />
          </Field>

          <Field label="Account Name">
            <input
              value={form.accountName || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountName: e.target.value }))
              }
              style={css.input}
            />
          </Field>

          <Field
            label="Veterinarians"
            hint="Doctors clients can choose when booking at this branch."
          >
            {!form.branch ? (
              <p style={{ fontSize: 12.5, color: T.subtle, padding: "8px 0" }}>
                Select a branch first to manage its doctors.
              </p>
            ) : (
              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 10,
                    minHeight: 28,
                  }}
                >
                  {(branchVets[form.branch] || []).length === 0 && (
                    <p style={{ fontSize: 12.5, color: T.subtle }}>
                      No veterinarians yet — add one below.
                    </p>
                  )}
                  {(branchVets[form.branch] || []).map((v) => (
                    <span
                      key={v}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff",
                        background: "rgba(255,255,255,.16)",
                        border: "1px solid rgba(255,255,255,.35)",
                        borderRadius: 99,
                        padding: "4px 6px 4px 11px",
                      }}
                    >
                      {v}
                      <button
                        type="button"
                        onClick={() => removeVet(form.branch, v)}
                        title={`Remove ${v}`}
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: "50%",
                          border: "none",
                          background: `${T.danger}15`,
                          color: T.danger,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <Icon d={Icons.x} size={10} color={T.danger} stroke />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newVet}
                    onChange={(e) => setNewVet(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addVet(form.branch);
                      }
                    }}
                    placeholder="e.g. Dr. Maria Santos"
                    style={{ ...css.input, fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => addVet(form.branch)}
                    disabled={!newVet.trim()}
                    style={{
                      ...css.btnPrimary,
                      padding: "8px 16px",
                      fontSize: 13,
                      opacity: newVet.trim() ? 1 : 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <Icon d={Icons.plus} size={13} color="#fff" stroke /> Add
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label="Date Created">
            <input
              type="date"
              value={form.dateCreated || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setField("dateCreated", e.target.value)}
              style={css.input}
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status || "Active"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as Account["status"],
                }))
              }
              style={css.input}
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </Field>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setModal(null)}
              style={{ ...css.btnSecondary, flex: 1, justifyContent: "center" }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              style={{ ...css.btnPrimary, flex: 1, justifyContent: "center" }}
            >
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
