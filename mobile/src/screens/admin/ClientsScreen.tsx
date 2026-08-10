import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Badge, Button, Card, Empty, Heading, Screen } from "../../components/ui";
import { AddClientForm, type NewClientDraft } from "./AddClientForm";
import { RADIUS, S, T } from "../../theme";
import { branchLabel } from "@/lib/branch";
import type { Branch, Client, Pet } from "@/types";

/** Matches a client by name, email or contact number. */
export function searchClients(clients: Client[], term: string): Client[] {
  const q = term.trim().toLowerCase();
  if (!q) return clients;
  return clients.filter((c) =>
    [c.name, c.email, c.contact].some((f) => (f || "").toLowerCase().includes(q)),
  );
}

export function ClientsScreen({
  clients,
  pets,
  branches,
  onAddClient,
}: {
  clients: Client[];
  pets: Pet[];
  branches: Branch[];
  onAddClient: (draft: NewClientDraft) => void;
}) {
  const [term, setTerm] = useState("");
  const [adding, setAdding] = useState(false);
  const results = useMemo(() => searchClients(clients, term), [clients, term]);

  return (
    <Screen>
      <Heading eyebrow="Directory" title="Clients & pets" />

      {adding ? (
        <AddClientForm
          branches={branches}
          onCancel={() => setAdding(false)}
          onSave={(draft) => {
            onAddClient(draft);
            setAdding(false);
          }}
        />
      ) : (
        <Button label="Add client" onPress={() => setAdding(true)} />
      )}

      <TextInput
        value={term}
        onChangeText={setTerm}
        placeholder="Search name, email or contact"
        placeholderTextColor={T.subtle}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />

      {results.length === 0 ? (
        <Empty
          message={
            clients.length === 0
              ? "No clients yet. Add the first one above."
              : `Nothing matches "${term.trim()}".`
          }
        />
      ) : (
        results.map((client) => {
          const owned = pets.filter((p) => p.clientId === client.id);
          const carded = owned.filter(
            (p) => p.hasCard && p.printStatus === "Printed",
          ).length;

          return (
            <Card key={client.id}>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{client.name}</Text>
                  <Text style={styles.meta}>{client.email}</Text>
                  <Text style={styles.meta}>{branchLabel(client.branch)}</Text>
                </View>
                <Badge
                  label={client.status}
                  tone={client.status === "Active" ? "accent" : "warn"}
                />
              </View>

              {owned.length === 0 ? (
                <Text style={styles.pets}>No pets on file</Text>
              ) : (
                <Text style={styles.pets}>
                  {owned.map((p) => p.name).join(", ")} ·{" "}
                  <Text style={{ color: T.gold }}>
                    {carded}/{owned.length} carded
                  </Text>
                </Text>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: S.md,
    paddingVertical: 12,
    color: T.text,
    fontSize: 15,
  },
  head: { flexDirection: "row", gap: S.md, alignItems: "flex-start" },
  name: { fontSize: 16, fontWeight: "700", color: T.text },
  meta: { fontSize: 12.5, color: T.muted, marginTop: 2 },
  pets: { fontSize: 13, color: T.muted, marginTop: S.sm, lineHeight: 19 },
});
