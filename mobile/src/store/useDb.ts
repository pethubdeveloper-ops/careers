import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, resetStaleData, useStored } from "./persist";
import {
  ACCOUNTS,
  APPOINTMENTS,
  BRANCHES,
  BRANCH_VETS,
  CLIENTS,
  PETS,
  PROMOTIONS,
  SEED_TRANSACTIONS,
} from "@/data/seed";
import type {
  Account,
  Appointment,
  AuthUser,
  Branch,
  BranchVets,
  Client,
  Db,
  Pet,
  Promotion,
  Registration,
  Transaction,
} from "@/types";

/** The `Db` bag plus what the app needs to know before it can render. */
export interface MobileDb extends Db {
  ready: boolean;
  setUser: (user: AuthUser | null) => void;
}

/**
 * Assembles the shared data bag from stored collections.
 *
 * Same contract as the web app's `useDb` — screens take a `Db` and never learn
 * where the records came from — so replacing this with API calls later touches
 * only this file.
 */
export function useDb(): MobileDb {
  const [migrated, setMigrated] = useState(false);
  useEffect(() => {
    void resetStaleData().then(() => setMigrated(true));
  }, []);

  const [branches, setBranches, r1] = useStored<Branch[]>(
    STORAGE_KEYS.branches,
    BRANCHES,
  );
  const [branchVets, setBranchVets, r2] = useStored<BranchVets>(
    STORAGE_KEYS.branchVets,
    BRANCH_VETS,
  );
  const [accounts, setAccounts, r3] = useStored<Account[]>(
    STORAGE_KEYS.accounts,
    ACCOUNTS,
  );
  const [clients, setClients, r4] = useStored<Client[]>(
    STORAGE_KEYS.clients,
    CLIENTS,
  );
  const [pets, setPets, r5] = useStored<Pet[]>(STORAGE_KEYS.pets, PETS);
  const [promotions, setPromotions, r6] = useStored<Promotion[]>(
    STORAGE_KEYS.promotions,
    PROMOTIONS,
  );
  const [appointments, setAppointments, r7] = useStored<Appointment[]>(
    STORAGE_KEYS.appointments,
    APPOINTMENTS,
  );
  const [transactions, setTransactions, r8] = useStored<Transaction[]>(
    STORAGE_KEYS.transactions,
    SEED_TRANSACTIONS,
  );
  const [registrations, setRegistrations, r9] = useStored<Registration[]>(
    STORAGE_KEYS.registrations,
    [],
  );
  const [user, setUser, r10] = useStored<AuthUser | null>(
    STORAGE_KEYS.user,
    null,
  );

  const ready =
    migrated && r1 && r2 && r3 && r4 && r5 && r6 && r7 && r8 && r9 && r10;

  return {
    branches,
    setBranches,
    branchVets,
    setBranchVets,
    accounts,
    setAccounts,
    clients,
    setClients,
    pets,
    setPets,
    promotions,
    setPromotions,
    appointments,
    setAppointments,
    transactions,
    setTransactions,
    registrations,
    setRegistrations,
    user,
    setUser,
    ready,
  } as MobileDb;
}

/** Wipes every stored record, for the "reset demo data" action. */
export async function clearAllData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await Promise.all(
    keys
      .filter((k) => k.startsWith("pethub_"))
      .map((k) => AsyncStorage.removeItem(k)),
  );
}
