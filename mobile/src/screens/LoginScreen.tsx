import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Screen } from "../components/ui";
import { RADIUS, S, T } from "../theme";
import { SUPER_ADMIN } from "@/lib/constants";
import type { AuthUser, Client, Registration } from "@/types";
import { ADMINS } from "@/data/seed";
import logo from "../../assets/logo.png";

/**
 * Resolves an email to a session, or to the reason there isn't one.
 *
 * Deliberately the same order and the same outcomes as the web app's login —
 * admins, then clients, then registrations — so a pending or declined
 * applicant is told which they are rather than "no account found".
 */
export function resolveLogin(
  email: string,
  password: string,
  clients: Client[],
  registrations: Registration[],
): { user: AuthUser } | { error: string } {
  const mail = email.trim().toLowerCase();
  if (!mail || !password.trim()) {
    return { error: "Please enter your email and password." };
  }

  const admin = ADMINS.find((a) => a.email.toLowerCase() === mail);
  if (admin) {
    return {
      user: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isClient: false,
      },
    };
  }

  const client = clients.find((c) => (c.email || "").toLowerCase() === mail);
  if (client) {
    return {
      user: {
        email: client.email,
        name: client.name,
        role: "Client",
        isClient: true,
        clientId: client.id,
      },
    };
  }

  const reg = registrations.find((r) => r.email.toLowerCase() === mail);
  if (reg) {
    if (reg.status === "Pending") {
      return {
        error: `Your account is still awaiting admin approval. You'll be able to sign in once ${SUPER_ADMIN} approves it.`,
      };
    }
    if (reg.status === "Denied") {
      return {
        error: `Your registration request was denied by the administrator. Please contact ${SUPER_ADMIN}.`,
      };
    }
    return {
      user: {
        email: reg.email,
        name: reg.name,
        role: reg.role,
        isClient: reg.accountType === "Client",
      },
    };
  }

  return { error: "No account found for this email." };
}

export function LoginScreen({
  clients,
  registrations,
  onSignIn,
}: {
  clients: Client[];
  registrations: Registration[];
  onSignIn: (user: AuthUser) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const result = resolveLogin(email, password, clients, registrations);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    onSignIn(result.user);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <View style={styles.brand}>
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.name}>Pet Hub Rewards</Text>
          <Text style={styles.tagline}>
            Loyalty cards, points and pet records — for staff and pet owners.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@pethub.ph"
            placeholderTextColor={T.subtle}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
            onSubmitEditing={submit}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Any password (demo)"
            placeholderTextColor={T.subtle}
            secureTextEntry
            style={styles.input}
            onSubmitEditing={submit}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Sign in" onPress={submit} style={{ marginTop: S.sm }} />

          <Text style={styles.hint}>
            Demo — sign in as {SUPER_ADMIN} for the admin portal, or as a client
            email for the owner portal. Any password works.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: S.xl, justifyContent: "center" },
  brand: { alignItems: "center", gap: S.sm },
  logo: { width: 96, height: 96 },
  name: { fontSize: 26, fontWeight: "800", color: T.text },
  tagline: {
    fontSize: 14,
    color: T.muted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: S.lg,
  },
  form: { gap: S.xs },
  label: {
    fontSize: 12.5,
    fontWeight: "600",
    color: T.muted,
    marginTop: S.sm,
    marginBottom: 2,
  },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: S.md,
    paddingVertical: 13,
    color: T.text,
    fontSize: 15,
  },
  error: {
    color: T.danger,
    fontSize: 13,
    marginTop: S.sm,
    lineHeight: 18,
  },
  hint: {
    color: T.subtle,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: S.md,
  },
});
