import { useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { T } from "./src/theme";
import { useDb } from "./src/store/useDb";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MyPetsScreen } from "./src/screens/client/MyPetsScreen";
import { PetDetailScreen } from "./src/screens/client/PetDetailScreen";
import { DashboardScreen } from "./src/screens/admin/DashboardScreen";
import { ScannerScreen } from "./src/screens/admin/ScannerScreen";
import { CardRequestsScreen } from "./src/screens/admin/CardRequestsScreen";
import { ClientsScreen } from "./src/screens/admin/ClientsScreen";
import { buildClient, type NewClientDraft } from "./src/screens/admin/AddClientForm";
import { TODAY } from "@/lib/constants";
import type { Pet, Transaction } from "@/types";

const navTheme: Theme = {
  dark: true,
  colors: {
    primary: T.accent,
    background: T.bg,
    card: T.surface,
    text: T.text,
    border: T.border,
    notification: T.warn,
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "800" },
  },
};

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * The tab bar is labelled in words rather than icons — four rarely-used admin
 * destinations are clearer named than guessed at from a glyph.
 */
function tabLabel(text: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ color, fontSize: 12.5, fontWeight: "700" }}>{text}</Text>
  );
}

/** Without this React Navigation reserves space for an icon we do not have. */
const noIcon = () => null;

export default function App() {
  const db = useDb();
  const [openPet, setOpenPet] = useState<Pet | null>(null);

  if (!db.ready) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: T.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={T.accent} size="large" />
        </View>
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  if (!db.user) {
    return (
      <SafeAreaProvider>
        <LoginScreen
          clients={db.clients}
          registrations={db.registrations}
          onSignIn={db.setUser}
        />
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  /** A client avails a card: the photo goes with it, staff release it later. */
  function availCard(petId: number, photo: string) {
    db.setPets((prev) =>
      prev.map((p) =>
        p.id === petId
          ? { ...p, photo, hasCard: true, printStatus: "Pending" }
          : p,
      ),
    );
    setOpenPet((p) =>
      p && p.id === petId
        ? { ...p, photo, hasCard: true, printStatus: "Pending" }
        : p,
    );
  }

  function releaseCard(petId: number, membershipNo: string) {
    db.setPets((prev) =>
      prev.map((p) =>
        p.id === petId ? { ...p, membershipNo, printStatus: "Printed" } : p,
      ),
    );
  }

  function declineCard(petId: number) {
    db.setPets((prev) =>
      prev.map((p) =>
        p.id === petId
          ? { ...p, hasCard: false, printStatus: "N/A", membershipNo: "" }
          : p,
      ),
    );
  }

  function recordTransaction(
    petId: number,
    gained: number,
    used: number,
    amount: number,
  ) {
    const entry: Transaction = {
      id: Date.now(),
      petId,
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      amount,
      pointsGained: gained,
      pointsUsed: used,
      transactBy: db.user?.name ?? "",
      receipt: null,
      date: TODAY,
    };

    db.setTransactions((prev) => [entry, ...prev]);
    Alert.alert(
      "Transaction saved",
      `${gained} earned${used ? `, ${used} redeemed` : ""}.`,
    );
  }

  function addClient(draft: NewClientDraft) {
    const nextClientId = Math.max(0, ...db.clients.map((c) => c.id)) + 1;
    const nextPetId = Math.max(0, ...db.pets.map((p) => p.id)) + 1;
    const { client, pet } = buildClient(draft, nextClientId, nextPetId);
    db.setClients((prev) => [...prev, client]);
    if (pet) db.setPets((prev) => [...prev, pet]);
  }

  // No confirmation: signing out is not destructive — the records stay put and
  // signing back in restores the session.
  const signOut = () => db.setUser(null);

  const headerRight = () => (
    <Text
      onPress={signOut}
      // Without the inset this sits hard against the screen edge on a phone.
      style={{
        color: T.accent,
        fontWeight: "700",
        fontSize: 14,
        marginRight: 16,
      }}
    >
      Sign out
    </Text>
  );

  // ── Pet owner ─────────────────────────────────────────────────────────────
  if (db.user.isClient) {
    const myPets = db.pets.filter((p) => p.clientId === db.user?.clientId);

    return (
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: T.surface },
              headerTintColor: T.text,
              headerRight,
            }}
          >
            <Stack.Screen name="My pets" options={{ headerShown: true }}>
              {() => (
                <MyPetsScreen
                  pets={myPets}
                  transactions={db.transactions}
                  onOpenPet={setOpenPet}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
        {/* The detail view is driven by state rather than a route so a pet
            updated underneath it (a card released) re-renders in place. */}
        {openPet ? (
          <PetDetailOverlay
            pet={db.pets.find((p) => p.id === openPet.id) ?? openPet}
            transactions={db.transactions}
            onAvailCard={availCard}
            onClose={() => setOpenPet(null)}
          />
        ) : null}
        <StatusBar style="light" />
      </SafeAreaProvider>
    );
  }

  // ── Clinic staff ──────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Tabs.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: T.surface },
            headerTintColor: T.text,
            headerRight,
            tabBarStyle: {
              backgroundColor: T.surface,
              borderTopColor: T.border,
            },
            tabBarActiveTintColor: T.accent,
            tabBarInactiveTintColor: T.subtle,
            tabBarIcon: noIcon,
            tabBarIconStyle: { display: "none" },
            tabBarLabelPosition: "beside-icon",
          }}
        >
          <Tabs.Screen
            name="Dashboard"
            options={{ tabBarLabel: tabLabel("Dashboard") }}
          >
            {() => (
              <DashboardScreen
                pets={db.pets}
                clients={db.clients}
                transactions={db.transactions}
              />
            )}
          </Tabs.Screen>

          <Tabs.Screen name="Scan" options={{ tabBarLabel: tabLabel("Scan") }}>
            {() => (
              <ScannerScreen
                pets={db.pets}
                clients={db.clients}
                transactions={db.transactions}
                onRecord={recordTransaction}
              />
            )}
          </Tabs.Screen>

          <Tabs.Screen
            name="Requests"
            options={{ tabBarLabel: tabLabel("Requests") }}
          >
            {() => (
              <CardRequestsScreen
                pets={db.pets}
                clients={db.clients}
                onRelease={releaseCard}
                onDecline={declineCard}
              />
            )}
          </Tabs.Screen>

          <Tabs.Screen
            name="Clients"
            options={{ tabBarLabel: tabLabel("Clients") }}
          >
            {() => (
              <ClientsScreen
                clients={db.clients}
                pets={db.pets}
                branches={db.branches}
                onAddClient={addClient}
              />
            )}
          </Tabs.Screen>
        </Tabs.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

/** Full-screen pet detail, dismissed by the back control at its top. */
function PetDetailOverlay({
  pet,
  transactions,
  onAvailCard,
  onClose,
}: {
  pet: Pet;
  transactions: Transaction[];
  onAvailCard: (petId: number, photo: string) => void;
  onClose: () => void;
}) {
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: T.bg,
      }}
    >
      <PetDetailScreen
        pet={pet}
        transactions={transactions}
        onAvailCard={onAvailCard}
        onBack={onClose}
      />
    </View>
  );
}
