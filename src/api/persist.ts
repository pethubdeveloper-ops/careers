import { useEffect, useState } from "react";

/**
 * The storage adapter the app reads and writes through.
 *
 * Swapping this for a real backend is the intended migration path: implement
 * the same two methods against your API (or wrap TanStack Query / SWR) and the
 * pages above it never change.
 */
export interface StorageAdapter {
  read<T>(key: string, fallback: T): T;
  write<T>(key: string, value: T): void;
}

export const localStorageAdapter: StorageAdapter = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded or storage unavailable — non-fatal in the prototype */
    }
  },
};

let adapter: StorageAdapter = localStorageAdapter;

/** Replace the storage backend (used by tests, and by a future API layer). */
export function setStorageAdapter(next: StorageAdapter): void {
  adapter = next;
}

/**
 * State that survives a refresh, keyed by a stable storage key.
 *
 * Behaves exactly like `useState` from the caller's side, so pages stay
 * agnostic about where the data actually lives.
 */
export function usePersist<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => adapter.read(key, initial));

  useEffect(() => {
    adapter.write(key, val);
  }, [key, val]);

  return [val, setVal];
}

/**
 * Bump whenever the seed data changes shape or content.
 *
 * Persisted values win over the seeds, so without this a browser that has
 * already run the app would keep showing the old records forever.
 */
export const DATA_VERSION = "2";
const VERSION_KEY = "pethub_data_version";

export const STORAGE_KEYS = {
  auth: "pethub_auth",
  user: "pethub_user",
  registrations: "pethub_regs",
  branches: "pethub_branches",
  branchVets: "pethub_branchvets",
  accounts: "pethub_accounts",
  clients: "pethub_clients",
  pets: "pethub_pets",
  promotions: "pethub_promotions",
  appointments: "pethub_appointments",
  transactions: "pethub_transactions",
} as const;

/** Keys holding the signed-in session rather than records. */
const SESSION_KEYS: string[] = [STORAGE_KEYS.auth, STORAGE_KEYS.user];

/**
 * Clears stored records when the app ships new seed data, so everyone starts
 * from the same place instead of keeping whatever their browser cached. The
 * signed-in session survives, so nobody is logged out by an update.
 */
export function resetStaleData(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) === DATA_VERSION) return;

    Object.keys(localStorage)
      .filter(
        (k) =>
          k.startsWith("pethub_") &&
          k !== VERSION_KEY &&
          !SESSION_KEYS.includes(k),
      )
      .forEach((k) => localStorage.removeItem(k));

    localStorage.setItem(VERSION_KEY, DATA_VERSION);
  } catch {
    /* storage unavailable — nothing to migrate */
  }
}
