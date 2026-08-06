import { useMemo, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Icons } from "./icons";
import { T, css } from "@/theme";

export interface Column<Row> {
  key: string;
  label: ReactNode;
  /** Defaults to true. */
  sortable?: boolean;
  /** Render the raw cell value in the muted colour. */
  muted?: boolean;
  render?: (row: Row) => ReactNode;
}

type Indexable = Record<string, unknown>;

const cell = (row: unknown, key: string): unknown => (row as Indexable)[key];

export function DataTable<Row extends { id?: number | string }>({
  data,
  columns,
  actions,
  rowsPerPage = 10,
}: {
  data: Row[];
  columns: Column<Row>[];
  actions?: (row: Row) => ReactNode;
  rowsPerPage?: number;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(rowsPerPage);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hovRow, setHovRow] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) =>
      columns.some((c) =>
        String(cell(r, c.key) ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(cell(a, sortKey) ?? "");
      const bv = String(cell(b, sortKey) ?? "");
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pages);
  const slice = sorted.slice((safePage - 1) * perPage, safePage * perPage);
  const from = sorted.length ? (safePage - 1) * perPage + 1 : 0;
  const to = Math.min(safePage * perPage, sorted.length);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: T.muted,
          }}
        >
          Show
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            style={{
              ...css.input,
              width: "auto",
              padding: "5px 10px",
              fontSize: 13,
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          entries
        </div>
        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search…"
            style={{ ...css.input, width: 220, paddingLeft: 36 }}
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

      {/* Table */}
      <div
        style={{
          borderRadius: 10,
          border: `1px solid ${T.border}`,
          overflow: "auto",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}
        >
          <thead>
            <tr
              style={{
                background: T.surfaceAlt,
                borderBottom: `2px solid ${T.border}`,
              }}
            >
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={
                    c.sortable !== false ? () => toggleSort(c.key) : undefined
                  }
                  style={{
                    padding: "11px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: T.muted,
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    cursor: c.sortable !== false ? "pointer" : "default",
                    letterSpacing: ".03em",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {c.label}
                    {c.sortable !== false && (
                      <span
                        style={{
                          color: sortKey === c.key ? T.accent : T.subtle,
                          fontSize: 9,
                        }}
                      >
                        {sortKey === c.key
                          ? sortDir === "asc"
                            ? "▲"
                            : "▼"
                          : "⇅"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th
                  style={{
                    padding: "11px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: T.muted,
                    fontSize: 12,
                  }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: T.subtle,
                    fontSize: 13,
                  }}
                >
                  No matching records found.
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onMouseEnter={() => setHovRow(i)}
                  onMouseLeave={() => setHovRow(null)}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background:
                      hovRow === i
                        ? T.surfaceAlt
                        : i % 2 === 0
                          ? T.surface
                          : T.surfaceAlt,
                    transition: "background .1s",
                  }}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: "11px 16px",
                        color: T.text,
                        verticalAlign: "middle",
                      }}
                    >
                      {c.render ? (
                        c.render(row)
                      ) : (
                        <span style={{ color: c.muted ? T.muted : T.text }}>
                          {String(cell(row, c.key) ?? "")}
                        </span>
                      )}
                    </td>
                  ))}
                  {actions && (
                    <td
                      style={{ padding: "11px 16px", verticalAlign: "middle" }}
                    >
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, color: T.muted }}>
          Showing{" "}
          <strong style={{ color: T.text }}>
            {from}–{to}
          </strong>{" "}
          of <strong style={{ color: T.text }}>{sorted.length}</strong> entries
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { label: "← Prev", v: safePage - 1, dis: safePage <= 1 },
            { label: "Next →", v: safePage + 1, dis: safePage >= pages },
          ].map(
            (btn) =>
              !btn.dis && (
                <button
                  key={btn.label}
                  onClick={() => setPage(btn.v)}
                  style={{
                    ...css.btnSecondary,
                    padding: "5px 14px",
                    fontSize: 12.5,
                    borderColor: T.border,
                  }}
                >
                  {btn.label}
                </button>
              ),
          )}
          {Array.from({ length: pages }, (_, i) => i + 1)
            .slice(Math.max(0, safePage - 2), safePage + 1)
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  border: "none",
                  background: p === safePage ? T.accent : "transparent",
                  color: p === safePage ? "#fff" : T.muted,
                  fontWeight: p === safePage ? 700 : 500,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {p}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
