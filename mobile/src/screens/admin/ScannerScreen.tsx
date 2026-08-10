import { useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Badge,
  Button,
  Card,
  Heading,
  Row,
  Screen,
  SectionTitle,
} from "../../components/ui";
import { RADIUS, S, T } from "../../theme";
import { cardExpiry, isExpired, pointsForPet } from "@/lib/loyalty";
import { branchLabel } from "@/lib/branch";
import type { Client, Pet, Transaction } from "@/types";

/** ₱300 spent earns 1 loyalty point — the same rate as the web app. */
const POINTS_RATE = 300;

/**
 * Finds the pet a scanned code or typed term refers to.
 *
 * Accepts a membership number, a numeric id or a name so a staff member can
 * fall back to typing when a card is too worn to scan.
 */
export function findPet(term: string, pets: Pet[]): Pet | null {
  const q = term.trim().toLowerCase();
  if (!q) return null;
  return (
    pets.find((p) => p.membershipNo.toLowerCase() === q) ??
    pets.find((p) => String(p.id) === q) ??
    pets.find((p) => p.name.toLowerCase() === q) ??
    null
  );
}

export function ScannerScreen({
  pets,
  clients,
  transactions,
  onRecord,
}: {
  pets: Pet[];
  clients: Client[];
  transactions: Transaction[];
  onRecord: (petId: number, gained: number, used: number, amount: number) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<Pet | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [redeem, setRedeem] = useState("");

  // The camera fires this many times a second while a code is in frame; take
  // the first and close, or one scan becomes a dozen lookups.
  const handled = useRef(false);

  const lookUp = useCallback(
    (value: string) => {
      const pet = findPet(value, pets);
      setFound(pet);
      setNotFound(!pet);
      setAmount("");
      setRedeem("");
    },
    [pets],
  );

  function onBarcode(value: string) {
    if (handled.current) return;
    handled.current = true;
    setScanning(false);
    setTerm(value);
    lookUp(value);
  }

  async function openCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    handled.current = false;
    setScanning(true);
  }

  const owner = found ? clients.find((c) => c.id === found.clientId) : undefined;
  const balance = found ? pointsForPet(found.id, transactions) : 0;
  const spend = Number(amount) || 0;
  const gained = Math.floor(spend / POINTS_RATE);
  const used = Number(redeem) || 0;
  const overdrawn = used > balance;

  if (scanning) {
    return (
      <Screen scroll={false}>
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onBarcode(data)}
          />
          <View style={styles.reticle} pointerEvents="none" />
        </View>
        <Text style={styles.cameraHint}>
          Point the camera at the QR code on the pet's loyalty card.
        </Text>
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => setScanning(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading eyebrow="Operations" title="Loyalty scanner" />

      <Card>
        <SectionTitle>Find a card</SectionTitle>
        <Button label="Scan QR code" onPress={() => void openCamera()} />
        <Text style={styles.or}>or look it up</Text>
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Membership no. or pet name"
          placeholderTextColor={T.subtle}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          onSubmitEditing={() => lookUp(term)}
        />
        <Button
          label="Look up"
          variant="secondary"
          onPress={() => lookUp(term)}
        />
        {notFound ? (
          <Text style={styles.error}>
            No pet matches "{term.trim()}". Check the number, or search by name.
          </Text>
        ) : null}
      </Card>

      {found ? (
        <>
          <Card>
            <View style={styles.foundHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{found.name}</Text>
                <Text style={styles.petMeta}>
                  {found.membershipNo || `#${found.id}`} ·{" "}
                  {branchLabel(found.branch)}
                </Text>
              </View>
              <Badge
                label={isExpired(found) ? "Expired" : "Active"}
                tone={isExpired(found) ? "danger" : "accent"}
              />
            </View>
            <Row label="Owner" value={owner?.name} />
            <Row label="Contact" value={owner?.contact} />
            <Row
              label="Expires"
              value={cardExpiry(found)?.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <Row
              label="Points balance"
              value={String(balance)}
              valueStyle={{ color: T.gold, fontSize: 16 }}
            />
          </Card>

          <Card>
            <SectionTitle>Record a transaction</SectionTitle>

            <Text style={styles.label}>Amount spent (₱)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={T.subtle}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.helper}>
              ₱{POINTS_RATE} = 1 point · earns {gained}{" "}
              {gained === 1 ? "point" : "points"}
            </Text>

            <Text style={styles.label}>Points to redeem</Text>
            <TextInput
              value={redeem}
              onChangeText={setRedeem}
              placeholder="0"
              placeholderTextColor={T.subtle}
              keyboardType="numeric"
              style={[styles.input, overdrawn && styles.inputBad]}
            />
            {overdrawn ? (
              <Text style={styles.error}>
                {found.name} only has {balance} points.
              </Text>
            ) : null}

            <Button
              label="Save transaction"
              disabled={overdrawn || (gained === 0 && used === 0)}
              onPress={() => {
                onRecord(found.id, gained, used, spend);
                setAmount("");
                setRedeem("");
              }}
              style={{ marginTop: S.sm }}
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    flex: 1,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  reticle: {
    position: "absolute",
    top: "25%",
    left: "12%",
    right: "12%",
    bottom: "25%",
    borderWidth: 2,
    borderColor: T.accent,
    borderRadius: RADIUS.md,
  },
  cameraHint: {
    color: T.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  or: {
    color: T.subtle,
    fontSize: 12,
    textAlign: "center",
    marginVertical: 2,
  },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    color: T.text,
    fontSize: 15,
  },
  inputBad: { borderColor: T.danger },
  label: {
    fontSize: 12.5,
    fontWeight: "600",
    color: T.muted,
    marginTop: S.sm,
    marginBottom: 2,
  },
  helper: { fontSize: 12, color: T.subtle, marginTop: 4 },
  error: { color: T.danger, fontSize: 12.5, marginTop: 6, lineHeight: 18 },
  foundHead: { flexDirection: "row", alignItems: "center", gap: S.md },
  petName: { fontSize: 18, fontWeight: "800", color: T.text },
  petMeta: { fontSize: 12.5, color: T.muted, marginTop: 2 },
});
