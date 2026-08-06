import { useMemo, useState } from "react";
import { Icon, Icons } from "@/components";
import { NAV_ITEMS, type PageId } from "@/nav";
import {
  AccountsPage,
  BranchesPage,
  CardRequestsPage,
  ClientPortal,
  ClientsPage,
  Dashboard,
  LoginScreen,
  PromotionsPage,
  TransactionHistory,
  TransactionScanner,
} from "@/pages";
import { ADMINS } from "@/data/seed";
import { useDb } from "@/api/useDb";
import { STORAGE_KEYS, usePersist } from "@/api/persist";
import { NEAR_EXPIRY_DAYS, SUPER_ADMIN } from "@/lib/constants";
import { daysUntilExpiry } from "@/lib/loyalty";
import { branchLabel } from "@/lib/branch";
import { T, css } from "@/theme";
import type { AuthUser, Registration } from "@/types";

interface SearchResult {
  type: string;
  label: string;
  sub: string;
  page: PageId;
}

interface Notification {
  tone: string;
  title: string;
  sub: string;
  page: PageId;
}

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [hovNav, setHovNav] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [authed, setAuthed] = usePersist<boolean>(STORAGE_KEYS.auth, false);
  const [user, setUser] = usePersist<AuthUser | null>(STORAGE_KEYS.user, null);
  const [registrations, setRegistrations] = usePersist<Registration[]>(
    STORAGE_KEYS.registrations,
    [],
  );

  const db = useDb(user, registrations, setRegistrations);
  const { clients, pets, branches, appointments } = db;

  /* ── Global search ── */
  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    clients.forEach((c) => {
      const elocal = (c.email || "").split("@")[0].toLowerCase();
      if (
        c.name.toLowerCase().includes(q) ||
        elocal.includes(q) ||
        (c.contact || "").toLowerCase().includes(q)
      ) {
        out.push({
          type: "Client",
          label: c.name,
          sub: c.email,
          page: "clients",
        });
      }
    });

    pets.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.breed || "").toLowerCase().includes(q) ||
        (p.membershipNo || "").toLowerCase().includes(q)
      ) {
        out.push({
          type: "Pet",
          label: p.name,
          sub: `${p.breed || p.species} · ${p.membershipNo || ""}`,
          page: "clients",
        });
      }
    });

    branches.forEach((b) => {
      if (b.name.toLowerCase().includes(q)) {
        out.push({
          type: "Branch",
          label: branchLabel(b.name),
          sub: b.location,
          page: "branches",
        });
      }
    });

    appointments.forEach((a) => {
      const pet = pets.find((p) => p.id === a.petId);
      if (
        (pet && pet.name.toLowerCase().includes(q)) ||
        a.service.toLowerCase().includes(q) ||
        a.vet.toLowerCase().includes(q)
      ) {
        out.push({
          type: "Appointment",
          label: `${a.service} — ${pet?.name || ""}`,
          sub: `${a.date} · ${a.vet}`,
          page: "history",
        });
      }
    });

    return out.slice(0, 8);
  }, [searchQ, clients, pets, branches, appointments]);

  /* ── Notifications (mirror the dashboard reminders) ── */
  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];

    pets
      .filter((p) => p.hasCard)
      .forEach((p) => {
        const days = daysUntilExpiry(p);
        if (days === null) return;
        const owner = clients.find((c) => c.id === p.clientId);
        if (days <= 0) {
          list.push({
            tone: T.danger,
            title: `${p.name}'s loyalty card expired`,
            sub: `${owner?.name || ""} · expired ${Math.abs(days)} days ago`,
            page: "clients",
          });
        } else if (days <= NEAR_EXPIRY_DAYS) {
          list.push({
            tone: T.warn,
            title: `${p.name}'s card expiring soon`,
            sub: `${owner?.name || ""} · ${days} days left`,
            page: "clients",
          });
        }
      });

    const pendingPrints = pets.filter(
      (p) => p.printStatus === "Pending",
    ).length;
    if (pendingPrints > 0) {
      list.unshift({
        tone: T.warn,
        title: `${pendingPrints} loyalty cards to print`,
        sub: "Physical card printing queue",
        page: "dashboard",
      });
    }

    const pendingRegs = registrations.filter(
      (r) => r.status === "Pending",
    ).length;
    if (pendingRegs > 0 && user?.email === SUPER_ADMIN) {
      list.unshift({
        tone: T.danger,
        title: `${pendingRegs} account request${pendingRegs !== 1 ? "s" : ""} to review`,
        sub: "Approve or deny new sign-ups",
        page: "accounts",
      });
    }

    return list;
  }, [pets, clients, registrations, user]);

  function login(u: AuthUser) {
    setUser(u);
    setAuthed(true);
  }

  function logout() {
    setUser(null);
    setAuthed(false);
    setProfileOpen(false);
    setPage("dashboard");
  }

  const registerRequest = (reg: Registration) =>
    setRegistrations((p) => [...p, reg]);

  function renderPage() {
    switch (page) {
      case "transaction":
        return <TransactionScanner db={db} />;
      case "history":
        return <TransactionHistory db={db} />;
      case "cardrequests":
        return <CardRequestsPage db={db} />;
      case "branches":
        return <BranchesPage db={db} />;
      case "accounts":
        return <AccountsPage db={db} />;
      case "clients":
        return <ClientsPage db={db} />;
      case "promotions":
        return <PromotionsPage db={db} />;
      case "dashboard":
      default:
        return <Dashboard db={db} />;
    }
  }

  if (!authed || !user) {
    return (
      <LoginScreen
        onLogin={login}
        onRegister={registerRequest}
        admins={ADMINS}
        registrations={registrations}
        branches={branches}
        clients={clients}
        pets={pets}
      />
    );
  }

  if (user.isClient) {
    return <ClientPortal user={user} db={db} onLogout={logout} />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Inter',system-ui,sans-serif",
        background: T.bg,
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: collapsed ? 64 : 210,
          background: T.sidebar,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          transition: "width .2s ease",
          zIndex: 50,
        }}
      >
        <div
          style={{
            padding: collapsed ? "12px 0" : "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255,255,255,.07)",
            justifyContent: collapsed ? "center" : "flex-start",
            minHeight: 72,
          }}
        >
          <img
            src="/logo-gold.png"
            alt="Pet Hub Logo"
            style={{
              width: collapsed ? 40 : 46,
              height: collapsed ? 40 : 46,
              borderRadius: "50%",
              objectFit: "contain",
              background: "linear-gradient(135deg,#0f6b4a,#073d2b)",
              padding: 5,
              flexShrink: 0,
              border: "1px solid rgba(212,175,55,.4)",
              transition: "all .2s",
            }}
          />
          {!collapsed && (
            <div>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14.5,
                  letterSpacing: ".04em",
                  lineHeight: 1.1,
                }}
              >
                PET HUB REWARDS
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.4)",
                  fontSize: 10.5,
                  fontWeight: 500,
                  letterSpacing: ".05em",
                }}
              >
                Admin Portal
              </p>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map((item, idx) => {
            const isActive = page === item.id;
            const isHov = hovNav === idx;
            const showGroup =
              item.group &&
              (idx === 0 || NAV_ITEMS[idx - 1].group !== item.group);
            return (
              <div key={item.id}>
                {showGroup && !collapsed && (
                  <p
                    style={{
                      padding: "16px 18px 6px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.3)",
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                    }}
                  >
                    {item.group}
                  </p>
                )}
                <button
                  onClick={() => setPage(item.id)}
                  onMouseEnter={() => setHovNav(idx)}
                  onMouseLeave={() => setHovNav(null)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: collapsed ? "13px 0" : "10px 18px",
                    background: isActive
                      ? "rgba(16,185,129,.15)"
                      : isHov
                        ? "rgba(255,255,255,.05)"
                        : "transparent",
                    border: "none",
                    borderLeft: isActive
                      ? `3px solid ${T.accent}`
                      : "3px solid transparent",
                    cursor: "pointer",
                    color: isActive
                      ? "#fff"
                      : isHov
                        ? "rgba(255,255,255,.85)"
                        : "rgba(255,255,255,.5)",
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 400,
                    transition: "all .15s",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                >
                  <Icon
                    d={item.iconD}
                    size={17}
                    color={
                      isActive
                        ? T.accent
                        : isHov
                          ? "rgba(255,255,255,.85)"
                          : "rgba(255,255,255,.4)"
                    }
                    stroke
                  />
                  {!collapsed && item.label}
                </button>
              </div>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            padding: "14px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "none",
            border: "none",
            borderTop: "1px solid rgba(255,255,255,.07)",
            cursor: "pointer",
            color: "rgba(255,255,255,.35)",
            transition: "color .15s",
          }}
        >
          <Icon
            d={collapsed ? Icons.expand : Icons.collapse}
            size={16}
            color="currentColor"
            stroke
          />
        </button>
      </aside>

      {/* ── Main ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            position: "sticky",
            top: 0,
            zIndex: 40,
            height: 60,
            flexShrink: 0,
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", maxWidth: 340, flex: 1 }}>
            <input
              value={searchQ}
              onChange={(e) => {
                setSearchQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search clients, pets, transactions…"
              style={{ ...css.input, paddingLeft: 38, fontSize: 13 }}
            />
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <Icon d={Icons.search} size={15} color={T.subtle} stroke />
            </span>

            {searchOpen && searchQ.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "rgba(255,255,255,.12)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,.22)",
                  boxShadow: "0 16px 44px rgba(0,0,0,.35)",
                  overflow: "hidden",
                  zIndex: 60,
                  maxHeight: 380,
                  overflowY: "auto",
                }}
              >
                {searchResults.length === 0 ? (
                  <p
                    style={{
                      padding: "18px",
                      fontSize: 13,
                      color: T.subtle,
                      textAlign: "center",
                    }}
                  >
                    No results for “{searchQ}”.
                  </p>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      onMouseDown={() => {
                        setPage(r.page);
                        setSearchQ("");
                        setSearchOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        padding: "10px 14px",
                        border: "none",
                        borderBottom:
                          i < searchResults.length - 1
                            ? `1px solid ${T.border}`
                            : "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: T.muted,
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                          background: T.bg,
                          borderRadius: 6,
                          padding: "3px 7px",
                          flexShrink: 0,
                          minWidth: 74,
                          textAlign: "center",
                        }}
                      >
                        {r.type}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: T.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.label}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11.5,
                            color: T.muted,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.sub}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                style={{
                  background: notifOpen ? T.bg : "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.muted,
                  padding: 6,
                  borderRadius: 8,
                  position: "relative",
                }}
              >
                <Icon d={Icons.bell} size={19} color={T.muted} stroke />
                {notifications.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 1,
                      right: 1,
                      minWidth: 15,
                      height: 15,
                      borderRadius: 99,
                      background: T.danger,
                      border: `2px solid ${T.surface}`,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    onClick={() => setNotifOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 55 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      width: 320,
                      background: "rgba(255,255,255,.12)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,.22)",
                      boxShadow: "0 16px 44px rgba(0,0,0,.35)",
                      overflow: "hidden",
                      zIndex: 60,
                    }}
                  >
                    <div
                      style={{
                        padding: "13px 16px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: T.text,
                        }}
                      >
                        Notifications
                      </p>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: T.danger,
                          borderRadius: 99,
                          padding: "2px 8px",
                        }}
                      >
                        {notifications.length}
                      </span>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <p
                          style={{
                            padding: "24px 16px",
                            fontSize: 13,
                            color: T.subtle,
                            textAlign: "center",
                          }}
                        >
                          You're all caught up.
                        </p>
                      ) : (
                        notifications.map((n, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setPage(n.page);
                              setNotifOpen(false);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              gap: 11,
                              alignItems: "flex-start",
                              padding: "11px 16px",
                              border: "none",
                              borderBottom:
                                i < notifications.length - 1
                                  ? `1px solid ${T.border}`
                                  : "none",
                              background: "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: n.tone,
                                marginTop: 5,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ minWidth: 0 }}>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: T.text,
                                  lineHeight: 1.35,
                                }}
                              >
                                {n.title}
                              </span>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: 11.5,
                                  color: T.muted,
                                  marginTop: 1,
                                }}
                              >
                                {n.sub}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ width: 1, height: 28, background: T.border }} />

            {/* Profile */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setProfileOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "4px 6px",
                  borderRadius: 9,
                  background: profileOpen ? T.bg : "transparent",
                }}
              >
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
                    {user.name}
                  </p>
                  <p style={{ fontSize: 11, color: T.muted }}>{user.role}</p>
                </div>
                <Icon d={Icons.chevronD} size={14} color={T.subtle} stroke />
              </div>

              {profileOpen && (
                <>
                  <div
                    onClick={() => setProfileOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 55 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      width: 230,
                      background: "rgba(255,255,255,.12)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,.22)",
                      boxShadow: "0 16px 44px rgba(0,0,0,.35)",
                      overflow: "hidden",
                      zIndex: 60,
                    }}
                  >
                    <div
                      style={{
                        padding: "14px 16px",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: T.text,
                        }}
                      >
                        {user.name}
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          color: T.muted,
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.email}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: T.accent,
                          background: `${T.accent}15`,
                          borderRadius: 6,
                          padding: "3px 8px",
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div style={{ padding: 6 }}>
                      {(
                        [
                          ["Account settings", Icons.edit],
                          ["Notification preferences", Icons.bell],
                        ] as Array<[string, string]>
                      ).map(([label, ic]) => (
                        <button
                          key={label}
                          onClick={() => setProfileOpen(false)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "9px 10px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            borderRadius: 8,
                            fontSize: 13,
                            color: T.text,
                            textAlign: "left",
                          }}
                        >
                          <Icon d={ic} size={15} color={T.muted} stroke />{" "}
                          {label}
                        </button>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: 6,
                        borderTop: `1px solid ${T.border}`,
                      }}
                    >
                      <button
                        onClick={logout}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 10px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: T.danger,
                          textAlign: "left",
                        }}
                      >
                        <Icon
                          d={Icons.logout}
                          size={16}
                          color={T.danger}
                          stroke
                        />{" "}
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main key={page} style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {renderPage()}
        </main>

        <footer
          style={{
            padding: "12px 28px",
            borderTop: `1px solid ${T.border}`,
            background: T.surface,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: T.subtle,
          }}
        >
          <span>PetHub Rewards Admin</span>
          <span>Cafecircuit © 2025</span>
        </footer>
      </div>
    </div>
  );
}
