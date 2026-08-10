import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * Storage keys, echoing the web app's names under this app's own prefix.
 *
 * The prefix is not decoration: on a phone the two apps could never meet, but
 * the web build of this app runs on the same origin as the web portal, and
 * unprefixed keys would have them overwrite each other's records — including
 * the version marker, which would leave both wiping the other's data on every
 * launch.
 */
export const STORAGE_PREFIX = "pethub_mobile_";
const PREFIX = STORAGE_PREFIX;

export const STORAGE_KEYS = {
  auth: `${PREFIX}auth`,
  user: `${PREFIX}user`,
  registrations: `${PREFIX}regs`,
  branches: `${PREFIX}branches`,
  branchVets: `${PREFIX}branchvets`,
  accounts: `${PREFIX}accounts`,
  clients: `${PREFIX}clients`,
  pets: `${PREFIX}pets`,
  promotions: `${PREFIX}promotions`,
  appointments: `${PREFIX}appointments`,
  transactions: `${PREFIX}transactions`,
} as const;

/** Bump to discard stored records whose shape has changed. */
export const DATA_VERSION = "1";
const VERSION_KEY = `${PREFIX}data_version`;

/** The signed-in session survives a data reset; nothing else does. */
const SESSION_KEYS: string[] = [STORAGE_KEYS.auth, STORAGE_KEYS.user];

/**
 * Clears stored records left over from an older shape of the data.
 *
 * Call once before anything reads: a half-migrated store is worse than an
 * empty one, because the app renders records missing fields it now relies on.
 */
export async function resetStaleData(): Promise<void> {
  const stored = await AsyncStorage.getItem(VERSION_KEY);
  if (stored === DATA_VERSION) return;

  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter(
    (k) => k.startsWith(PREFIX) && k !== VERSION_KEY && !SESSION_KEYS.includes(k),
  );
  // AsyncStorage v3 dropped the multi* helpers.
  await Promise.all(stale.map((k) => AsyncStorage.removeItem(k)));
  await AsyncStorage.setItem(VERSION_KEY, DATA_VERSION);
}

/**
 * A piece of state kept in AsyncStorage.
 *
 * Unlike the web's localStorage, reads are asynchronous, so the value starts at
 * `initial` and is replaced once the stored copy arrives. `ready` says which of
 * those two you are looking at — write before it flips and you would save the
 * seed data over whatever the user already had.
 */
export function useStored<T>(
  key: string,
  initial: T,
): [T, (update: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled) return;
        if (raw !== null) {
          try {
            setValue(JSON.parse(raw) as T);
          } catch {
            // Unreadable JSON means a corrupt entry; the seed is a better
            // answer than a crash on launch.
          }
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  // Writing is a side effect of the value changing, not of the call that
  // changed it — which keeps the setter a plain setState, updater form and
  // all. The `ready` guard matters: without it the first render would save
  // the seed data over whatever was already stored.
  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(key, JSON.stringify(value));
  }, [key, value, ready]);

  return [value, setValue, ready];
}
