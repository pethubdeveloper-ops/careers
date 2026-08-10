import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RADIUS, S, T } from "../theme";

/** Page frame: safe area, dark ground, and optional scrolling. */
export function Screen({
  children,
  scroll = true,
  refreshing,
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollBody}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.plainBody}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {refreshing ? (
        <View style={styles.centre}>
          <ActivityIndicator color={T.accent} size="large" />
        </View>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function Heading({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.headingText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({
  label,
  tone = "accent",
}: {
  label: string;
  tone?: "accent" | "warn" | "danger" | "info" | "gold";
}) {
  const colour = {
    accent: T.accent,
    warn: T.warn,
    danger: T.danger,
    info: T.info,
    gold: T.gold,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: `${colour}22` }]}>
      <View style={[styles.badgeDot, { backgroundColor: colour }]} />
      <Text style={[styles.badgeText, { color: colour }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const base =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
        ? styles.btnDanger
        : styles.btnSecondary;
  const text =
    variant === "primary" ? styles.btnPrimaryText : styles.btnSecondaryText;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      // A tap with no visible response reads as a broken button, so every
      // press dims while the finger is down.
      style={({ pressed }) => [
        styles.btn,
        base,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      <Text
        style={[
          text,
          variant === "danger" && { color: T.danger },
          disabled && { opacity: 0.7 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Label + value line, the workhorse of every detail screen. */
export function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value?: ReactNode;
  valueStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {typeof value === "string" || typeof value === "number" || !value ? (
        <Text style={[styles.rowValue, valueStyle]}>
          {value === undefined || value === null || value === "" ? "—" : value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Empty({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },
  scrollBody: { padding: S.lg, paddingBottom: S.xxl * 2, gap: S.md },
  plainBody: { flex: 1, padding: S.lg, gap: S.md },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },

  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: S.md,
    marginBottom: S.sm,
  },
  headingText: { flexShrink: 1 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: T.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: { fontSize: 24, fontWeight: "800", color: T.text },

  card: {
    backgroundColor: T.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: S.lg,
    gap: S.sm,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  btn: {
    paddingVertical: 13,
    paddingHorizontal: S.lg,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    // Comfortably past the 44pt minimum touch target.
    minHeight: 48,
  },
  btnPrimary: { backgroundColor: T.accent },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: T.borderMid,
  },
  btnDanger: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,.45)",
  },
  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.45 },
  btnPrimaryText: { color: "#04231a", fontSize: 15, fontWeight: "700" },
  btnSecondaryText: { color: T.text, fontSize: 15, fontWeight: "600" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: S.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  rowLabel: { fontSize: 13.5, color: T.muted, flexShrink: 1 },
  rowValue: {
    fontSize: 13.5,
    color: T.text,
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: T.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: S.sm,
  },

  empty: { padding: S.xl, alignItems: "center" },
  emptyText: { color: T.subtle, fontSize: 14, textAlign: "center" },
});
