import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { RADIUS, S } from "../theme";
import { petQrValue } from "@/lib/loyalty";
import type { Pet } from "@/types";

/**
 * The pet's scannable code, on a white tile so it reads under any lighting.
 *
 * Encodes exactly what the web app encodes — the value comes from the shared
 * rule, not a copy of it — so a code shown on a phone scans on the counter
 * scanner and vice versa.
 */
export function PetQr({ pet, size = 200 }: { pet: Pet; size?: number }) {
  const value = petQrValue(pet);

  if (!value) {
    return (
      <View style={[styles.tile, { width: size + S.lg, height: size + S.lg }]}>
        <Text style={styles.missing}>No membership number yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.tile}>
      <QRCode
        value={value}
        size={size}
        // Level H tolerates a scuffed screen or a bad angle at the counter.
        ecl="H"
        color="#0f172a"
        backgroundColor="#ffffff"
      />
      <Text style={styles.caption}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    padding: S.md,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: S.sm,
  },
  caption: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  missing: { color: "#64748b", fontSize: 13, textAlign: "center" },
});
