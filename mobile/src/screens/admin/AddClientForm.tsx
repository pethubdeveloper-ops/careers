import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, SectionTitle } from "../../components/ui";
import { RADIUS, S, T } from "../../theme";
import { shortBranch } from "@/lib/branch";
import type { Branch, Client, Pet } from "@/types";

/** MM/DD/YYYY, the format membership dates are stored in. */
function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
}

export interface NewClientDraft {
  name: string;
  email: string;
  contact: string;
  branch: string;
  petName: string;
  petSpecies: string;
}

export const EMPTY_DRAFT: NewClientDraft = {
  name: "",
  email: "",
  contact: "",
  branch: "",
  petName: "",
  petSpecies: "Dog",
};

/** A draft is only good enough to save once it has a name and a branch. */
export function draftIsValid(draft: NewClientDraft): boolean {
  return draft.name.trim().length > 0 && draft.branch.trim().length > 0;
}

/**
 * Turns a draft into the records to store: a client, and the pet that came
 * with them if one was named.
 */
export function buildClient(
  draft: NewClientDraft,
  nextClientId: number,
  nextPetId: number,
): { client: Client; pet: Pet | null } {
  const client: Client = {
    id: nextClientId,
    name: draft.name.trim(),
    email: draft.email.trim(),
    contact: draft.contact.trim(),
    branch: draft.branch,
    status: "Active",
    idImage: null,
    idName: null,
    idType: null,
  };

  const petName = draft.petName.trim();
  if (!petName) return { client, pet: null };

  return {
    client,
    pet: {
      id: nextPetId,
      clientId: client.id,
      name: petName,
      membershipNo: "",
      photo: null,
      species: draft.petSpecies,
      breed: "",
      gender: "",
      age: "",
      weight: "",
      color: "",
      birthday: "",
      notes: "",
      hasCard: false,
      branch: draft.branch,
      email: client.email,
      membershipDate: today(),
      printStatus: "N/A",
    },
  };
}

export function AddClientForm({
  branches,
  onSave,
  onCancel,
}: {
  branches: Branch[];
  onSave: (draft: NewClientDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<NewClientDraft>(EMPTY_DRAFT);
  const set = (key: keyof NewClientDraft) => (value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <SectionTitle>New client</SectionTitle>

      <Text style={styles.label}>Full name *</Text>
      <TextInput
        value={draft.name}
        onChangeText={set("name")}
        placeholder="e.g. Juan Dela Cruz"
        placeholderTextColor={T.subtle}
        style={styles.input}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        value={draft.email}
        onChangeText={set("email")}
        placeholder="owner@example.com"
        placeholderTextColor={T.subtle}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <Text style={styles.helper}>
        This is what they sign in with on their own phone.
      </Text>

      <Text style={styles.label}>Contact number</Text>
      <TextInput
        value={draft.contact}
        onChangeText={set("contact")}
        placeholder="09xx xxx xxxx"
        placeholderTextColor={T.subtle}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Branch *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chips}>
          {branches.map((b) => {
            const active = draft.branch === b.name;
            return (
              <Text
                key={b.id}
                onPress={() => set("branch")(b.name)}
                accessibilityRole="button"
                style={[styles.chip, active && styles.chipActive]}
              >
                {shortBranch(b.name)}
              </Text>
            );
          })}
        </View>
      </ScrollView>

      <Text style={styles.label}>First pet (optional)</Text>
      <TextInput
        value={draft.petName}
        onChangeText={set("petName")}
        placeholder="Pet name"
        placeholderTextColor={T.subtle}
        style={styles.input}
      />
      <View style={styles.chips}>
        {["Dog", "Cat", "Bird", "Rabbit", "Other"].map((s) => {
          const active = draft.petSpecies === s;
          return (
            <Text
              key={s}
              onPress={() => set("petSpecies")(s)}
              accessibilityRole="button"
              style={[styles.chip, active && styles.chipActive]}
            >
              {s}
            </Text>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button
          label="Save client"
          disabled={!draftIsValid(draft)}
          onPress={() => onSave(draft)}
          style={{ flex: 1 }}
        />
        <Button
          label="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  helper: { fontSize: 11.5, color: T.subtle, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: S.sm, marginTop: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: T.border,
    color: T.muted,
    fontSize: 13,
    fontWeight: "600",
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: `${T.accent}26`,
    borderColor: T.accent,
    color: T.accent,
  },
  actions: { flexDirection: "row", gap: S.sm, marginTop: S.lg },
});
