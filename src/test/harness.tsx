import { useState, type ReactNode } from "react";
import { render } from "@testing-library/react";
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

export interface DbSeed {
  branches?: Branch[];
  branchVets?: BranchVets;
  accounts?: Account[];
  clients?: Client[];
  pets?: Pet[];
  promotions?: Promotion[];
  appointments?: Appointment[];
  transactions?: Transaction[];
  registrations?: Registration[];
  user?: AuthUser | null;
}

/**
 * Holds the `db` bag in real React state so tests exercise the same
 * write-then-rerender path the app uses, rather than asserting on spies.
 */
function DbProvider({
  seed,
  children,
}: {
  seed: DbSeed;
  children: (db: Db) => ReactNode;
}) {
  const [branches, setBranches] = useState<Branch[]>(seed.branches ?? []);
  const [branchVets, setBranchVets] = useState<BranchVets>(
    seed.branchVets ?? {},
  );
  const [accounts, setAccounts] = useState<Account[]>(seed.accounts ?? []);
  const [clients, setClients] = useState<Client[]>(seed.clients ?? []);
  const [pets, setPets] = useState<Pet[]>(seed.pets ?? []);
  const [promotions, setPromotions] = useState<Promotion[]>(
    seed.promotions ?? [],
  );
  const [appointments, setAppointments] = useState<Appointment[]>(
    seed.appointments ?? [],
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    seed.transactions ?? [],
  );
  const [registrations, setRegistrations] = useState<Registration[]>(
    seed.registrations ?? [],
  );

  const db: Db = {
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
    user: seed.user ?? null,
  };

  return <>{children(db)}</>;
}

export function renderWithDb(ui: (db: Db) => ReactNode, seed: DbSeed = {}) {
  return render(<DbProvider seed={seed}>{ui}</DbProvider>);
}
