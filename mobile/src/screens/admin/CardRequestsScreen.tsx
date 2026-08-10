import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import {
  Badge,
  Button,
  Card,
  Empty,
  Heading,
  Screen,
} from "../../components/ui";
import { RADIUS, S, T } from "../../theme";
import { branchLabel } from "@/lib/branch";
import type { Client, Pet } from "@/types";

/**
 * Cards a client has availed that staff have not handed over yet — the same
 * queue as the web app's Card Requests page.
 */
export function pendingRequests(pets: Pet[]): Pet[] {
  return pets.filter((p) => p.hasCard && p.printStatus === "Pending");
}

export function CardRequestsScreen({
  pets,
  clients,
  onRelease,
  onDecline,
}: {
  pets: Pet[];
  clients: Client[];
  onRelease: (petId: number, membershipNo: string) => void;
  onDecline: (petId: number) => void;
}) {
  const pending = useMemo(() => pendingRequests(pets), [pets]);
  const [numbers, setNumbers] = useState<Record<number, string>>({});

  return (
    <Screen>
      <Heading
        eyebrow="Operations"
        title="Card requests"
        right={
          <Badge
            label={`${pending.length} pending`}
            tone={pending.length ? "warn" : "accent"}
          />
        }
      />

      {pending.length === 0 ? (
        <Empty message="No pending card requests. Everything issued." />
      ) : (
        pending.map((pet) => {
          const owner = clients.find((c) => c.id === pet.clientId);
          const membershipNo = numbers[pet.id] ?? "";

          return (
            <Card key={pet.id}>
              <View style={styles.head}>
                {pet.photo ? (
                  <Image source={{ uri: pet.photo }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoEmpty]}>
                    <Text style={styles.noPhoto}>No{"\n"}photo</Text>
                  </View>
                )}
                <View style={styles.headBody}>
                  <Text style={styles.name}>{pet.name}</Text>
                  <Text style={styles.meta}>
                    {[pet.species, owner?.name].filter(Boolean).join(" · ")}
                  </Text>
                  <Text style={styles.meta}>{branchLabel(pet.branch)}</Text>
                </View>
              </View>

              <Text style={styles.label}>Membership number</Text>
              <TextInput
                value={membershipNo}
                onChangeText={(v) =>
                  setNumbers((prev) => ({ ...prev, [pet.id]: v }))
                }
                placeholder="e.g. PH-0027"
                placeholderTextColor={T.subtle}
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
              />

              <View style={styles.actions}>
                <Button
                  label="Release card"
                  // Releasing without a number leaves a card nobody can scan.
                  disabled={!membershipNo.trim()}
                  onPress={() => onRelease(pet.id, membershipNo.trim())}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Decline"
                  variant="danger"
                  onPress={() => onDecline(pet.id)}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", gap: S.md, alignItems: "center" },
  photo: { width: 64, height: 64, borderRadius: RADIUS.sm },
  photoEmpty: {
    backgroundColor: `${T.danger}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  noPhoto: {
    color: T.danger,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  headBody: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "700", color: T.text },
  meta: { fontSize: 12.5, color: T.muted },
  label: {
    fontSize: 12.5,
    fontWeight: "600",
    color: T.muted,
    marginTop: S.md,
    marginBottom: 2,
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
  actions: { flexDirection: "row", gap: S.sm, marginTop: S.md },
});
