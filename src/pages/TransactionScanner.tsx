import { useEffect, useRef, useState } from "react";
import { Icon, Icons, Modal, PageHeader, Toast } from "@/components";
import { T, css } from "@/theme";
import { CARD_VALIDITY_YEARS } from "@/lib/constants";
import { parseMembershipDate } from "@/lib/loyalty";
import { downloadDataUrl, fileToDataUrl } from "@/lib/files";
import type { Client, Db, Pet, Transaction } from "@/types";

/** ₱300 spent earns 1 loyalty point. */
const POINTS_RATE = 300;

interface ReceiptFile {
  name: string;
  data: string;
  type: string;
}

interface ScanResult {
  pet: Pet;
  client: Client | undefined;
}

/** Card expiry rendered long-form, e.g. "May 26, 2026". */
function getExpiry(dateStr: string | undefined): string {
  const d = parseMembershipDate(dateStr);
  if (!d) return "—";
  d.setFullYear(d.getFullYear() + CARD_VALIDITY_YEARS);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function TransactionScanner({ db }: { db: Db }) {
  const {
    pets: localPets,
    setPets: setLocalPets,
    clients,
    transactions,
    setTransactions,
    user,
  } = db;

  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTxnForm, setShowTxnForm] = useState(false);
  const [txnType, setTxnType] = useState<"gain" | "redeem">("gain");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnFile, setTxnFile] = useState<ReceiptFile | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Transaction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pickReceiptFile(file: File | null) {
    if (!file) {
      setTxnFile(null);
      return;
    }
    setTxnFile({
      name: file.name,
      data: await fileToDataUrl(file),
      type: file.type,
    });
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (scanning) inputRef.current?.focus();
  }, [scanning]);

  function lookup(val: string) {
    setError(false);
    const v = val.trim().replace(/\s+/g, "");
    const found = localPets.find(
      (p) =>
        String(p.id) === v ||
        p.name.toLowerCase() === v.toLowerCase() ||
        (p.membershipNo &&
          p.membershipNo.replace(/\s+/g, "").toLowerCase() ===
            v.toLowerCase()),
    );
    if (found) {
      setResult({
        pet: found,
        client: clients.find((c) => c.id === found.clientId),
      });
      setTxnAmount("");
      setTxnFile(null);
      setTxnType("gain");
      setShowHistory(false);
      setShowTxnForm(false);
    } else {
      setResult(null);
      setError(true);
    }
  }

  function clearResult() {
    setResult(null);
    setError(false);
    setCode("");
    inputRef.current?.focus();
  }

  function deleteRecord() {
    if (!result) return;
    setLocalPets((p) => p.filter((x) => x.id !== result.pet.id));
    setResult(null);
    setConfirmDel(false);
    setCode("");
    setToast("Loyalty card record deleted.");
    inputRef.current?.focus();
  }

  const petTxns = result
    ? transactions
        .filter((t) => t.petId === result.pet.id)
        .sort((a, b) => b.id - a.id)
    : [];
  const totalPoints = petTxns.reduce(
    (s, t) => s + t.pointsGained - t.pointsUsed,
    0,
  );

  const pointsToGain =
    txnType === "gain" && txnAmount
      ? Math.floor(Number(txnAmount) / POINTS_RATE)
      : 0;
  const pointsToRedeem =
    txnType === "redeem" && txnAmount ? Number(txnAmount) : 0;
  const redeemError = txnType === "redeem" && pointsToRedeem > totalPoints;

  function saveTxn() {
    if (!txnAmount || !result || redeemError) return;
    const newTxn: Transaction = {
      id: Date.now(),
      petId: result.pet.id,
      transactionId: String(transactions.length + 1),
      amount: txnType === "gain" ? Number(txnAmount) : 0,
      pointsGained: txnType === "gain" ? pointsToGain : 0,
      pointsUsed: txnType === "redeem" ? pointsToRedeem : 0,
      transactBy: user?.name || "Jeremiah Munoz",
      receipt: txnFile ? txnFile.name : "—",
      receiptData: txnFile ? txnFile.data : null,
      receiptType: txnFile ? txnFile.type : null,
      date: new Date().toISOString().slice(0, 10),
    };
    setTransactions((p) => [newTxn, ...p]);
    setTxnAmount("");
    setTxnFile(null);
    setToast(
      txnType === "gain"
        ? `+${pointsToGain} points gained! New total: ${totalPoints + pointsToGain}`
        : `${pointsToRedeem} points redeemed. Remaining: ${totalPoints - pointsToRedeem}`,
    );
  }

  /** Renders the VIP card to a canvas and downloads it as a PNG. */
  function downloadCard(p: Pet, c: Client | undefined, points: number) {
    const W = 600,
      H = 380,
      r = 34;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const x = cv.getContext("2d");
    if (!x) return;

    const rr = (a: number, b: number, w: number, h: number, rad: number) => {
      x.beginPath();
      x.moveTo(a + rad, b);
      x.arcTo(a + w, b, a + w, b + h, rad);
      x.arcTo(a + w, b + h, a, b + h, rad);
      x.arcTo(a, b + h, a, b, rad);
      x.arcTo(a, b, a + w, b, rad);
      x.closePath();
    };

    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0a4d37");
    g.addColorStop(0.5, "#0f6b4a");
    g.addColorStop(1, "#073d2b");
    rr(0, 0, W, H, r);
    x.fillStyle = g;
    x.fill();

    x.save();
    rr(0, 0, W, H, r);
    x.clip();
    x.fillStyle = "rgba(212,175,55,.10)";
    x.beginPath();
    x.arc(W - 40, -30, 240, 0, 7);
    x.fill();
    x.fillStyle = "rgba(255,255,255,.05)";
    x.beginPath();
    x.arc(120, H + 50, 320, 0, 7);
    x.fill();
    x.restore();

    x.strokeStyle = "rgba(212,175,55,.55)";
    x.lineWidth = 2;
    rr(14, 14, W - 28, H - 28, r - 8);
    x.stroke();

    const gold = x.createLinearGradient(40, 0, 300, 0);
    gold.addColorStop(0, "#f4e2a1");
    gold.addColorStop(1, "#d4af37");

    const draw = () => {
      x.textBaseline = "top";
      x.font = "800 18px Inter,sans-serif";
      const bt = "★ PET HUB REWARDS ★";
      const btw = x.measureText(bt).width;
      rr(44, 42, btw + 24, 30, 7);
      x.fillStyle = gold;
      x.fill();
      x.fillStyle = "#0a4d37";
      x.fillText(bt, 56, 49);

      x.fillStyle = "#fff";
      x.font = "800 46px Inter,sans-serif";
      x.fillText((p.name || "").toUpperCase(), 44, 86);

      x.fillStyle = "#e9d9a0";
      x.font = "700 22px Inter,sans-serif";
      x.fillText((p.breed || p.species || "").toUpperCase(), 44, 140);

      const lg = x.createLinearGradient(44, 0, 260, 0);
      lg.addColorStop(0, "rgba(212,175,55,.7)");
      lg.addColorStop(1, "rgba(212,175,55,0)");
      x.fillStyle = lg;
      x.fillRect(44, 180, 216, 2);

      x.fillStyle = "rgba(255,255,255,.92)";
      x.font = "400 21px Inter,sans-serif";
      x.fillText(`Owner: ${c?.name || "—"}`, 44, 198);
      x.fillText("Points: ", 44, 234);
      const pw = x.measureText("Points: ").width;
      x.fillStyle = "#f4e2a1";
      x.font = "700 21px Inter,sans-serif";
      x.fillText(String(points), 44 + pw, 234);
      x.fillStyle = "rgba(255,255,255,.92)";
      x.font = "400 21px Inter,sans-serif";
      x.fillText(`Expires: ${getExpiry(p.membershipDate)}`, 44, 270);

      if (p.membershipNo) {
        x.fillStyle = "rgba(233,217,160,.8)";
        x.font = "600 15px Inter,sans-serif";
        x.fillText(p.membershipNo, 44, 310);
      }

      downloadDataUrl(
        cv.toDataURL("image/png"),
        `VIP-LoyaltyCard-${(p.name || "pet").replace(/\s+/g, "-")}.png`,
      ).then(
        () => setToast("VIP loyalty card downloaded."),
        (err: Error) => setToast(err.message),
      );
    };

    if (p.photo) {
      const im = new Image();
      im.onload = () => {
        x.save();
        x.beginPath();
        x.arc(W - 86, 96, 52, 0, 7);
        x.closePath();
        x.strokeStyle = "rgba(212,175,55,.7)";
        x.lineWidth = 3;
        x.stroke();
        x.clip();
        x.drawImage(im, W - 138, 44, 104, 104);
        x.restore();
        draw();
      };
      im.onerror = draw;
      im.src = p.photo;
    } else {
      draw();
    }
  }

  async function setPetPhoto(petId: number, file: File | undefined) {
    if (!file) return;
    const photo = await fileToDataUrl(file);
    setLocalPets((prev) =>
      prev.map((x) => (x.id === petId ? { ...x, photo } : x)),
    );
    setResult((r) => (r ? { ...r, pet: { ...r.pet, photo } } : r));
  }

  function clearPetPhoto(petId: number) {
    setLocalPets((prev) =>
      prev.map((x) => (x.id === petId ? { ...x, photo: null } : x)),
    );
    setResult((r) => (r ? { ...r, pet: { ...r.pet, photo: null } } : r));
  }

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

      <PageHeader title="Transaction Scanner" />

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* ── Scanner (collapses once a pet is found) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: result ? 0 : 300,
            flexShrink: 0,
            overflow: result ? "hidden" : "visible",
            transition: "width .3s ease",
            opacity: result ? 0 : 1,
          }}
        >
          <div style={{ ...css.card, padding: "20px 22px" }}>
            <p style={css.sectionLabel}>Scanner</p>
            <button
              onClick={() => setScanning((s) => !s)}
              style={{
                ...css.btnPrimary,
                width: "100%",
                justifyContent: "center",
                marginBottom: 16,
                background: scanning ? T.accentDark : T.accent,
              }}
            >
              <Icon d={Icons.camera} size={15} color="#fff" stroke />
              {scanning ? "Stop Scanning" : "Start Camera Scanning"}
            </button>

            {scanning && (
              <div
                style={{
                  background: "rgba(34,197,138,.12)",
                  border: `2px dashed ${T.accent}`,
                  borderRadius: 10,
                  padding: 20,
                  textAlign: "center",
                  marginBottom: 14,
                  color: T.muted,
                  fontSize: 13,
                }}
              >
                <Icon d={Icons.camera} size={28} color={T.accent} stroke />
                <p style={{ marginTop: 8 }}>Camera preview active</p>
              </div>
            )}

            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.muted,
                marginBottom: 6,
              }}
            >
              QR Scanner Device
            </p>
            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.trim()) lookup(code);
                }}
                placeholder="Scan QR Code Here"
                autoComplete="off"
                style={{
                  ...css.input,
                  borderColor: error
                    ? T.danger
                    : result
                      ? T.accent
                      : T.border,
                  marginBottom: 4,
                  // The scanned value is hidden — the overlay below shows status.
                  color: "transparent",
                  caretColor: T.accent,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 4,
                  padding: "9px 12px",
                  pointerEvents: "none",
                  fontSize: 13.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {code ? (
                  <span
                    style={{
                      color: T.accent,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: T.accent,
                        display: "inline-block",
                        animation: "ph-pulse 1s infinite",
                      }}
                    />
                    Scanning…
                  </span>
                ) : (
                  <span style={{ color: T.subtle }}>Scan QR Code Here</span>
                )}
              </div>
            </div>
            <style>{`@keyframes ph-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>

            <p style={{ fontSize: 11, color: T.subtle, marginBottom: 12 }}>
              Compatible with USB QR Scanner Devices
            </p>

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                  padding: "7px 11px",
                  borderRadius: 7,
                  background: "rgba(248,113,113,.12)",
                  border: "1px solid #fecaca",
                }}
              >
                <Icon d={Icons.x} size={13} color={T.danger} stroke />
                <p
                  style={{
                    fontSize: 12.5,
                    color: T.danger,
                    fontWeight: 600,
                  }}
                >
                  No record found. Please try again.
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  if (code.trim()) lookup(code);
                }}
                style={{
                  ...css.btnPrimary,
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <Icon d={Icons.search} size={14} color="#fff" stroke /> Look Up
              </button>
              {(result || code) && (
                <button
                  onClick={clearResult}
                  style={{ ...css.btnSecondary, padding: "9px 11px" }}
                >
                  <Icon d={Icons.x} size={14} color={T.muted} stroke />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Card details ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            transition: "all .3s ease",
          }}
        >
          {!result && !error && (
            <div
              style={{
                ...css.card,
                padding: "60px 0",
                textAlign: "center",
                color: T.subtle,
              }}
            >
              <Icon d={Icons.eye} size={40} color={T.subtle} stroke />
              <p style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.6 }}>
                Scan a QR code or enter a pet name
                <br />
                to view loyalty card details.
              </p>
            </div>
          )}

          {result &&
            !confirmDel &&
            (() => {
              const p = result.pet;
              const c = result.client;
              const info: Array<[string, string | number]> = [
                ["Branch", p.branch],
                ["Owner", c?.name || "—"],
                ["Contact Info", c?.email || "—"],
                ["Pet's Name", p.name],
                ["Card Expiration Date", getExpiry(p.membershipDate)],
                ["Total Points", totalPoints],
                [
                  "Used Points",
                  petTxns.reduce((s, t) => s + t.pointsUsed, 0),
                ],
                ["Species (Dog/Cat)", p.species || "—"],
                ["Breed", p.breed || "—"],
                ["Color/Markings", p.color || "—"],
                ["Gender", p.gender || "—"],
                ["Date of Birth", p.birthday || "—"],
                ["Weight", p.weight || "—"],
                ["Spayed/Neutered", p.spayed || "No"],
              ];

              return (
                <>
                  <div style={{ ...css.card, padding: "22px 24px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: T.accent,
                          textTransform: "uppercase",
                          letterSpacing: ".06em",
                        }}
                      >
                        Loyalty Card Details
                      </p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={clearResult}
                          style={{
                            ...css.btnSecondary,
                            padding: "6px 14px",
                            fontSize: 12,
                            gap: 6,
                          }}
                        >
                          <Icon
                            d={Icons.search}
                            size={13}
                            color={T.muted}
                            stroke
                          />{" "}
                          Scan Again
                        </button>
                        <button
                          onClick={() => setConfirmDel(true)}
                          style={{
                            ...css.btnSecondary,
                            padding: "6px 12px",
                            fontSize: 12,
                            gap: 5,
                            borderColor: "rgba(248,113,113,.4)",
                            color: T.danger,
                          }}
                        >
                          <Icon
                            d={Icons.x}
                            size={12}
                            color={T.danger}
                            stroke
                          />{" "}
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                      {/* VIP card visual */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          flexShrink: 0,
                        }}
                      >
                        <div
                          id={`loyalty-card-${p.id}`}
                          style={{
                            width: 300,
                            minHeight: 190,
                            borderRadius: 16,
                            background:
                              "linear-gradient(135deg, #0a4d37 0%, #0f6b4a 50%, #073d2b 100%)",
                            padding: "18px 20px",
                            color: "#fff",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 10px 30px rgba(6,50,35,.5)",
                            border: "1.5px solid rgba(212,175,55,.45)",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: -30,
                              right: -30,
                              width: 130,
                              height: 130,
                              borderRadius: "50%",
                              background: "rgba(212,175,55,.10)",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: -40,
                              left: 40,
                              width: 160,
                              height: 160,
                              borderRadius: "50%",
                              background: "rgba(255,255,255,.05)",
                            }}
                          />
                          <img
                            src="/logo.png"
                            alt=""
                            style={{
                              position: "absolute",
                              bottom: -16,
                              right: -12,
                              width: 104,
                              height: 104,
                              objectFit: "contain",
                              // Green-on-green needs more presence than the
                              // gold mark did to read as a watermark.
                              opacity: 0.38,
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 7,
                              borderRadius: 11,
                              border: "1px solid rgba(212,175,55,.35)",
                              pointerEvents: "none",
                            }}
                          />
                          {p.photo && (
                            <div
                              style={{
                                position: "absolute",
                                top: 16,
                                right: 18,
                                width: 58,
                                height: 58,
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "2px solid rgba(212,175,55,.7)",
                                boxShadow: "0 2px 8px rgba(0,0,0,.3)",
                              }}
                            >
                              <img
                                src={p.photo}
                                alt={p.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          )}
                          <div style={{ position: "relative" }}>
                            <p
                              style={{
                                display: "inline-block",
                                fontSize: 9.5,
                                fontWeight: 800,
                                letterSpacing: ".18em",
                                marginBottom: 8,
                                padding: "3px 9px",
                                borderRadius: 5,
                                background:
                                  "linear-gradient(90deg,#f4e2a1,#d4af37)",
                                color: "#0a4d37",
                                boxShadow: "0 2px 8px rgba(212,175,55,.4)",
                              }}
                            >
                              ★ PET HUB REWARDS ★
                            </p>
                            <p
                              style={{
                                fontSize: 23,
                                fontWeight: 800,
                                letterSpacing: ".03em",
                                lineHeight: 1.05,
                                maxWidth: p.photo ? 180 : "100%",
                                textShadow: "0 1px 4px rgba(0,0,0,.35)",
                              }}
                            >
                              {p.name?.toUpperCase()}
                            </p>
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: ".08em",
                                marginBottom: 12,
                                color: "#e9d9a0",
                              }}
                            >
                              {p.breed?.toUpperCase() ||
                                p.species?.toUpperCase() ||
                                ""}
                            </p>
                            <div
                              style={{
                                height: 1,
                                background:
                                  "linear-gradient(90deg, rgba(212,175,55,.6), rgba(212,175,55,0))",
                                marginBottom: 10,
                                maxWidth: 200,
                              }}
                            />
                            <p
                              style={{
                                fontSize: 11,
                                opacity: 0.9,
                                lineHeight: 1.8,
                              }}
                            >
                              Owner: {c?.name || "—"}
                              <br />
                              Points:{" "}
                              <strong style={{ color: "#f4e2a1" }}>
                                {totalPoints}
                              </strong>
                              <br />
                              Expires: {getExpiry(p.membershipDate)}
                            </p>
                            {p.membershipNo && (
                              <p
                                style={{
                                  fontSize: 10,
                                  letterSpacing: ".14em",
                                  marginTop: 8,
                                  color: "rgba(233,217,160,.75)",
                                  fontWeight: 600,
                                }}
                              >
                                {p.membershipNo}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => downloadCard(p, c, totalPoints)}
                          style={{
                            ...css.btnPrimary,
                            justifyContent: "center",
                            padding: "9px 0",
                            fontSize: 13,
                            gap: 7,
                          }}
                        >
                          <Icon
                            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                            size={15}
                            color="#fff"
                            stroke
                          />{" "}
                          Download Card
                        </button>

                        <label style={{ cursor: "pointer" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                              padding: "9px 0",
                              borderRadius: 9,
                              border: `1.5px dashed ${T.border}`,
                              background: T.surface,
                              fontSize: 13,
                              color: T.muted,
                              fontWeight: 600,
                              transition: "all .15s",
                            }}
                          >
                            <Icon
                              d={Icons.camera}
                              size={15}
                              color="currentColor"
                              stroke
                            />
                            {p.photo ? "Change Pet Photo" : "Upload Pet Photo"}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              void setPetPhoto(p.id, e.target.files?.[0])
                            }
                          />
                        </label>

                        {p.photo && (
                          <button
                            onClick={() => clearPetPhoto(p.id)}
                            style={{
                              ...css.btnSecondary,
                              justifyContent: "center",
                              padding: "7px 0",
                              fontSize: 12,
                              color: T.danger,
                              borderColor: "rgba(248,113,113,.4)",
                            }}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      {/* Pet info grid */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: T.muted,
                            textTransform: "uppercase",
                            letterSpacing: ".07em",
                            marginBottom: 12,
                          }}
                        >
                          Pet Information
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "8px 24px",
                          }}
                        >
                          {info.map(([label, val]) => (
                            <div
                              key={label}
                              style={{
                                paddingBottom: 10,
                                borderBottom: `1px solid ${T.border}`,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 11,
                                  color: T.muted,
                                  marginBottom: 3,
                                }}
                              >
                                {label}:
                              </p>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: T.text,
                                  wordBreak: "break-word",
                                }}
                              >
                                {val || "—"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Transaction form ── */}
                  <div style={{ ...css.card, padding: "16px 24px" }}>
                    <button
                      onClick={() => {
                        setShowTxnForm((f) => !f);
                        setTxnAmount("");
                        setTxnFile(null);
                        setTxnType("gain");
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: `${T.accent}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon
                            d={Icons.transaction}
                            size={16}
                            color={T.accent}
                            stroke
                          />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <p
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: T.text,
                            }}
                          >
                            Transaction
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: T.muted,
                              marginTop: 1,
                            }}
                          >
                            Gain or redeem loyalty points
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: T.muted,
                            fontWeight: 500,
                          }}
                        >
                          {showTxnForm ? "Hide" : "Open"}
                        </span>
                        <Icon
                          d={showTxnForm ? Icons.chevronD : Icons.chevronR}
                          size={16}
                          color={T.muted}
                          stroke
                        />
                      </div>
                    </button>

                    {showTxnForm && (
                      <div
                        style={{
                          marginTop: 18,
                          borderTop: `1px solid ${T.border}`,
                          paddingTop: 18,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.muted,
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: ".06em",
                          }}
                        >
                          Transaction Type
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            marginBottom: 16,
                          }}
                        >
                          {(
                            [
                              ["gain", "Gain Points", T.accent],
                              ["redeem", "Redeem Points", T.info],
                            ] as const
                          ).map(([val, label, col]) => (
                            <label
                              key={val}
                              onClick={() => setTxnType(val)}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                fontSize: 13.5,
                                cursor: "pointer",
                                padding: "9px 0",
                                borderRadius: 8,
                                border: `2px solid ${txnType === val ? col : T.border}`,
                                background:
                                  txnType === val ? `${col}10` : T.surface,
                                fontWeight: txnType === val ? 700 : 400,
                                color: txnType === val ? col : T.muted,
                                transition: "all .15s",
                              }}
                            >
                              <input
                                type="radio"
                                name="txnType"
                                value={val}
                                checked={txnType === val}
                                onChange={() => setTxnType(val)}
                                style={{ display: "none" }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>

                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.muted,
                            marginBottom: 6,
                            textTransform: "uppercase",
                            letterSpacing: ".06em",
                          }}
                        >
                          Transaction Receipt
                        </p>
                        <label
                          style={{
                            display: "block",
                            marginBottom: 14,
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              border: `1.5px solid ${T.border}`,
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: 13,
                              color: txnFile ? T.text : T.subtle,
                              background: T.surface,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                background: T.bg,
                                border: `1px solid ${T.border}`,
                                borderRadius: 5,
                                padding: "3px 10px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: T.text,
                                flexShrink: 0,
                              }}
                            >
                              Choose File
                            </span>
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {txnFile ? txnFile.name : "No file chosen"}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              void pickReceiptFile(e.target.files?.[0] ?? null)
                            }
                            style={{ display: "none" }}
                          />
                        </label>

                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.muted,
                            marginBottom: 6,
                            textTransform: "uppercase",
                            letterSpacing: ".06em",
                          }}
                        >
                          {txnType === "gain"
                            ? "Transaction Amount (₱)"
                            : "Points to Redeem"}
                        </p>
                        <input
                          type="number"
                          value={txnAmount}
                          onChange={(e) => setTxnAmount(e.target.value)}
                          min={0}
                          placeholder={
                            txnType === "gain"
                              ? "e.g. 1500"
                              : `Max ${totalPoints} pts`
                          }
                          style={{
                            ...css.input,
                            marginBottom: 6,
                            borderColor: redeemError ? T.danger : T.border,
                          }}
                        />

                        {redeemError && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 10,
                              padding: "7px 11px",
                              borderRadius: 7,
                              background: "rgba(248,113,113,.12)",
                              border: "1px solid #fecaca",
                            }}
                          >
                            <Icon
                              d={Icons.x}
                              size={13}
                              color={T.danger}
                              stroke
                            />
                            <p
                              style={{
                                fontSize: 12.5,
                                color: T.danger,
                                fontWeight: 600,
                              }}
                            >
                              Not enough points. Available:{" "}
                              <strong>{totalPoints}</strong>
                            </p>
                          </div>
                        )}
                        {txnType === "redeem" && !redeemError && txnAmount && (
                          <p
                            style={{
                              fontSize: 12,
                              color: T.accent,
                              marginBottom: 10,
                              fontWeight: 500,
                            }}
                          >
                            ✓ Remaining after redeem:{" "}
                            <strong>{totalPoints - pointsToRedeem} pts</strong>
                          </p>
                        )}

                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.muted,
                            marginBottom: 6,
                            textTransform: "uppercase",
                            letterSpacing: ".06em",
                            marginTop: 4,
                          }}
                        >
                          {txnType === "gain" ? "Points to Gain" : "Points Used"}
                        </p>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: T.surfaceAlt,
                            marginBottom: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            border: `1px solid ${T.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: txnType === "gain" ? T.accent : T.danger,
                            }}
                          >
                            {txnType === "gain"
                              ? txnAmount
                                ? `+${pointsToGain}`
                                : "—"
                              : txnAmount
                                ? `-${pointsToRedeem}`
                                : "—"}{" "}
                            pts
                          </span>
                          {txnAmount && !redeemError && (
                            <span style={{ fontSize: 12.5, color: T.muted }}>
                              New total:{" "}
                              <strong style={{ color: T.text }}>
                                {txnType === "gain"
                                  ? totalPoints + pointsToGain
                                  : totalPoints - pointsToRedeem}{" "}
                                pts
                              </strong>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={saveTxn}
                          disabled={!txnAmount || redeemError}
                          style={{
                            ...css.btnPrimary,
                            width: "100%",
                            justifyContent: "center",
                            fontSize: 14,
                            padding: "11px 0",
                            opacity: !txnAmount || redeemError ? 0.4 : 1,
                            background:
                              txnType === "redeem" ? T.info : T.accent,
                            gap: 8,
                          }}
                        >
                          <Icon d={Icons.check} size={15} color="#fff" stroke />
                          {txnType === "gain"
                            ? "Save & Gain Points"
                            : "Save & Redeem Points"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Per-pet history ── */}
                  <div style={{ ...css.card, padding: "16px 24px" }}>
                    <button
                      onClick={() => setShowHistory((h) => !h)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: `${T.accent}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon
                            d={Icons.transaction}
                            size={16}
                            color={T.accent}
                            stroke
                          />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <p
                            style={{
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: T.text,
                            }}
                          >
                            Pet Transactions History
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: T.muted,
                              marginTop: 1,
                            }}
                          >
                            {p.name} &nbsp;·&nbsp; {petTxns.length} transaction
                            {petTxns.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
                            Total:{" "}
                            <strong style={{ color: T.accent }}>
                              {totalPoints} pts
                            </strong>
                          </p>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: T.muted,
                            fontWeight: 500,
                          }}
                        >
                          {showHistory ? "Hide" : "View"}
                        </span>
                        <Icon
                          d={showHistory ? Icons.chevronD : Icons.chevronR}
                          size={16}
                          color={T.muted}
                          stroke
                        />
                      </div>
                    </button>

                    {showHistory && (
                      <div
                        style={{
                          marginTop: 16,
                          borderTop: `1px solid ${T.border}`,
                          paddingTop: 16,
                        }}
                      >
                        {petTxns.length === 0 ? (
                          <p
                            style={{
                              color: T.subtle,
                              fontSize: 13,
                              padding: "12px 0",
                              textAlign: "center",
                            }}
                          >
                            No transactions yet.
                          </p>
                        ) : (
                          <div
                            style={{
                              overflowX: "auto",
                              borderRadius: 9,
                              border: `1px solid ${T.border}`,
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
                                    "Transaction ID",
                                    "Attachment",
                                    "Amount",
                                    "Points Gained",
                                    "Points Used",
                                    "Transact By",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      style={{
                                        padding: "10px 14px",
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
                                {petTxns.map((t, i) => (
                                  <tr
                                    key={t.id}
                                    style={{
                                      borderBottom: `1px solid ${T.border}`,
                                      background:
                                        i % 2 === 0 ? T.surface : T.surfaceAlt,
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "10px 14px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {t.transactionId}
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
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
                                          View Receipt
                                        </span>
                                      ) : (
                                        <span
                                          title="No receipt file was attached to this transaction"
                                          style={{
                                            color: T.subtle,
                                            fontSize: 13,
                                          }}
                                        >
                                          {t.receipt && t.receipt !== "—"
                                            ? t.receipt
                                            : "No receipt"}
                                        </span>
                                      )}
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 14px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {t.amount > 0
                                        ? `₱${t.amount.toLocaleString()}`
                                        : "—"}
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 14px",
                                        color: T.accent,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {t.pointsGained > 0
                                        ? `+${t.pointsGained}`
                                        : 0}
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 14px",
                                        color:
                                          t.pointsUsed > 0
                                            ? T.danger
                                            : T.muted,
                                        fontWeight: t.pointsUsed > 0 ? 700 : 400,
                                      }}
                                    >
                                      {t.pointsUsed > 0
                                        ? `-${t.pointsUsed}`
                                        : 0}
                                    </td>
                                    <td
                                      style={{
                                        padding: "10px 14px",
                                        color: T.muted,
                                      }}
                                    >
                                      {t.transactBy}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

          {confirmDel && result && (
            <div
              style={{
                ...css.card,
                padding: "48px 32px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(248,113,113,.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Icon d={Icons.x} size={26} color={T.danger} stroke />
              </div>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: T.text,
                  marginBottom: 8,
                }}
              >
                Delete this record?
              </p>
              <p
                style={{
                  fontSize: 13.5,
                  color: T.muted,
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                You are about to permanently delete the loyalty card record for{" "}
                <strong>{result.pet.name}</strong>. This cannot be undone.
              </p>
              <div
                style={{ display: "flex", gap: 10, justifyContent: "center" }}
              >
                <button
                  onClick={() => setConfirmDel(false)}
                  style={{ ...css.btnSecondary, padding: "9px 24px" }}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteRecord}
                  style={{
                    ...css.btnPrimary,
                    padding: "9px 24px",
                    background: T.danger,
                    gap: 7,
                  }}
                >
                  <Icon d={Icons.x} size={14} color="#fff" stroke /> Yes, Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
