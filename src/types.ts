/**
 * Domain models for Pet Hub Rewards.
 *
 * These mirror the shapes the design prototype used. They are deliberately the
 * single source of truth for both the local (localStorage) data layer and any
 * real API that replaces it later — see `src/api/`.
 */

export type ActiveStatus = "Active" | "Inactive";
export type PrintStatus = "Printed" | "Pending" | "N/A";
export type RegistrationStatus = "Pending" | "Approved" | "Denied";
export type AccountType = "Client" | "Staff";
export type PromotionStatus = "Active" | "Inactive";
export type AppointmentStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled"
  | "No-show";

export interface Branch {
  id: number;
  name: string;
  email: string;
  /** Seeded contact number, shown in the map popup. */
  phone?: string;
  /** Contact number captured by the Branches table editor. */
  contact?: string;
  location: string;
  lat?: number;
  lng?: number;
}

export interface Account {
  id: number;
  branch: string;
  email: string;
  accountName: string;
  status: ActiveStatus;
  dateCreated: string;
}

/** Staff who can sign in to the admin portal. */
export interface Admin {
  email: string;
  name: string;
  role: string;
}

export interface Client {
  id: number;
  branch: string;
  email: string;
  contact: string;
  name: string;
  status: ActiveStatus;
  /** Data URL — replace with real file storage when a backend lands. */
  avatar?: string | null;
  cover?: string | null;
}

export interface Pet {
  id: number;
  clientId: number;
  name: string;
  membershipNo: string;
  /** Data URL — replace with real file storage when a backend lands. */
  photo: string | null;
  species: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  color: string;
  birthday: string;
  notes: string;
  hasCard: boolean;
  branch: string;
  email: string;
  /** MM/DD/YYYY. Loyalty cards expire one year after this date. */
  membershipDate: string;
  printStatus: PrintStatus;
  spayed?: string;
  /** Set when a client avails a card and admin has not released it yet. */
  cardPending?: boolean;
  /** Data URL of the QR image uploaded at card release. */
  qr?: string | null;
}

export interface Transaction {
  id: number;
  petId: number;
  transactionId: string;
  amount: number;
  pointsGained: number;
  pointsUsed: number;
  transactBy: string;
  /** Original filename of the uploaded receipt, or "—" when none. */
  receipt: string | null;
  /** Data URL of the receipt image/PDF. Replace with a storage key later. */
  receiptData?: string | null;
  receiptType?: string | null;
  date: string;
}

export interface PromotionLog {
  id: number;
  /** Locale-formatted send timestamp. */
  date: string;
  /** How many clients the promo reached. */
  recipients: number;
  emails: string[];
}

export interface Promotion {
  id: number;
  title: string;
  details: string;
  status: PromotionStatus;
  sendings: number;
  logs: PromotionLog[];
}

export interface Appointment {
  id: number;
  petId: number;
  clientId: number;
  branch: string;
  service: string;
  vet: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
}

/** A pending request to join the portal, raised from the register screen. */
export interface Registration {
  id: number;
  name: string;
  email: string;
  branch: string;
  accountType: AccountType;
  role: string;
  contact: string;
  password: string;
  status: RegistrationStatus;
  requestedAt: string;
  /**
   * Photo or scan of the applicant's valid ID, attached at sign-up so an admin
   * can verify who they are before approving.
   *
   * Held as a data URL by the local store. This is identity-document material:
   * when a backend lands it belongs in access-controlled storage, not in the
   * record itself. See the note in README.
   */
  idImage?: string | null;
  idName?: string | null;
  idType?: string | null;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  /** True when the signed-in account is a pet owner, not clinic staff. */
  isClient: boolean;
  branch?: string;
  clientId?: number;
}

/** Veterinarians keyed by branch name. */
export type BranchVets = Record<string, string[]>;

/**
 * The shared data bag threaded through every page. Each collection is paired
 * with its setter so pages can mutate state without prop-drilling callbacks.
 *
 * When a real backend arrives, keep this interface and back it with server
 * data + mutations instead of localStorage.
 */
export interface Db {
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  branchVets: BranchVets;
  setBranchVets: React.Dispatch<React.SetStateAction<BranchVets>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  registrations: Registration[];
  setRegistrations: React.Dispatch<React.SetStateAction<Registration[]>>;
  user: AuthUser | null;
}
