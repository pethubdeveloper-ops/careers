import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, Card, Empty, Heading, Screen } from "../../components/ui";
import { RADIUS, S, T } from "../../theme";
import { daysUntilExpiry, isExpired, pointsForPet } from "@/lib/loyalty";
import type { Pet, Transaction } from "@/types";

/** How a pet's card reads at a glance, and which colour says so. */
export function cardStanding(pet: Pet): {
  label: string;
  tone: "accent" | "warn" | "danger" | "info";
} {
  if (!pet.hasCard) return { label: "No loyalty card", tone: "info" };
  if (pet.printStatus === "Pending") {
    return { label: "Awaiting release", tone: "warn" };
  }
  if (isExpired(pet)) return { label: "Expired", tone: "danger" };

  const days = daysUntilExpiry(pet);
  if (days !== null && days <= 60) {
    return { label: `Expires in ${days} days`, tone: "warn" };
  }
  return { label: "Active", tone: "accent" };
}

export function MyPetsScreen({
  pets,
  transactions,
  onOpenPet,
}: {
  pets: Pet[];
  transactions: Transaction[];
  onOpenPet: (pet: Pet) => void;
}) {
  return (
    <Screen>
      <Heading eyebrow="My account" title="My pets" />

      {pets.length === 0 ? (
        <Empty message="No pets on your account yet. Ask your branch to add them." />
      ) : (
        pets.map((pet) => {
          const standing = cardStanding(pet);
          return (
            <Pressable
              key={pet.id}
              onPress={() => onOpenPet(pet)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${pet.name}`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={styles.row}>
                {pet.photo ? (
                  <Image source={{ uri: pet.photo }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoEmpty]}>
                    <Text style={styles.initial}>
                      {pet.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.body}>
                  <Text style={styles.name}>{pet.name}</Text>
                  <Text style={styles.meta}>
                    {[pet.species, pet.breed].filter(Boolean).join(" · ")}
                  </Text>
                  <View style={styles.badges}>
                    <Badge label={standing.label} tone={standing.tone} />
                  </View>
                </View>

                <View style={styles.points}>
                  <Text style={styles.pointsValue}>
                    {pointsForPet(pet.id, transactions)}
                  </Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  row: { flexDirection: "row", alignItems: "center", gap: S.md },
  photo: { width: 56, height: 56, borderRadius: RADIUS.md },
  photoEmpty: {
    backgroundColor: T.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: T.accent, fontSize: 22, fontWeight: "800" },
  body: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: "700", color: T.text },
  meta: { fontSize: 12.5, color: T.muted },
  badges: { flexDirection: "row", marginTop: 4 },
  points: { alignItems: "center" },
  pointsValue: { fontSize: 22, fontWeight: "800", color: T.gold },
  pointsLabel: { fontSize: 11, color: T.muted, fontWeight: "600" },
});
