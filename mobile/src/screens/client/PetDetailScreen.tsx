import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PetQr } from "../../components/PetQr";
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
import { cardStanding } from "./MyPetsScreen";
import { cardExpiry, pointsForPet } from "@/lib/loyalty";
import { branchLabel } from "@/lib/branch";
import type { Pet, Transaction } from "@/types";

const LONG_DATE: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

export function PetDetailScreen({
  pet,
  transactions,
  onAvailCard,
  onBack,
}: {
  pet: Pet;
  transactions: Transaction[];
  onAvailCard: (petId: number, photo: string) => void;
  onBack?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const standing = cardStanding(pet);
  const expiry = cardExpiry(pet);
  const points = pointsForPet(pet.id, transactions);

  /**
   * Availing a card needs a photo of the pet, the same as on the web — it is
   * what staff print on the card, so there is no point queuing a request
   * without one.
   */
  async function availCard() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Availing a loyalty card needs a photo of your pet for the card itself.",
      );
      return;
    }

    setBusy(true);
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        // Cards print small; a lighter image keeps the request quick to send.
        quality: 0.7,
        base64: true,
      });
      if (picked.canceled || !picked.assets[0]?.base64) return;

      onAvailCard(pet.id, `data:image/jpeg;base64,${picked.assets[0].base64}`);
      Alert.alert(
        "Request sent",
        "Your branch will prepare the card and hand it over on your next visit.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      {onBack ? (
        <Text onPress={onBack} accessibilityRole="button" style={styles.back}>
          ‹ Back to my pets
        </Text>
      ) : null}

      <Heading eyebrow={pet.species} title={pet.name} />

      <Card style={styles.hero}>
        {pet.photo ? (
          <Image source={{ uri: pet.photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Text style={styles.initial}>
              {pet.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.heroBody}>
          <Badge label={standing.label} tone={standing.tone} />
          <Text style={styles.points}>{points}</Text>
          <Text style={styles.pointsLabel}>loyalty points</Text>
        </View>
      </Card>

      {pet.hasCard && pet.printStatus === "Printed" ? (
        <Card>
          <SectionTitle>Show this at the counter</SectionTitle>
          <PetQr pet={pet} size={190} />
          <Text style={styles.qrHint}>
            Staff scan this to pull up {pet.name}'s card and add or redeem
            points.
          </Text>
        </Card>
      ) : pet.hasCard ? (
        <Card>
          <SectionTitle>Loyalty card</SectionTitle>
          <Text style={styles.pending}>
            Your request is with {branchLabel(pet.branch)}. The QR code appears
            here once the card is released.
          </Text>
        </Card>
      ) : (
        <Card>
          <SectionTitle>Loyalty card</SectionTitle>
          <Text style={styles.pending}>
            {pet.name} does not have a loyalty card yet. Avail one and your
            branch will prepare it.
          </Text>
          <Button
            label={busy ? "Opening photos…" : "Avail loyalty card"}
            onPress={() => void availCard()}
            disabled={busy}
          />
        </Card>
      )}

      <Card>
        <SectionTitle>Details</SectionTitle>
        <Row label="Breed" value={pet.breed} />
        <Row label="Gender" value={pet.gender} />
        <Row label="Age" value={pet.age} />
        <Row label="Weight" value={pet.weight} />
        <Row label="Colour / markings" value={pet.color} />
        <Row label="Birthday" value={pet.birthday} />
      </Card>

      <Card>
        <SectionTitle>Membership</SectionTitle>
        <Row label="Membership no." value={pet.membershipNo} />
        <Row label="Branch" value={branchLabel(pet.branch)} />
        <Row label="Member since" value={pet.membershipDate} />
        <Row
          label="Expires"
          value={
            expiry ? expiry.toLocaleDateString("en-US", LONG_DATE) : undefined
          }
          valueStyle={standing.tone === "danger" ? { color: T.danger } : null}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    color: T.accent,
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: S.sm,
  },
  hero: { flexDirection: "row", alignItems: "center", gap: S.lg },
  photo: { width: 88, height: 88, borderRadius: RADIUS.md },
  photoEmpty: {
    backgroundColor: T.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: T.accent, fontSize: 34, fontWeight: "800" },
  heroBody: { flex: 1, gap: 2 },
  points: { fontSize: 34, fontWeight: "800", color: T.gold, marginTop: 4 },
  pointsLabel: { fontSize: 12, color: T.muted, fontWeight: "600" },
  qrHint: {
    fontSize: 12.5,
    color: T.muted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: S.sm,
  },
  pending: { fontSize: 13.5, color: T.muted, lineHeight: 20 },
});
