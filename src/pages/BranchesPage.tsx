import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, Icons, PageHeader, Toast } from "@/components";
import { T, css } from "@/theme";
import type { Branch, Db } from "@/types";

/**
 * Leaflet popups take an HTML string, and branch fields are admin-editable —
 * escape anything interpolated into them.
 */
const esc = (v: string) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const googleMapsUrl = (b: Branch) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${b.name}, ${b.location || ""}`.trim(),
  )}`;

function BranchMap({
  branches,
  selectedId,
  onSelect,
}: {
  branches: Branch[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<L.Map | null>(null);
  const markers = useRef<Record<number, L.Marker>>({});

  // Create the map once. Markers are synced separately so branch edits show up.
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([14.5, 121.0], 8);
    mapObj.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapObj.current = null;
      markers.current = {};
    };
  }, []);

  // Rebuild markers whenever the branch list changes.
  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;

    Object.values(markers.current).forEach((m) => m.remove());
    markers.current = {};

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.35);background:#fff;display:flex;align-items:center;justify-content:center;">
          <img src="/logo-gold.png" style="width:36px;height:36px;object-fit:contain;border-radius:50%;"/>
        </div>
        <div style="width:14px;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #fff;margin:-1px auto 0;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));"></div>`,
      iconSize: [42, 52],
      iconAnchor: [21, 52],
      popupAnchor: [0, -54],
    });

    branches.forEach((b) => {
      if (!b.lat || !b.lng) return;
      const marker = L.marker([b.lat, b.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:200px">
              <p style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px">${esc(b.name)}</p>
              <p style="font-size:11.5px;color:#64748b;margin-bottom:3px">📍 ${esc(b.location)}</p>
              ${b.phone ? `<p style="font-size:11.5px;color:#64748b">📞 ${esc(b.phone)}</p>` : ""}
              ${b.email ? `<p style="font-size:11.5px;color:#10b981">${esc(b.email)}</p>` : ""}
              <a href="${esc(googleMapsUrl(b))}" target="_blank" rel="noopener" style="display:inline-block;margin-top:7px;font-size:11.5px;font-weight:700;color:#fff;background:#10b981;border-radius:7px;padding:5px 10px;text-decoration:none">Open in Google Maps ↗</a>
            </div>`,
          { maxWidth: 260 },
        );
      marker.on("click", () => onSelect(b.id));
      markers.current[b.id] = marker;
    });
  }, [branches, onSelect]);

  useEffect(() => {
    if (!mapObj.current || !selectedId) return;
    const b = branches.find((x) => x.id === selectedId);
    if (b?.lat && b?.lng) {
      mapObj.current.flyTo([b.lat, b.lng], 14, { duration: 1 });
      markers.current[selectedId]?.openPopup();
    }
  }, [selectedId, branches]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: 420,
        borderRadius: 12,
        overflow: "hidden",
        zIndex: 0,
      }}
    />
  );
}

type NewBranch = Pick<Branch, "name" | "email" | "contact" | "location">;
const EMPTY_ROW: NewBranch = {
  name: "",
  email: "",
  contact: "",
  location: "",
};

