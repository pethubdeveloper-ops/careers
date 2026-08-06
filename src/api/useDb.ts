import {
  ACCOUNTS,
  APPOINTMENTS,
  BRANCH_VETS,
  BRANCHES,
  CLIENTS,
  PETS,
  PROMOTIONS,
  SEED_TRANSACTIONS,
} from "@/data/seed";
import { STORAGE_KEYS, usePersist } from "./persist";
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

/**
 * Assembles the shared `db` bag from persisted collections.
 *
 * Lives above the router so switching pages never resets data.
 */
export function useDb(
  user: AuthUser | null,
  registrations: Registration[],
  setRegistrations: React.Dispatch<React.SetStateAction<Registration[]>>,
): Db {
  const [branches, setBranches] = usePersist<Branch[]>(
    STORAGE_KEYS.branches,
    BRANCHES,
  );
  const [branchVets, setBranchVets] = usePersist<BranchVets>(
    STORAGE_KEYS.branchVets,
    BRANCH_VETS,
  );
  const [accounts, setAccounts] = usePersist<Account[]>(
    STORAGE_KEYS.accounts,
    ACCOUNTS,
  );
  const [clients, setClients] = usePersist<Client[]>(
    STORAGE_KEYS.clients,
    CLIENTS,
  );
  const [pets, setPets] = usePersist<Pet[]>(STORAGE_KEYS.pets, PETS);
  const [promotions, setPromotions] = usePersist<Promotion[]>(
    STORAGE_KEYS.promotions,
    PROMOTIONS,
  );
  const [appointments, setAppointments] = usePersist<Appointment[]>(
    STORAGE_KEYS.appointments,
    APPOINTMENTS,
  );
  const [transactions, setTransactions] = usePersist<Transaction[]>(
    STORAGE_KEYS.transactions,
    SEED_TRANSACTIONS,
  );

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
  };
}
