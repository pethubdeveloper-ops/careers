import { useState, type FormEvent } from "react";
import { Field, Icon, Icons } from "@/components";
import { T, css } from "@/theme";
import { SUPER_ADMIN } from "@/lib/constants";
import { shortBranch } from "@/lib/branch";
import type {
  AccountType,
  Admin,
  AuthUser,
  Branch,
  Client,
  Pet,
  Registration,
} from "@/types";

export function LoginScreen({
  onLogin,
  onRegister,
  admins,
  registrations,
  clients,
  branches,
  pets,
}: {
  onLogin: (user: AuthUser) => void;
  onRegister: (reg: Registration) => void;
  admins: Admin[];
  registrations: Registration[];
  clients: Client[];
  branches: Branch[];
  pets: Pet[];
}) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState(SUPER_ADMIN);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rBranch, setRBranch] = useState("");
  const [rRole, setRRole] = useState("Branch Staff");
  const [rContact, setRContact] = useState("");
  const [rType, setRType] = useState<AccountType>("Staff");
  const [rPw, setRPw] = useState("");

  const clientEmails = clients.map((c) => (c.email || "").toLowerCase());

  function switchMode(m: "signin" | "register") {
    setMode(m);
    setErr("");
    setOk("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail || !pw.trim()) {
      setErr("Please enter your email and password.");
      return;
    }

    const admin = admins.find((a) => a.email.toLowerCase() === mail);
    if (admin) {
      setErr("");
      onLogin({
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isClient: false,
      });
      return;
    }

    const client = clients.find((c) => (c.email || "").toLowerCase() === mail);
    if (client) {
      setErr("");
      onLogin({
        email: client.email,
        name: client.name,
        role: "Client",
        isClient: true,
        clientId: client.id,
      });
      return;
    }

    const reg = registrations.find((r) => r.email.toLowerCase() === mail);
    if (reg) {
      if (reg.status === "Pending") {
        setErr(
          `Your account is still awaiting admin approval. You'll be able to sign in once ${SUPER_ADMIN} approves it.`,
        );
        return;
      }
      if (reg.status === "Denied") {
        setErr(
          `Your registration request was denied by the administrator. Please contact ${SUPER_ADMIN}.`,
        );
        return;
      }
      setErr("");
      onLogin({
        email: reg.email,
        name: reg.name,
        role: reg.role,
        isClient: reg.accountType === "Client",
      });
      return;
    }

    setErr("No account found for this email. Create an account to request access.");
  }

  function register(e: FormEvent) {
    e.preventDefault();
    const mail = rEmail.trim().toLowerCase();

    if (!rName.trim() || !mail || !rBranch || !rPw.trim()) {
      setErr("Please complete all fields.");
      setOk("");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      setErr("Please enter a valid email address.");
      setOk("");
      return;
    }
    if (clientEmails.includes(mail)) {
      setErr("This email already belongs to a client account.");
      setOk("");
      return;
    }
    if (admins.some((a) => a.email.toLowerCase() === mail)) {
      setErr("This email already has admin access — just sign in.");
      setOk("");
      return;
    }
    if (registrations.some((r) => r.email.toLowerCase() === mail)) {
      setErr("A registration request already exists for this email.");
      setOk("");
      return;
    }

    setErr("");
    onRegister({
      id: Date.now(),
      name: rName.trim(),
      email: mail,
      branch: rBranch,
      accountType: rType,
      role: rType === "Client" ? "Client" : rRole,
      contact: rContact,
      password: rPw,
      status: "Pending",
      requestedAt: new Date().toISOString(),
    });

    setOk(
      rType === "Client"
        ? `Request submitted! Once approved by ${SUPER_ADMIN}, this client will be added to the Clients directory.`
        : `Request submitted! Once approved by ${SUPER_ADMIN}, this staff account will be added under Accounts and can sign in.`,
    );

    setRName("");
    setREmail("");
    setRBranch("");
    setRPw("");
    setRRole("Branch Staff");
    setRContact("");
    setRType("Staff");
  }

  const brandStat: Array<[string, string]> =
    mode === "signin"
      ? [
          [String(branches.length), "Branches"],
          [String(clients.length), "Clients"],
          [String(pets.length), "Pets"],
        ]
      : [
          [String(branches.length), "Branches"],
          ["6", "Services"],
          ["24/7", "Support"],
        ];

  const errorBox = err && (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 16,
        padding: "9px 13px",
        borderRadius: 9,
        background: "rgba(248,113,113,.12)",
        border: "1px solid #fecaca",
      }}
    >
      <Icon d={Icons.x} size={14} color={T.danger} stroke />
      <p
        style={{
          fontSize: 12.5,
          color: T.danger,
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        {err}
      </p>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter',system-ui,sans-serif",
        background: T.bg,
      }}
    >
      {/* ── Brand panel ── */}
      <div
        style={{
          flex: "1 1 46%",
          background: `linear-gradient(150deg, ${T.sidebar} 0%, #0c4d38 55%, ${T.accentDark} 140%)`,
          color: "#fff",
          padding: "56px 60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -70,
            left: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(16,185,129,.12)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 5,
              boxShadow: "0 4px 16px rgba(0,0,0,.35)",
              border: "1px solid rgba(255,255,255,.6)",
            }}
          >
            <img
              src="/logo.png"
              alt="Pet Hub"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 18, letterSpacing: ".03em" }}>
              PetHub
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: "rgba(255,255,255,.5)",
                fontWeight: 500,
                letterSpacing: ".05em",
              }}
            >
              Rewards Admin Portal
            </p>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-.02em",
              marginBottom: 16,
            }}
          >
            Manage your clinics,
            <br />
            clients &amp; loyalty rewards
            <br />
            in one place.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,.65)",
              lineHeight: 1.6,
              maxWidth: 420,
            }}
          >
            Track appointments, scan loyalty cards, run promotions and monitor
            revenue across all {branches.length} Pet Hub branches.
          </p>
          <div style={{ display: "flex", gap: 28, marginTop: 34 }}>
            {brandStat.map(([n, l]) => (
              <div key={l}>
                <p style={{ fontSize: 26, fontWeight: 800 }}>{n}</p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "rgba(255,255,255,.55)",
                  }}
                >
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,.4)",
            position: "relative",
          }}
        >
          Cafecircuit © 2025 · PetHub Rewards
        </p>
      </div>

      {/* ── Form panel ── */}
      <div
        style={{
          flex: "1 1 54%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
        }}
      >
        {mode === "signin" ? (
          <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
            <p
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: T.accent,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 8,
              }}
            >
              Welcome back
            </p>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: T.text,
                letterSpacing: "-.02em",
                marginBottom: 6,
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ fontSize: 13.5, color: T.muted, marginBottom: 28 }}>
              Enter your staff credentials to continue.
            </p>

            {errorBox}

            <Field label="Email Address">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@pethub.ph"
                style={css.input}
                autoFocus
              />
            </Field>

            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  type={show ? "text" : "password"}
                  placeholder="Enter your password"
                  style={{ ...css.input, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    display: "flex",
                  }}
                >
                  <Icon
                    d={Icons.eye}
                    size={16}
                    color={show ? T.accent : T.subtle}
                    stroke
                  />
                </button>
              </div>
            </Field>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "4px 0 22px",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13,
                  color: T.muted,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ accentColor: T.accent, width: 15, height: 15 }}
                />{" "}
                Remember me
              </label>
              <span
                style={{ fontSize: 13, color: T.accent, fontWeight: 600, cursor: "pointer" }}
              >
                Forgot password?
              </span>
            </div>

            <button
              type="submit"
              style={{
                ...css.btnPrimary,
                width: "100%",
                justifyContent: "center",
                fontSize: 14.5,
                padding: "12px 0",
              }}
            >
              Sign In
            </button>

            <p
              style={{
                fontSize: 13,
                color: T.muted,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Don't have an account?{" "}
              <span
                onClick={() => switchMode("register")}
                style={{ color: T.accent, fontWeight: 700, cursor: "pointer" }}
              >
                Request access
              </span>
            </p>
            <p
              style={{
                fontSize: 12,
                color: T.subtle,
                textAlign: "center",
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              Demo — sign in with{" "}
              <span style={{ color: T.text, fontWeight: 600 }}>
                {SUPER_ADMIN}
              </span>{" "}
              and any password.
            </p>
          </form>
        ) : (
          <form onSubmit={register} style={{ width: "100%", maxWidth: 400 }}>
            <p
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: T.accent,
                textTransform: "uppercase",
                letterSpacing: ".1em",
                marginBottom: 8,
              }}
            >
              New account
            </p>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: T.text,
                letterSpacing: "-.02em",
                marginBottom: 6,
              }}
            >
              Request portal access
            </h2>
            <p style={{ fontSize: 13.5, color: T.muted, marginBottom: 24 }}>
              Your request will be reviewed by{" "}
              <strong style={{ color: T.text }}>{SUPER_ADMIN}</strong>. You can
              sign in once it's approved.
            </p>

            {errorBox}
            {ok && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 16,
                  padding: "11px 13px",
                  borderRadius: 9,
                  background: "rgba(34,197,138,.12)",
                  border: `1px solid ${T.accent}44`,
                }}
              >
                <Icon d={Icons.check} size={15} color={T.accent} stroke />
                <p
                  style={{
                    fontSize: 12.5,
                    color: T.accentDark,
                    fontWeight: 600,
                    lineHeight: 1.5,
                  }}
                >
                  {ok}
                </p>
              </div>
            )}

            <Field label="Full Name">
              <input
                value={rName}
                onChange={(e) => setRName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                style={css.input}
              />
            </Field>

            <Field label="Account Type">
              <div style={{ display: "flex", gap: 10 }}>
                {(
                  [
                    ["Staff", "Staff / Admin"],
                    ["Client", "Client"],
                  ] as Array<[AccountType, string]>
                ).map(([val, label]) => (
                  <label
                    key={val}
                    onClick={() => setRType(val)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13.5,
                      cursor: "pointer",
                      padding: "10px 0",
                      borderRadius: 8,
                      border: `2px solid ${rType === val ? T.accent : T.border}`,
                      background: rType === val ? `${T.accent}10` : T.surface,
                      fontWeight: rType === val ? 700 : 500,
                      color: rType === val ? T.accentLite : T.muted,
                    }}
                  >
                    <input
                      type="radio"
                      name="rtype"
                      checked={rType === val}
                      onChange={() => setRType(val)}
                      style={{ display: "none" }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Email Address">
              <input
                value={rEmail}
                onChange={(e) => setREmail(e.target.value)}
                type="email"
                placeholder="you@pethub.ph"
                style={css.input}
              />
            </Field>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Field label="Branch">
                <select
                  value={rBranch}
                  onChange={(e) => setRBranch(e.target.value)}
                  style={css.input}
                >
                  <option value="">Select…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {shortBranch(b.name)}
                    </option>
                  ))}
                </select>
              </Field>

              {rType === "Staff" ? (
                <Field label="Requested Role">
                  <select
                    value={rRole}
                    onChange={(e) => setRRole(e.target.value)}
                    style={css.input}
                  >
                    <option>Branch Staff</option>
                    <option>Branch Manager</option>
                    <option>Veterinarian</option>
                  </select>
                </Field>
              ) : (
                <Field label="Contact Number">
                  <input
                    value={rContact}
                    onChange={(e) => setRContact(e.target.value)}
                    placeholder="09XXXXXXXXX"
                    style={css.input}
                  />
                </Field>
              )}
            </div>

            <Field label="Password">
              <input
                value={rPw}
                onChange={(e) => setRPw(e.target.value)}
                type="password"
                placeholder="Create a password"
                style={css.input}
              />
            </Field>

            <button
              type="submit"
              style={{
                ...css.btnPrimary,
                width: "100%",
                justifyContent: "center",
                fontSize: 14.5,
                padding: "12px 0",
                marginTop: 4,
              }}
            >
              Submit Request
            </button>

            <p
              style={{
                fontSize: 13,
                color: T.muted,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Already have access?{" "}
              <span
                onClick={() => switchMode("signin")}
                style={{ color: T.accent, fontWeight: 700, cursor: "pointer" }}
              >
                Back to sign in
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