export function BranchesPage({
  db,
  readOnly = false,
}: {
  db: Db;
  readOnly?: boolean;
}) {
  const { branches, setBranches } = db;
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Branch>>({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<NewBranch>(EMPTY_ROW);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.email || "").toLowerCase().includes(q) ||
        (b.location || "").toLowerCase().includes(q),
    );
  }, [branches, search]);

  function startEdit(b: Branch) {
    setEditingId(b.id);
    setEditForm({ ...b });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }
  function saveEdit() {
    if (!editForm.name) return;
    setBranches((p) =>
      p.map((b) => (b.id === editingId ? ({ ...editForm } as Branch) : b)),
    );
    setEditingId(null);
    setEditForm({});
    setToast("Branch updated.");
  }
  function deleteBranch(id: number) {
    setBranches((p) => p.filter((b) => b.id !== id));
    setToast("Branch removed.");
  }
  function saveNew() {
    if (!newRow.name) return;
    setBranches((p) => [...p, { ...newRow, id: Date.now() }]);
    setNewRow(EMPTY_ROW);
    setAddingNew(false);
    setToast("Branch added.");
  }

  const editKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const cols = ["Branch Name", "Email", "Contact", "Location", "Actions"];

  return (
    <div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <PageHeader title="Branches">
        {!readOnly && (
          <button
            onClick={() => {
              setAddingNew(true);
              setEditingId(null);
            }}
            style={css.btnPrimary}
            disabled={addingNew}
          >
            <Icon d={Icons.plus} size={15} color="#fff" stroke /> Add Branch
          </button>
        )}
      </PageHeader>

      {/* ── Map ── */}
      <div style={{ ...css.card, padding: "20px 24px", marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showMap ? 16 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${T.accent}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon d={Icons.branch} size={16} color={T.accent} stroke />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>
                Branch Locations
              </p>
              <p style={{ fontSize: 12, color: T.muted }}>
                Philippines · {branches.filter((b) => b.lat).length} locations
                pinned
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMap((v) => !v)}
            style={{
              ...css.btnSecondary,
              padding: "6px 14px",
              fontSize: 12.5,
              gap: 6,
            }}
          >
            <Icon
              d={showMap ? Icons.chevronD : Icons.chevronR}
              size={13}
              color={T.muted}
              stroke
            />
            {showMap ? "Hide Map" : "Show Map"}
          </button>
        </div>
        {showMap && (
          <BranchMap
            branches={branches}
            selectedId={selectedBranch}
            onSelect={setSelectedBranch}
          />
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ ...css.card, padding: "22px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <p style={css.sectionLabel}>
            All Branches — <span style={{ color: T.accent }}>{branches.length}</span>
          </p>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search branches…"
              style={{
                ...css.input,
                width: 220,
                paddingLeft: 36,
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
              <Icon d={Icons.search} size={15} color={T.subtle} stroke />
            </span>
          </div>
        </div>

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
                {cols.map((c) => (
                  <th
                    key={c}
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: T.muted,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      letterSpacing: ".03em",
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {addingNew && (
                <tr
                  style={{
                    background: "rgba(34,197,138,.12)",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      value={newRow.name}
                      onChange={(e) =>
                        setNewRow((r) => ({ ...r, name: e.target.value }))
                      }
                      placeholder="Branch name *"
                      autoFocus
                      style={{
                        ...css.input,
                        fontSize: 13,
                        padding: "6px 10px",
                        borderColor: T.accent,
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setAddingNew(false);
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      value={newRow.email}
                      onChange={(e) =>
                        setNewRow((r) => ({ ...r, email: e.target.value }))
                      }
                      placeholder="Email address"
                      type="email"
                      style={{ ...css.input, fontSize: 13, padding: "6px 10px" }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      value={newRow.contact}
                      onChange={(e) =>
                        setNewRow((r) => ({ ...r, contact: e.target.value }))
                      }
                      placeholder="09XXXXXXXXX"
                      style={{ ...css.input, fontSize: 13, padding: "6px 10px" }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <input
                      value={newRow.location}
                      onChange={(e) =>
                        setNewRow((r) => ({ ...r, location: e.target.value }))
                      }
                      placeholder="Full address"
                      style={{ ...css.input, fontSize: 13, padding: "6px 10px" }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={saveNew}
                        style={{
                          ...css.btnPrimary,
                          padding: "5px 14px",
                          fontSize: 12,
                          gap: 5,
                          opacity: newRow.name ? 1 : 0.5,
                        }}
                      >
                        <Icon d={Icons.check} size={13} color="#fff" stroke />{" "}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setAddingNew(false);
                          setNewRow(EMPTY_ROW);
                        }}
                        style={{
                          ...css.btnSecondary,
                          padding: "5px 10px",
                          fontSize: 12,
                        }}
                      >
                        <Icon d={Icons.x} size={13} color={T.muted} stroke />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.length === 0 && !addingNew && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: T.subtle,
                    }}
                  >
                    No branches found.
                  </td>
                </tr>
              )}

              {filtered.map((b, i) => {
                const isEditing = editingId === b.id;
                return (
                  <tr
                    key={b.id}
                    onClick={() => {
                      if (isEditing) return;
                      setSelectedBranch(b.id);
                      if (!showMap) setShowMap(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      background: isEditing
                        ? "rgba(34,197,138,.12)"
                        : selectedBranch === b.id
                          ? `${T.accent}08`
                          : i % 2 === 0
                            ? T.surface
                            : T.surfaceAlt,
                      transition: "background .1s",
                      cursor: isEditing ? "default" : "pointer",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        fontWeight: isEditing ? 400 : 600,
                        color: T.text,
                        minWidth: 220,
                      }}
                    >
                      {isEditing ? (
                        <input
                          value={editForm.name || ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          autoFocus
                          style={{
                            ...css.input,
                            fontSize: 13,
                            padding: "6px 10px",
                            borderColor: T.accent,
                          }}
                          onKeyDown={editKeyDown}
                        />
                      ) : (
                        b.name
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px 14px",
                        color: T.muted,
                        minWidth: 180,
                      }}
                    >
                      {isEditing ? (
                        <input
                          value={editForm.email || ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, email: e.target.value }))
                          }
                          type="email"
                          style={{
                            ...css.input,
                            fontSize: 13,
                            padding: "6px 10px",
                          }}
                          onKeyDown={editKeyDown}
                        />
                      ) : (
                        b.email || <span style={{ color: T.subtle }}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px 14px",
                        color: T.muted,
                        minWidth: 130,
                      }}
                    >
                      {isEditing ? (
                        <input
                          value={editForm.contact || ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              contact: e.target.value,
                            }))
                          }
                          placeholder="09XXXXXXXXX"
                          style={{
                            ...css.input,
                            fontSize: 13,
                            padding: "6px 10px",
                          }}
                          onKeyDown={editKeyDown}
                        />
                      ) : (
                        b.contact ||
                        b.phone || <span style={{ color: T.subtle }}>—</span>
                      )}
                    </td>

                    <td
                      style={{
                        padding: "10px 14px",
                        color: T.muted,
                        minWidth: 200,
                        maxWidth: 300,
                      }}
                    >
                      {isEditing ? (
                        <input
                          value={editForm.location || ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              location: e.target.value,
                            }))
                          }
                          style={{
                            ...css.input,
                            fontSize: 13,
                            padding: "6px 10px",
                          }}
                          onKeyDown={editKeyDown}
                        />
                      ) : (
                        <a
                          href={googleMapsUrl(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open "${b.location}" in Google Maps`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            maxWidth: 280,
                            color: T.info,
                            textDecoration: "none",
                            fontWeight: 500,
                          }}
                        >
                          <Icon
                            d={Icons.branch}
                            size={13}
                            color={T.info}
                            stroke
                          />
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {b.location || "—"}
                          </span>
                        </a>
                      )}
                    </td>

                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={saveEdit}
                            style={{
                              ...css.btnPrimary,
                              padding: "5px 14px",
                              fontSize: 12,
                              gap: 5,
                            }}
                          >
                            <Icon
                              d={Icons.check}
                              size={13}
                              color="#fff"
                              stroke
                            />{" "}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              ...css.btnSecondary,
                              padding: "5px 10px",
                              fontSize: 12,
                            }}
                          >
                            <Icon
                              d={Icons.x}
                              size={13}
                              color={T.muted}
                              stroke
                            />
                          </button>
                        </div>
                      ) : readOnly ? null : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(b);
                            }}
                            style={{
                              ...css.btnSecondary,
                              padding: "5px 12px",
                              fontSize: 12,
                              gap: 5,
                            }}
                          >
                            <Icon
                              d={Icons.edit}
                              size={13}
                              color={T.muted}
                              stroke
                            />{" "}
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBranch(b.id);
                            }}
                            style={{
                              ...css.btnSecondary,
                              padding: "5px 10px",
                              fontSize: 12,
                              borderColor: "rgba(248,113,113,.4)",
                              color: T.danger,
                            }}
                          >
                            <Icon
                              d={Icons.x}
                              size={13}
                              color={T.danger}
                              stroke
                            />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 12, fontSize: 12, color: T.subtle }}>
          Tip: Click <strong>Edit</strong> to edit inline. Press{" "}
          <kbd
            style={{
              background: T.border,
              borderRadius: 4,
              padding: "1px 5px",
              fontSize: 11,
            }}
          >
            Enter
          </kbd>{" "}
          to save or{" "}
          <kbd
            style={{
              background: T.border,
              borderRadius: 4,
              padding: "1px 5px",
              fontSize: 11,
            }}
          >
            Esc
          </kbd>{" "}
          to cancel.
        </p>
      </div>
    </div>
  );
}
