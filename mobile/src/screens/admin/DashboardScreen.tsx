import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card, Empty, Heading, Row, Screen, SectionTitle } from "../../components/ui";
import { S, T } from "../../theme";
import { isExpired, isNearExpiring } from "@/lib/loyalty";
import { branchLabel } from "@/lib/branch";
import { pendingRequests } from "./CardRequestsScreen";
import type { Client, Pet, Transaction } from "@/types";

function peso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

export function DashboardScreen({
  pets,
  clients,
  transactions,
}: {
  pets: Pet[];
  clients: Client[];
  transactions: Transaction[];
}) {
  const stats = useMemo(() => {
    const revenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const issued = transactions.reduce((sum, t) => sum + (t.pointsGained || 0), 0);
    const redeemed = transactions.reduce((sum, t) => sum + (t.pointsUsed || 0), 0);
    return {
      revenue,
      issued,
      redeemed,
      cards: pets.filter((p) => p.hasCard && p.printStatus === "Printed").length,
      pending: pendingRequests(pets).length,
      expiring: pets.filter((p) => p.hasCard && isNearExpiring(p)).length,
      expired: pets.filter((p) => p.hasCard && isExpired(p)).length,
    };
  }, [pets, transactions]);

  const attention = useMemo(
    () => pets.filter((p) => p.hasCard && (isExpired(p) || isNearExpiring(p))),
    [pets],
  );

  return (
    <Screen>
      <Heading eyebrow="Overview" title="Dashboard" />

      <View style={styles.grid}>
        <Stat label="Total revenue" value={peso(stats.revenue)} tone={T.text} />
        <Stat label="Points issued" value={String(stats.issued)} tone={T.gold} />
        <Stat label="Points redeemed" value={String(stats.redeemed)} tone={T.info} />
        <Stat label="Active cards" value={String(stats.cards)} tone={T.accent} />
      </View>

      <Card>
        <SectionTitle>Needs attention</SectionTitle>
        <Row label="Card requests waiting" value={String(stats.pending)} />
        <Row label="Expiring within 60 days" value={String(stats.expiring)} />
        <Row
          label="Already expired"
          value={String(stats.expired)}
          valueStyle={stats.expired ? { color: T.danger } : null}
        />
        <Row label="Clients on file" value={String(clients.length)} />
      </Card>

      <Card>
        <SectionTitle>Cards to chase</SectionTitle>
        {attention.length === 0 ? (
          <Empty message="Every card is comfortably in date." />
        ) : (
          attention.map((pet) => (
            <View key={pet.id} style={styles.chaseRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chaseName}>{pet.name}</Text>
                <Text style={styles.chaseMeta}>
                  {pet.membershipNo || `#${pet.id}`} · {branchLabel(pet.branch)}
                </Text>
              </View>
              <Text
                style={[
                  styles.chaseTag,
                  { color: isExpired(pet) ? T.danger : T.warn },
                ]}
              >
                {isExpired(pet) ? "Expired" : "Expiring"}
              </Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: S.md },
  // Two per row on a phone, without hard-coding a screen width.
  stat: { flexGrow: 1, flexBasis: "45%", gap: 4 },
  statLabel: { fontSize: 11.5, color: T.muted, fontWeight: "600" },
  statValue: { fontSize: 22, fontWeight: "800" },
  chaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  chaseName: { fontSize: 14.5, fontWeight: "700", color: T.text },
  chaseMeta: { fontSize: 12, color: T.muted, marginTop: 2 },
  chaseTag: { fontSize: 12, fontWeight: "700" },
});
